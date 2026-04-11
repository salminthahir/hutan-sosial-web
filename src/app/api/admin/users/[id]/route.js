const { createHandler } = require('@/lib/routeAdapter');
const UserAdminController = require('@/lib/controllers/admin/UserAdminController');

export const GET = createHandler(UserAdminController.get, { auth: true, roles: ['superadmin'] });
export const PUT = createHandler(UserAdminController.update, { auth: true, roles: ['superadmin'] });
export const DELETE = createHandler(UserAdminController.remove, { auth: true, roles: ['superadmin'] });
