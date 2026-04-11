const bcrypt = require('bcryptjs');
const { AdminUsers, Regencies } = require('@/lib/db/models');

const UserAdminController = {
    // 1. List all admin users
    async list(req, res) {
        try {
            const users = await AdminUsers.findAll({
                attributes: ['id', 'username', 'email', 'role', 'regencyId', 'isActive', 'lastLoginAt', 'createdAt'],
                include: [{
                    model: Regencies,
                    as: 'regency',
                    attributes: ['id', 'name']
                }],
                order: [['id', 'ASC']]
            });

            res.json({ success: true, data: users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 2. Get single user
    async get(req, res) {
        try {
            const user = await AdminUsers.findByPk(req.params.id, {
                attributes: { exclude: ['passwordHash'] },
                include: [{
                    model: Regencies,
                    as: 'regency',
                    attributes: ['id', 'name']
                }]
            });

            if (!user) {
                return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
            }

            res.json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // 3. Create new admin user
    async create(req, res) {
        try {
            const { username, email, password, role = 'admin', regencyId } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ success: false, message: 'Username, email, dan password harus diisi' });
            }

            // Check if role admin must have regencyId
            if (role === 'admin' && !regencyId) {
                return res.status(400).json({ success: false, message: 'Admin kabupaten harus memiliki regencyId' });
            }

            // Check duplicate
            const existing = await AdminUsers.findOne({
                where: {
                    [require('sequelize').Op.or]: [{ username }, { email }]
                }
            });
            if (existing) {
                return res.status(409).json({ success: false, message: 'Username atau email sudah digunakan' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            const newUser = await AdminUsers.create({
                username,
                email,
                passwordHash,
                role,
                regencyId: role === 'superadmin' ? null : regencyId,
                isActive: true
            });

            res.json({
                success: true,
                message: 'User berhasil dibuat',
                data: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    regencyId: newUser.regencyId
                }
            });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Update user
    async update(req, res) {
        try {
            const { id } = req.params;
            const { username, email, password, role, regencyId, isActive } = req.body;

            const user = await AdminUsers.findByPk(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
            }

            // Prevent self-deactivation
            if (req.adminUser.id === parseInt(id) && isActive === false) {
                return res.status(400).json({ success: false, message: 'Tidak bisa menonaktifkan akun sendiri' });
            }

            const updates = {};
            if (username) updates.username = username;
            if (email) updates.email = email;
            if (role) updates.role = role;
            if (regencyId !== undefined) updates.regencyId = role === 'superadmin' ? null : regencyId;
            if (isActive !== undefined) updates.isActive = isActive;

            // If password is provided, hash it
            if (password) {
                const salt = await bcrypt.genSalt(10);
                updates.passwordHash = await bcrypt.hash(password, salt);
            }

            await user.update(updates);

            res.json({
                success: true,
                message: 'User berhasil diperbarui',
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    regencyId: user.regencyId,
                    isActive: user.isActive
                }
            });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 5. Delete (deactivate) user
    async remove(req, res) {
        try {
            const { id } = req.params;

            // Prevent self-deletion
            if (req.adminUser.id === parseInt(id)) {
                return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri' });
            }

            const user = await AdminUsers.findByPk(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
            }

            // Soft delete (deactivate)
            await user.update({ isActive: false });

            res.json({ success: true, message: 'User berhasil dinonaktifkan' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = UserAdminController;
