const { createHandler } = require('@/lib/routeAdapter');
const PermitAdminController = require('@/lib/controllers/admin/PermitAdminController');

export const GET = createHandler(PermitAdminController.list, { auth: true, regencyScope: true });
export const POST = createHandler(PermitAdminController.create, { auth: true, regencyScope: true });
export const dynamic = 'force-dynamic';
