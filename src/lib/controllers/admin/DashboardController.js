const { SocialForestPermits, InstitutionMembers, Institutions, Villages, Districts, Regencies } = require('@/lib/db/models');

const DashboardController = {
    async getStats(req, res) {
        try {
            // Accept optional regency filter if superadmin
            const regencyScope = req.regencyScope || (req.adminUser.role === 'superadmin' && req.query.regencyId ? parseInt(req.query.regencyId) : null);

            // Build where clause based on regency scope
            let permitWhere = {};
            let institutionWhere = {};

            if (regencyScope) {
                // Get all village IDs in this regency
                const villages = await Villages.findAll({
                    attributes: ['id'],
                    include: [{
                        model: Districts,
                        as: 'district',
                        attributes: [],
                        where: { regencyId: regencyScope }
                    }],
                    raw: true
                });
                const villageIds = villages.map(v => v.id);

                permitWhere.villageId = villageIds;

                // Get institution IDs from permits in this regency
                const permits = await SocialForestPermits.findAll({
                    attributes: ['institutionId'],
                    where: { villageId: villageIds },
                    raw: true
                });
                const instIds = [...new Set(permits.map(p => p.institutionId).filter(Boolean))];
                institutionWhere.id = instIds;
            }

            // Get total permits
            const totalPermits = await SocialForestPermits.count({ where: permitWhere });

            // Get total institutions
            const totalInstitutions = await Institutions.count({
                where: Object.keys(institutionWhere).length > 0 ? institutionWhere : undefined
            });

            // Get total area
            const areaSum = await SocialForestPermits.sum('areaPermitted', { where: permitWhere });

            // Get total KK and Members
            let memberWhere = {};
            if (Object.keys(institutionWhere).length > 0) {
                memberWhere.institutionId = institutionWhere.id;
            }
            const totalHouseholds = await InstitutionMembers.sum('totalHouseholds', {
                where: Object.keys(memberWhere).length > 0 ? memberWhere : undefined
            });
            const totalMembers = await InstitutionMembers.sum('totalMembers', {
                where: Object.keys(memberWhere).length > 0 ? memberWhere : undefined
            });

            // Get regency info if scoped
            let regencyInfo = null;
            if (regencyScope) {
                regencyInfo = await Regencies.findByPk(regencyScope, { attributes: ['id', 'name'] });
            }

            res.json({
                success: true,
                data: {
                    totalPermits,
                    totalInstitutions,
                    totalArea: areaSum || 0,
                    totalHouseholds: totalHouseholds || 0,
                    totalMembers: totalMembers || 0,
                    regency: regencyInfo
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = DashboardController;
