const { createHandler } = require('@/lib/routeAdapter');
const InstitutionAdminController = require('@/lib/controllers/admin/InstitutionAdminController');

export const GET = createHandler(InstitutionAdminController.get, { auth: true, regencyScope: true });
export const PUT = createHandler(InstitutionAdminController.update, { auth: true, regencyScope: true });
export const DELETE = createHandler(InstitutionAdminController.remove, { auth: true, regencyScope: true });
