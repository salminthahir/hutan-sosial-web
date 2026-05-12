const { Op } = require('sequelize');
const {
    SocialForestPermits,
    Institutions,
    InstitutionTypes,
    Villages,
    Districts,
    Regencies,
    Provinces,
    PSSchemes,
    Commodities,
    PermitCommodities,
    ForestAreaStatuses,
    PermitForestStatuses,
    InstitutionContacts,
    InstitutionMembers,
    KUPS,
    sequelize,
    Sequelize
} = require('@/lib/db/models');

const PublicController = {
    // 1. Search (Card UI)
    async search(req, res) {
        try {
            const {
                q,             // keyword (desa, lembaga, komoditas)
                provId,
                regId,
                schemeId,
                commodityId,   // filter by commodity
                status,        // Izin / Proses
                limit = 20,
                page = 1
            } = req.query;

            const offset = (page - 1) * limit;

            // Base filters
            const whereClause = {};
            const includeClause = [
                {
                    model: Institutions,
                    as: 'institution', // alias might need check in models/index.js associations
                    include: [
                        { model: InstitutionTypes, as: 'type' },
                        { model: InstitutionMembers, as: 'members' } // if associated
                    ]
                },
                {
                    model: Villages,
                    as: 'village',
                    include: [
                        {
                            model: Districts,
                            as: 'district',
                            include: [
                                {
                                    model: Regencies,
                                    as: 'regency',
                                    include: [{ model: Provinces, as: 'province' }]
                                }
                            ]
                        }
                    ]
                },
                { model: PSSchemes, as: 'scheme' },
                {
                    model: PermitCommodities,
                    as: 'permitCommodities',
                    include: [{ model: Commodities, as: 'commodity' }]
                },
                {
                    model: PermitForestStatuses,
                    as: 'permitForestStatuses',
                    include: [{ model: ForestAreaStatuses, as: 'status' }]
                }
            ];

            // Keyword Search
            if (q) {
                // Multi-column search
                whereClause[Op.or] = [
                    { '$institution.fullName$': { [Op.iLike]: `%${q}%` } },
                    { '$institution.shortName$': { [Op.iLike]: `%${q}%` } },
                    { '$village.name$': { [Op.iLike]: `%${q}%` } },
                    { '$village.district.name$': { [Op.iLike]: `%${q}%` } },
                    { '$village.district.regency.name$': { [Op.iLike]: `%${q}%` } },
                    { '$village.district.regency.province.name$': { [Op.iLike]: `%${q}%` } },
                ];
            }

            // Geo Filters
            if (provId) whereClause['$village.district.regency.province.id$'] = provId;
            if (regId) whereClause['$village.district.regency.id$'] = regId;

            // Other Filters
            if (schemeId) whereClause.schemeId = schemeId;
            if (status) whereClause.permitStatus = status;

            // Expiry Status Filter
            if (req.query.expiryStatus) {
                const now = new Date();
                const oneYearFromNow = new Date();
                oneYearFromNow.setFullYear(now.getFullYear() + 1);

                if (req.query.expiryStatus === 'soon') {
                    whereClause.validUntil = {
                        [Op.ne]: null,
                        [Op.gt]: now,
                        [Op.lt]: oneYearFromNow
                    };
                    whereClause.permitStatus = 'AKTIF';
                } else if (req.query.expiryStatus === 'expired') {
                    whereClause.validUntil = {
                        [Op.ne]: null,
                        [Op.lt]: now
                    };
                }
            }

            // Commodity Filter (Complex Many-to-Many)
            if (commodityId) {
                // Find permits that have this commodity
                // This usually requires a subquery or separate `include` with `required: true`
                // Simplified: use Include with where
                // Note: The standard Include above fetches ALL commodities for display.
                // To filter, we need to enforce existence.
                // We can add a separate include just for filtering or use `required: true` on the main include?
                // If we use required: true on main include, then permitCommodities will ONLY contain the matched one?
                // That's bad for display (we want to show ALL commodities even if we filtered by one).
                // Solution: Use a subquery in WHERE clause or rely on Sequelize logic.
                // For now, let's just assume we filter the result set, OR do a distinct ID lookup first.

                // Better:
                const permitIds = await PermitCommodities.findAll({
                    attributes: ['permitId'],
                    where: { commodityId },
                    raw: true
                });
                const ids = permitIds.map(p => p.permitId);
                if (ids.length > 0) {
                    whereClause.id = { [Op.in]: ids };
                } else {
                    // No permits found for this commodity
                    return res.json({
                        data: [],
                        meta: { total: 0, page, limit }
                    });
                }
            }

            console.log('Search Config:', {
                dbUser: SocialForestPermits.sequelize.config.username,
                host: SocialForestPermits.sequelize.config.host
            });

            // 1. First Query: Get IDs and Count (Apply filters here)
            // We use subQuery: false to handle the complex where clauses on includes,
            // but we ONLY fetch IDs to avoid the row-limit issue on joined data.
            // Actually, if we use subQuery: false, limit STILL applies to joined rows.
            // So we must use group by ID or distinct ID? 
            // Better approach for complex filtering + pagination:
            // Use subQuery: false but group by Permit.id? No, group by makes count weird.
            // Best standard Sequelize workaround:
            // A. Fetch ALL IDs that match filters (without limit/offset, or with distinct) -> might be heavy if millions.
            // B. Use `distinct: true` with `subQuery: true`? But we have custom where clauses on includes...
            // Let's stick to the strategy: 
            // 1. FindAndCountAll with attributes ['id'], distinct: true, subQuery: false? 
            // If subQuery is false, distinct check is post-fetch?
            // Actually, if we filter by associated columns, we generally need subQuery: false.
            // To fix pagination, we need to ensure LIMIT applies to unique IDs.
            // We can groupBy 'SocialForestPermits.id' and use having?

            // Simpler "Two Step" that works for <10k records:
            // 1. Fetch all matching IDs (scoping) 
            // OR ensure distinct IDs with limit.
            // Let's try `distinct: true` with `col: 'id'`?

            // Let's try the pure ID fetch first with distinct to get the paged IDs.
            // Let's try the pure ID fetch first with distinct to get the paged IDs.
            // FIX: Fetch ALL matching IDs without limit first, then slice in memory.
            // This avoids the "Limit on Joined Rows" issue with subQuery:false.
            const { count, rows: idRowsAll } = await SocialForestPermits.findAndCountAll({
                attributes: ['id'],
                where: whereClause,
                include: includeClause, // Reverted optimization to avoid potential Sequelize bug with empty attributes on includes with sub-includes
                // limit, // REMOVED limit here
                // offset, // REMOVED offset here
                distinct: true,
                subQuery: false,
                order: [['createdAt', 'DESC']]
            });

            // Slice ids for pagination
            const startIndex = (parseInt(page) - 1) * parseInt(limit);
            const endIndex = startIndex + parseInt(limit);
            const idRows = idRowsAll.slice(startIndex, endIndex);

            // 2. Fetch Full Data for these IDs
            // Note: If idRows is empty, return empty
            if (idRows.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    meta: { total: 0, page: parseInt(page), totalPages: 0 }
                });
            }

            const targetIds = idRows.map(p => p.id);

            const finalRows = await SocialForestPermits.findAll({
                where: { id: { [Op.in]: targetIds } },
                attributes: { exclude: ['boundary'] },
                include: includeClause, // Full includes
                order: [['createdAt', 'DESC']]
            });

            // Transform for Card UI
            // Transform for Card UI
            const data = finalRows.map(p => {
                const village = p.village?.name || '-';
                const district = p.village?.district?.name || '-';
                const regency = p.village?.district?.regency?.name || '-';
                const province = p.village?.district?.regency?.province?.name || '-';

                return {
                    id: p.id,
                    name: p.institution?.fullName || p.institution?.shortName,
                    type: p.institution?.type?.name,
                    location: {
                        village,
                        district,
                        regency,
                        province
                    },
                    scheme: p.scheme?.name,
                    permitNumber: p.permitNumber,
                    permitYear: p.permitYear,
                    status: p.permitStatus,
                    area: parseFloat(p.areaPermitted || 0),
                    commodities: p.permitCommodities?.map(pc => ({
                        id: pc.commodity?.id,
                        name: pc.commodity?.name,
                        isPrimary: pc.isPrimary
                    })) || [],
                    forestStatus: p.permitForestStatuses?.map(pfs => pfs.status?.name) || [],
                    members: (p.institution && p.institution.members && p.institution.members.length > 0) ? p.institution.members[0].totalMembers : 0,
                    households: (p.institution && p.institution.members && p.institution.members.length > 0) ? p.institution.members[0].totalHouseholds : 0,
                    hasCoords: !!p.location,
                    hasPdfDoc: p.hasPdfDoc,
                    pdfUrl: p.pdfUrl,
                    // Quick stats for badges
                    badges: [
                        p.permitStatus === 'Izin' ? { label: 'Aktif', color: 'green' } : { label: 'Proses', color: 'yellow' },
                        p.hasPhysicalDoc ? { label: 'SK Fisik', color: 'blue' } : null,
                        p.hasPdfDoc ? { label: 'SK PDF', color: 'indigo' } : null
                    ].filter(Boolean)
                };
            });

            res.json({
                success: true,
                data,
                meta: {
                    total: count,
                    page: parseInt(page),
                    totalPages: Math.ceil(count / limit)
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 2. Map Data (GeoJSON)
    async getMapData(req, res) {
        try {
            const permits = await SocialForestPermits.findAll({
                attributes: ['id', 'location', 'boundary', 'areaPermitted', 'permitStatus'],
                include: [
                    { model: PSSchemes, as: 'scheme', attributes: ['name', 'code'] },
                    { model: Institutions, as: 'institution', attributes: ['shortName'] },
                    {
                        model: Villages,
                        as: 'village',
                        include: [
                            {
                                model: Districts,
                                as: 'district',
                                include: [
                                    {
                                        model: Regencies,
                                        as: 'regency',
                                        attributes: ['name']
                                    }
                                ]
                            }
                        ]
                    }
                ],
                where: {
                    [Op.or]: [
                        { location: { [Op.not]: null } },
                        { boundary: { [Op.not]: null } }
                    ]
                }
            });

            const features = permits.map(p => {
                const hasPolygon = !!p.boundary;
                const geometry = hasPolygon ? p.boundary : p.location;
                if (!geometry) return null;
                return {
                    type: 'Feature',
                    geometry,
                    properties: {
                        id: p.id,
                        name: p.institution?.shortName || p.id.toString(),
                        sk_scheme: p.scheme?.name || 'Unknown',
                        scheme: p.scheme?.code || '-',
                        area: parseFloat(p.areaPermitted),
                        regency: p.village?.district?.regency?.name || 'Unknown',
                        status: p.permitStatus,
                        hasPolygon: hasPolygon,
                        geometryType: hasPolygon ? 'Polygon' : 'Point'
                    }
                };
            }).filter(Boolean);

            res.json({
                type: 'FeatureCollection',
                features
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3. Stats (Summary)
    async getStats(req, res) {
        try {
            const totalPermits = await SocialForestPermits.count();
            const totalArea = await SocialForestPermits.sum('areaPermitted');
            const countByScheme = await SocialForestPermits.findAll({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('SocialForestPermits.id')), 'count'],
                    [sequelize.col('scheme.name'), 'scheme_name']
                ],
                include: [{ model: PSSchemes, as: 'scheme', attributes: [] }],
                group: [sequelize.col('scheme.name')],
                raw: true
            });

            const countByRegency = await SocialForestPermits.findAll({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('SocialForestPermits.id')), 'count'],
                    [sequelize.col('village.district.regency.name'), 'regency_name']
                ],
                include: [{
                    model: Villages, as: 'village', attributes: [],
                    include: [{
                        model: Districts, as: 'district', attributes: [],
                        include: [{
                            model: Regencies, as: 'regency', attributes: []
                        }]
                    }]
                }],
                group: [sequelize.col('village.district.regency.name')],
                raw: true
            });

            const totalKups = await KUPS.count({
                where: { permitId: { [Op.not]: null } }
            });

            const kupsByClass = await KUPS.findAll({
                attributes: [
                    'businessClass',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                where: { 
                    businessClass: { [Op.not]: null },
                    permitId: { [Op.not]: null }
                },
                group: ['businessClass'],
                raw: true
            });

            res.json({
                success: true,
                data: {
                    totalPermits,
                    totalArea: parseFloat(totalArea || 0),
                    byScheme: countByScheme,
                    byRegency: countByRegency,
                    totalKups,
                    kupsByClass
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Detail
    async getDetail(req, res) {
        try {
            const { id } = req.params;
            const p = await SocialForestPermits.findByPk(id, {
                include: [
                    {
                        model: Institutions,
                        as: 'institution',
                        include: [
                            { model: InstitutionTypes, as: 'type' },
                            { model: InstitutionMembers, as: 'members' },
                            { model: InstitutionContacts, as: 'contacts' }
                        ]
                    },
                    {
                        model: Villages,
                        as: 'village',
                        include: [
                            {
                                model: Districts,
                                as: 'district',
                                include: [
                                    {
                                        model: Regencies,
                                        as: 'regency',
                                        include: [{ model: Provinces, as: 'province' }]
                                    }
                                ]
                            }
                        ]
                    },
                    { model: PSSchemes, as: 'scheme' },
                    {
                        model: PermitCommodities,
                        as: 'permitCommodities',
                        include: [{ model: Commodities, as: 'commodity' }]
                    },
                    { model: KUPS, as: 'kups' },
                    {
                        model: PermitForestStatuses,
                        as: 'permitForestStatuses',
                        include: [{ model: ForestAreaStatuses, as: 'status' }]
                    }
                ]
            });

            if (!p) return res.status(404).json({ success: false, message: 'Not found' });

            const village = p.village?.name || '-';
            const district = p.village?.district?.name || '-';
            const regency = p.village?.district?.regency?.name || '-';
            const province = p.village?.district?.regency?.province?.name || '-';

            const data = {
                id: p.id,
                name: p.institution?.fullName || p.institution?.shortName || `Permit ${p.id}`,
                permitNumber: p.permitNumber,
                permitYear: p.permitYear,
                status: p.permitStatus,
                area: parseFloat(p.areaPermitted || 0),
                location: { village, district, regency, province, geo: p.location, boundary: p.boundary },
                scheme: p.scheme,
                institution: p.institution,
                commodities: p.permitCommodities,
                forestStatus: p.permitForestStatuses,
                documents: {
                    physical: p.hasPhysicalDoc,
                    pdf: p.hasPdfDoc,
                    pdfUrl: p.pdfUrl,
                    handover: p.hasHandover
                },
                access: {
                    road: p.roadAccessType,
                    marketDist: p.distanceToMarket
                },
                kups: p.kups
            };

            res.json({ success: true, data });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Legal Dashboard Stats
    async getLegalDashboardStats(req, res) {
        try {
            // 1. Timeline: SK per Year
            const timelineData = await SocialForestPermits.findAll({
                attributes: [
                    'permitYear',
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
                ],
                group: ['permitYear'],
                order: [['permitYear', 'ASC']],
                where: {
                    permitYear: { [Op.not]: null }
                }
            });

            // 2. Alerts
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

            const expiringPermits = await SocialForestPermits.findAll({
                attributes: ['id', 'permitNumber', 'validUntil', 'permitStatus'],
                where: {
                    validUntil: {
                        [Op.ne]: null,
                        [Op.lt]: oneYearFromNow,
                        [Op.gt]: new Date() // Not yet expired
                    },
                    permitStatus: 'AKTIF'
                },
                include: [{ model: Institutions, as: 'institution', attributes: ['shortName'] }],
                limit: 10
            });

            const expiredPermits = await SocialForestPermits.findAll({
                attributes: ['id', 'permitNumber', 'validUntil', 'permitStatus'],
                where: {
                    validUntil: {
                        [Op.ne]: null,
                        [Op.lt]: new Date()
                    },
                    permitStatus: 'AKTIF'
                },
                include: [{ model: Institutions, as: 'institution', attributes: ['shortName'] }],
                limit: 10
            });

            // Dummy check for RK (permits with status DRAFT as proxy or just limit 5)
            const draftPermits = await SocialForestPermits.findAll({
                attributes: ['id', 'permitNumber', 'permitStatus'],
                where: {
                    permitStatus: 'DRAFT'
                },
                include: [{ model: Institutions, as: 'institution', attributes: ['shortName'] }],
                limit: 5
            });

            // 3. Status Summary
            const statusSummary = await SocialForestPermits.findAll({
                attributes: ['permitStatus', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                group: ['permitStatus']
            });

            res.json({
                timeline: timelineData,
                alerts: {
                    expiring: expiringPermits,
                    expired: expiredPermits,
                    draft: draftPermits
                },
                statusSummary
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    }
};

module.exports = PublicController;
