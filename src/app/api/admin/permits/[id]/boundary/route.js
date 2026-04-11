const { createHandler } = require('@/lib/routeAdapter');
const PermitAdminController = require('@/lib/controllers/admin/PermitAdminController');

export const PUT = createHandler(PermitAdminController.updateBoundary, { auth: true, regencyScope: true });
