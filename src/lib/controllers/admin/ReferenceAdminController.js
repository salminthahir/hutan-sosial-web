const { Op } = require('sequelize');
const {
    Villages,
    Districts,
    Regencies,
    Provinces,
    PSSchemes,
    Commodities,
    ForestAreaStatuses,
    InstitutionTypes
} = require('@/lib/db/models');

const ReferenceAdminController = {
    // 1. Get Villages (for dropdown with search)
    async getVillages(req, res) {
        try {
            const { q = '', limit = 50 } = req.query;
            const whereClause = {};

            if (q) {
                whereClause.name = { [Op.iLike]: `%${q}%` };
            }

            if (req.regencyScope) {
                whereClause['$district.regency.id$'] = req.regencyScope;
            }

            const villages = await Villages.findAll({
                where: whereClause,
                limit: parseInt(limit),
                include: [
                    {
                        model: Districts,
                        as: 'district',
                        attributes: ['id', 'name'],
                        include: [{
                            model: Regencies,
                            as: 'regency',
                            attributes: ['id', 'name'],
                            include: [{
                                model: Provinces,
                                as: 'province',
                                attributes: ['id', 'name']
                            }]
                        }]
                    }
                ],
                order: [['name', 'ASC']]
            });

            res.json({ success: true, data: villages });
        } catch (error) {
            console.error('Error fetching villages:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 2. Get Schemes
    async getSchemes(req, res) {
        try {
            const schemes = await PSSchemes.findAll({
                order: [['name', 'ASC']]
            });
            res.json({ success: true, data: schemes });
        } catch (error) {
            console.error('Error fetching schemes:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 3. Get Commodities
    async getCommodities(req, res) {
        try {
            const items = await Commodities.findAll({
                order: [['name', 'ASC']]
            });
            res.json({ success: true, data: items });
        } catch (error) {
            console.error('Error fetching commodities:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 4. Get Forest Statuses
    async getForestStatuses(req, res) {
        try {
            const items = await ForestAreaStatuses.findAll({
                order: [['name', 'ASC']]
            });
            res.json({ success: true, data: items });
        } catch (error) {
            console.error('Error fetching forest statuses:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 5. Get Institution Types
    async getInstitutionTypes(req, res) {
        try {
            const items = await InstitutionTypes.findAll({
                order: [['name', 'ASC']]
            });
            res.json({ success: true, data: items });
        } catch (error) {
            console.error('Error fetching institution types:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 6. Get Regencies (kabupaten/kota)
    async getRegencies(req, res) {
        try {
            const items = await Regencies.findAll({
                order: [['name', 'ASC']]
            });
            res.json({ success: true, data: items });
        } catch (error) {
            console.error('Error fetching regencies:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = ReferenceAdminController;
