const { Op } = require('sequelize');
const {
    Institutions,
    InstitutionTypes,
    InstitutionMembers,
    InstitutionContacts
} = require('@/lib/db/models');

const InstitutionAdminController = {
    // 1. List
    async list(req, res) {
        try {
            const { page = 1, limit = 10, search = '' } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {};
            if (search) {
                whereClause[Op.or] = [
                    { fullName: { [Op.iLike]: `%${search}%` } },
                    { shortName: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const { count, rows } = await Institutions.findAndCountAll({
                where: whereClause,
                include: [
                    { model: InstitutionTypes, as: 'type' },
                    { model: InstitutionMembers, as: 'members' }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
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
            console.error('Error fetching institutions:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 2. Get Detail
    async get(req, res) {
        try {
            const { id } = req.params;
            const item = await Institutions.findByPk(id, {
                include: [
                    { model: InstitutionTypes, as: 'type' },
                    { model: InstitutionMembers, as: 'members' },
                    { model: InstitutionContacts, as: 'contacts' }
                ]
            });

            if (!item) {
                return res.status(404).json({ success: false, message: 'Kelembagaan tidak ditemukan' });
            }

            res.json({ success: true, data: item });
        } catch (error) {
            console.error('Error fetching institution details:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 3. Create
    async create(req, res) {
        try {
            const { typeId, shortName, fullName, isActive, chairmanName, penyuluhName, penyuluhPhone, membersCount, householdsCount } = req.body;

            const newInst = await Institutions.create({
                institutionTypeId: typeId || null,
                shortName,
                fullName,
                chairmanName: chairmanName || null,
                isActive: isActive ?? true
            });

            if (membersCount || householdsCount) {
                await InstitutionMembers.create({
                    institutionId: newInst.id,
                    totalMembers: membersCount || 0,
                    totalHouseholds: householdsCount || 0
                });
            }

            if (penyuluhName || penyuluhPhone) {
                const combinedContact = `${penyuluhName || '-'} | ${penyuluhPhone || '-'}`;
                await InstitutionContacts.create({
                    institutionId: newInst.id,
                    contactType: 'penyuluh',
                    contactValue: combinedContact,
                    isPrimary: true
                });
            }

            res.json({ success: true, message: 'Kelembagaan berhasil ditambahkan', data: newInst });
        } catch (error) {
            console.error('Error creating institution:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Update
    async update(req, res) {
        try {
            const { id } = req.params;
            const { typeId, shortName, fullName, isActive, chairmanName, penyuluhName, penyuluhPhone, membersCount, householdsCount } = req.body;

            const inst = await Institutions.findByPk(id);
            if (!inst) {
                return res.status(404).json({ success: false, message: 'Kelembagaan tidak ditemukan' });
            }

            await inst.update({
                institutionTypeId: typeId || inst.institutionTypeId,
                shortName: shortName ?? inst.shortName,
                fullName: fullName ?? inst.fullName,
                chairmanName: chairmanName ?? inst.chairmanName,
                isActive: isActive ?? inst.isActive
            });

            // Update Members if provided
            if (membersCount !== undefined || householdsCount !== undefined) {
                const memberRecord = await InstitutionMembers.findOne({ where: { institutionId: id } });
                if (memberRecord) {
                    await memberRecord.update({
                        totalMembers: membersCount ?? memberRecord.totalMembers,
                        totalHouseholds: householdsCount ?? memberRecord.totalHouseholds
                    });
                } else {
                    await InstitutionMembers.create({
                        institutionId: id,
                        totalMembers: membersCount || 0,
                        totalHouseholds: householdsCount || 0
                    });
                }
            }

            // Update Penyuluh Contact
            if (penyuluhName !== undefined || penyuluhPhone !== undefined) {
                const combinedContact = `${penyuluhName || '-'} | ${penyuluhPhone || '-'}`;
                const contactRecord = await InstitutionContacts.findOne({ where: { institutionId: id, contactType: 'penyuluh' } });
                if (contactRecord) {
                    await contactRecord.update({ contactValue: combinedContact });
                } else {
                    await InstitutionContacts.create({
                        institutionId: id,
                        contactType: 'penyuluh',
                        contactValue: combinedContact,
                        isPrimary: true
                    });
                }
            }

            res.json({ success: true, message: 'Kelembagaan berhasil diperbarui', data: inst });
        } catch (error) {
            console.error('Error updating institution:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 5. Delete
    async remove(req, res) {
        try {
            const { id } = req.params;
            const inst = await Institutions.findByPk(id);
            if (!inst) {
                return res.status(404).json({ success: false, message: 'Kelembagaan tidak ditemukan' });
            }

            // Check for linked permits before deleting
            const { SocialForestPermits } = require('@/lib/db/models');
            const linkedPermitCount = await SocialForestPermits.count({
                where: { institutionId: id }
            });

            if (linkedPermitCount > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Kelembagaan ini terhubung dengan ${linkedPermitCount} SK Perhutanan Sosial dan tidak dapat dihapus. Hapus atau pindahkan SK terkait terlebih dahulu.`,
                    linkedPermits: linkedPermitCount
                });
            }

            // Safe to delete — remove child records first
            await InstitutionMembers.destroy({ where: { institutionId: id } });
            await InstitutionContacts.destroy({ where: { institutionId: id } });

            await inst.destroy();
            res.json({ success: true, message: 'Kelembagaan berhasil dihapus' });
        } catch (error) {
            console.error('Error deleting institution:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

}

module.exports = InstitutionAdminController;
