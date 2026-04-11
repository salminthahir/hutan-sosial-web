const { createHandler } = require('@/lib/routeAdapter');
const UserAdminController = require('@/lib/controllers/admin/UserAdminController');

export const GET = createHandler(UserAdminController.list, { auth: true, roles: ['superadmin'] });
export const POST = createHandler(UserAdminController.create, { auth: true, roles: ['superadmin'] });
export const dynamic = 'force-dynamic';
