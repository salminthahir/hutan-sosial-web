const { createHandler } = require('@/lib/routeAdapter');
const PermitAdminController = require('@/lib/controllers/admin/PermitAdminController');

export const GET = createHandler(PermitAdminController.get, { auth: true, regencyScope: true });
export const PUT = createHandler(PermitAdminController.update, { auth: true, regencyScope: true });
export const DELETE = createHandler(PermitAdminController.remove, { auth: true, regencyScope: true });
