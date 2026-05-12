const { Op } = require('sequelize');
const {
    KUPS,
    SocialForestPermits,
    Institutions,
    Villages,
    Districts,
    Regencies,
    Provinces,
    sequelize,
} = require('@/lib/db/models');

const KupsController = {
    /**
     * Search KUPS with filters and pagination
     * GET /api/public/kups?q=&businessClass=&cluster=&page=1&limit=25
     */
    async search(req, res) {
        try {
            const {
                q = '',
                businessClass = '',
                cluster = '',
                page = 1,
                limit = 25,
            } = req.query || {};

            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
            const offset = (pageNum - 1) * limitNum;

            // Build WHERE conditions for KUPS
            const kupsWhere = {};

            if (q) {
                kupsWhere[Op.or] = [
                    { name: { [Op.iLike]: `%${q}%` } },
                    { chairmanName: { [Op.iLike]: `%${q}%` } },
                    { commodities: { [Op.iLike]: `%${q}%` } },
                    { businessType: { [Op.iLike]: `%${q}%` } },
                    { cluster: { [Op.iLike]: `%${q}%` } },
                    { address: { [Op.iLike]: `%${q}%` } },
                ];
            }

            if (businessClass) {
                kupsWhere.businessClass = businessClass;
            }

            if (cluster) {
                kupsWhere.cluster = { [Op.iLike]: `%${cluster}%` };
            }

            const { count, rows } = await KUPS.findAndCountAll({
                where: kupsWhere,
                include: [{
                    model: SocialForestPermits,
                    as: 'permit',
                    attributes: ['id', 'permitNumber', 'permitYear', 'permitStatus'],
                    required: false,
                    include: [
                        {
                            model: Institutions,
                            as: 'institution',
                            attributes: ['fullName', 'shortName'],
                        },
                        {
                            model: Villages,
                            as: 'village',
                            attributes: ['name'],
                            include: [{
                                model: Districts,
                                as: 'district',
                                attributes: ['name'],
                                include: [{
                                    model: Regencies,
                                    as: 'regency',
                                    attributes: ['name'],
                                    include: [{
                                        model: Provinces,
                                        as: 'province',
                                        attributes: ['name'],
                                    }]
                                }]
                            }]
                        }
                    ]
                }],
                order: [
                    // Platinum → Gold → Blue → Silver
                    [sequelize.literal(`CASE 
                        WHEN "KUPS"."businessClass" = 'Platinum' THEN 1 
                        WHEN "KUPS"."businessClass" = 'Gold' THEN 2 
                        WHEN "KUPS"."businessClass" = 'Blue' THEN 3 
                        ELSE 4 
                    END`), 'ASC'],
                    ['name', 'ASC'],
                ],
                limit: limitNum,
                offset,
                distinct: true,
            });

            // Transform response
            const data = rows.map(k => {
                const plain = k.get({ plain: true });
                const permit = plain.permit;
                const village = permit?.village;
                const district = village?.district;
                const regency = district?.regency;

                return {
                    id: plain.id,
                    name: plain.name,
                    chairmanName: plain.chairmanName,
                    commodities: plain.commodities,
                    businessClass: plain.businessClass,
                    businessType: plain.businessType,
                    cluster: plain.cluster,
                    establishedYear: plain.establishedYear,
                    skNumber: plain.skNumber,
                    phoneNumber: plain.phoneNumber,
                    address: plain.address,
                    goldUpgradeYear: plain.goldUpgradeYear,
                    permit: permit ? {
                        id: permit.id,
                        institutionName: permit.institution?.fullName || permit.institution?.shortName || null,
                        permitNumber: permit.permitNumber,
                        village: village?.name || null,
                        district: district?.name || null,
                        regency: regency?.name || null,
                        province: regency?.province?.name || null,
                    } : null,
                };
            });

            res.json({
                success: true,
                data,
                meta: {
                    total: count,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(count / limitNum),
                },
            });

        } catch (error) {
            console.error('KupsController.search error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Get available filter options (clusters & classes)
     * GET /api/public/kups/filters
     */
    async getFilters(req, res) {
        try {
            const [clusters] = await sequelize.query(`
                SELECT DISTINCT "cluster", COUNT(*) as count 
                FROM "KUPS" 
                WHERE "cluster" IS NOT NULL AND "cluster" != '' AND "cluster" != '-'
                GROUP BY "cluster" 
                ORDER BY count DESC
            `);

            const [classes] = await sequelize.query(`
                SELECT "businessClass", COUNT(*) as count 
                FROM "KUPS" 
                WHERE "businessClass" IS NOT NULL
                GROUP BY "businessClass" 
                ORDER BY 
                    CASE 
                        WHEN "businessClass" = 'Platinum' THEN 1 
                        WHEN "businessClass" = 'Gold' THEN 2 
                        WHEN "businessClass" = 'Blue' THEN 3 
                        ELSE 4 
                    END
            `);

            res.json({
                success: true,
                clusters: clusters.map(c => ({ name: c.cluster, count: parseInt(c.count) })),
                classes: classes.map(c => ({ name: c.businessClass, count: parseInt(c.count) })),
            });
        } catch (error) {
            console.error('KupsController.getFilters error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
};

module.exports = KupsController;
