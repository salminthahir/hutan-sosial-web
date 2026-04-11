const { createHandler } = require('@/lib/routeAdapter');
const InstitutionAdminController = require('@/lib/controllers/admin/InstitutionAdminController');

export const GET = createHandler(InstitutionAdminController.list, { auth: true, regencyScope: true });
export const POST = createHandler(InstitutionAdminController.create, { auth: true, regencyScope: true });
export const dynamic = 'force-dynamic';
