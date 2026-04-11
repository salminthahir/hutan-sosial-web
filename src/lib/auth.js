const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hutan-sosial-super-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Verify auth from request headers.
 * Returns the admin user or null.
 */
async function verifyAuth(request) {
    const { AdminUsers } = require('@/lib/db/models');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await AdminUsers.findByPk(decoded.id);
        if (!user || !user.isActive) return null;
        return user;
    } catch {
        return null;
    }
}

/**
 * Require auth — returns user or throws with status info
 */
async function requireAuth(request) {
    const user = await verifyAuth(request);
    if (!user) {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
    }
    return user;
}

/**
 * Require specific roles
 */
async function requireRole(request, roles) {
    const user = await requireAuth(request);
    if (!roles.includes(user.role)) {
        const error = new Error('Forbidden');
        error.status = 403;
        throw error;
    }
    return user;
}

/**
 * Build regency scope from user
 */
function getRegencyScope(user) {
    if (!user) return null;
    if (user.role === 'superadmin' || !user.regencyId) return null;
    return user.regencyId;
}

/**
 * Sign a JWT token
 */
function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = { verifyAuth, requireAuth, requireRole, getRegencyScope, signToken, JWT_SECRET };
