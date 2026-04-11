const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AdminUsers, Regencies } = require('@/lib/db/models');
const { JWT_SECRET } = require('@/lib/auth');

const AuthController = {
    // 1. Login
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email dan password harus diisi' });
            }

            // Find User
            const user = await AdminUsers.findOne({
                where: { email },
                include: [{ model: Regencies, as: 'regency', attributes: ['id', 'name'] }]
            });
            if (!user) {
                return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
            }

            // Check if active
            if (!user.isActive) {
                return res.status(403).json({ success: false, message: 'Akun anda telah dinonaktifkan' });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
            }

            // Update last login
            user.lastLoginAt = new Date();
            await user.save();

            // Generate Token
            const token = jwt.sign(
                { id: user.id, role: user.role, regencyId: user.regencyId },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Login berhasil',
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        regencyId: user.regencyId,
                        regency: user.regency
                    }
                }
            });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
        }
    },

    // 2. Get Current Auth User
    async me(req, res) {
        try {
            const user = req.adminUser; // Injected by requireAuth middleware
            res.json({
                success: true,
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    regencyId: user.regencyId,
                    lastLoginAt: user.lastLoginAt
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
        }
    },

    // 3. Logout
    // In stateless JWT, logout is usually handled client-side by deleting the token.
    // However, an endpoint can return a success message.
    async logout(req, res) {
        res.json({
            success: true,
            message: 'Logout berhasil'
        });
    }
};

module.exports = AuthController;
