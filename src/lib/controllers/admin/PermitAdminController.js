const { Op, Sequelize } = require('sequelize');
const {
    SocialForestPermits,
    Institutions,
    InstitutionTypes,
    InstitutionMembers,
    Villages,
    Districts,
    Regencies,
    Provinces,
    PSSchemes,
    PermitCommodities,
    Commodities,
    PermitForestStatuses,
    ForestAreaStatuses
} = require('@/lib/db/models');

const PermitAdminController = {
    // 1. List all permits with filtering and pagination
    async list(req, res) {
        try {
            const { page = 1, limit = 10, search = '', scheme = '', status = '', regency = '' } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {};

            // Search by permit number or institution name
            if (search) {
                whereClause[Op.or] = [
                    { permitNumber: { [Op.iLike]: `%${search}%` } },
                    { '$institution.fullName$': { [Op.iLike]: `%${search}%` } },
                    { '$institution.shortName$': { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Filter by scheme
            if (scheme) {
                whereClause.schemeId = scheme;
            }

            // Filter by permit status
            if (status) {
                whereClause.permitStatus = status;
            }

            // Regency scope: auto-filter berdasarkan kabupaten admin
            const regencyFilter = req.regencyScope || (regency ? parseInt(regency) : null);
            if (regencyFilter) {
                whereClause['$village.district.regency.id$'] = regencyFilter;
            }

            const { count, rows } = await SocialForestPermits.findAndCountAll({
                where: whereClause,
                attributes: { exclude: ['boundary'] },
                include: [
                    {
                        model: Institutions,
                        as: 'institution',
                        attributes: ['id', 'shortName', 'fullName']
                    },
                    {
                        model: PSSchemes,
                        as: 'scheme',
                        attributes: ['id', 'name', 'code']
                    },
                    {
                        model: Villages,
                        as: 'village',
                        attributes: ['id', 'name'],
                        include: [
                            {
                                model: Districts,
                                as: 'district',
                                attributes: ['id', 'name'],
                                include: [
                                    {
                                        model: Regencies,
                                        as: 'regency',
                                        attributes: ['id', 'name']
                                    }
                                ]
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
                subQuery: false, // needed for nested where clauses
                distinct: true
            });

            res.json({
                success: true,
                data: rows,
                meta: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching permits:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 2. Get Single Permit details
    async get(req, res) {
        try {
            const { id } = req.params;
            const permit = await SocialForestPermits.findByPk(id, {
                include: [
                    {
                        model: Institutions,
                        as: 'institution',
                        include: [
                            { model: InstitutionTypes, as: 'type' },
                            { model: InstitutionMembers, as: 'members' }
                        ]
                    },
                    {
                        model: PSSchemes,
                        as: 'scheme'
                    },
                    {
                        model: Villages,
                        as: 'village',
                        include: [
                            {
                                model: Districts,
                                as: 'district',
                                include: [{ model: Regencies, as: 'regency' }]
                            }
                        ]
                    },
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
                ]
            });

            if (!permit) {
                return res.status(404).json({ success: false, message: 'Izin tidak ditemukan' });
            }

            res.json({ success: true, data: permit });
        } catch (error) {
            console.error('Error fetching permit details:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 3. Create Permit
    async create(req, res) {
        const t = await SocialForestPermits.sequelize.transaction();
        try {
            const { commodities, forestStatuses, kups, boundary, ...data } = req.body;

            // Optional: Handle empty strings gracefully for numeric/date fields
            Object.keys(data).forEach(key => {
                if (data[key] === '') data[key] = null;
            });

            if (boundary) {
                // Ensure boundary is a valid GeoJSON object
                data.boundary = boundary;
            }

            const newPermit = await SocialForestPermits.create(data, { transaction: t });

            if (commodities && Array.isArray(commodities)) {
                await newPermit.setCommodities(commodities, { transaction: t });
            }
            if (forestStatuses && Array.isArray(forestStatuses)) {
                await newPermit.setForestStatuses(forestStatuses, { transaction: t });
            }

            if (kups && Array.isArray(kups)) {
                const kupsData = kups.map(k => ({ ...k, permitId: newPermit.id }));
                await KUPS.bulkCreate(kupsData, { transaction: t });
            }

            await t.commit();
            res.json({ success: true, message: 'Izin berhasil ditambahkan', data: newPermit });
        } catch (error) {
            await t.rollback();
            console.error('Error creating permit:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Update Permit
    async update(req, res) {
        const t = await SocialForestPermits.sequelize.transaction();
        try {
            const { id } = req.params;
            const { commodities, forestStatuses, kups, boundary, location, ...data } = req.body;

            const permit = await SocialForestPermits.findByPk(id, { transaction: t });
            if (!permit) {
                await t.rollback();
                return res.status(404).json({ success: false, message: 'Izin tidak ditemukan' });
            }

            // Optional: Handle empty strings gracefully for numeric/date fields
            Object.keys(data).forEach(key => {
                if (data[key] === '') data[key] = null;
            });

            if (boundary) {
                // Ensure boundary is a valid GeoJSON object
                data.boundary = boundary;
            }

            await permit.update(data, { transaction: t });

            if (commodities && Array.isArray(commodities)) {
                await permit.setCommodities(commodities, { transaction: t });
            }
            if (forestStatuses && Array.isArray(forestStatuses)) {
                await permit.setForestStatuses(forestStatuses, { transaction: t });
            }

            if (kups && Array.isArray(kups)) {
                await KUPS.destroy({ where: { permitId: id }, transaction: t });
                const kupsData = kups.map(k => ({ ...k, permitId: id }));
                await KUPS.bulkCreate(kupsData, { transaction: t });
            }

            await t.commit();
            res.json({ success: true, message: 'Izin berhasil diperbarui', data: permit });
        } catch (error) {
            await t.rollback();
            console.error('Error updating permit:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 5. Delete Permit (cascade all child data in a transaction)
    async remove(req, res) {
        const t = await SocialForestPermits.sequelize.transaction();
        try {
            const { id } = req.params;
            const permit = await SocialForestPermits.findByPk(id, { transaction: t });
            if (!permit) {
                await t.rollback();
                return res.status(404).json({ success: false, message: 'Izin tidak ditemukan' });
            }

            const {
                PermitLandCovers,
                BiophysicalProfiles,
                CommoditySuitabilities,
                ProductionRecords,
                MarketData,
                EnvironmentalRisks,
                CarryingCapacity,
                PriorityScores,
                MonitoringLogs,
            } = require('@/lib/db/models');

            // Delete all child records that reference this permit via permitId
            await PermitCommodities.destroy({ where: { permitId: id }, transaction: t });
            await PermitForestStatuses.destroy({ where: { permitId: id }, transaction: t });
            await PermitLandCovers.destroy({ where: { permitId: id }, transaction: t });
            await BiophysicalProfiles.destroy({ where: { permitId: id }, transaction: t });
            await CommoditySuitabilities.destroy({ where: { permitId: id }, transaction: t });
            await ProductionRecords.destroy({ where: { permitId: id }, transaction: t });
            await MarketData.destroy({ where: { permitId: id }, transaction: t });
            await EnvironmentalRisks.destroy({ where: { permitId: id }, transaction: t });
            await CarryingCapacity.destroy({ where: { permitId: id }, transaction: t });
            await PriorityScores.destroy({ where: { permitId: id }, transaction: t });
            await MonitoringLogs.destroy({ where: { permitId: id }, transaction: t });

            // 2. Delete the permit itself
            await permit.destroy({ transaction: t });
            await t.commit();

            res.json({ success: true, message: 'Izin dan semua data terkait berhasil dihapus' });
        } catch (error) {
            await t.rollback();
            console.error('Error deleting permit:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },


    // 6. Update Boundary Polygon
    async updateBoundary(req, res) {
        try {
            const { id } = req.params;
            const { geojson } = req.body;

            if (!geojson) {
                return res.status(400).json({ success: false, message: 'Data GeoJSON tidak ditemukan' });
            }

            const geomStr = JSON.stringify(geojson);

            // Use RAW SQL to cleanly ingest GeoJSON 
            await SocialForestPermits.sequelize.query(
                `UPDATE "SocialForestPermits" SET boundary = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) WHERE id = $2`,
                { bind: [geomStr, id] }
            );

            res.json({ success: true, message: 'Batas kawasan berhasil diperbarui' });
        } catch (error) {
            console.error('Error updating boundary:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = PermitAdminController;
