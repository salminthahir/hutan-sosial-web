const { createHandler } = require('@/lib/routeAdapter');
const ReferenceAdminController = require('@/lib/controllers/admin/ReferenceAdminController');

export const GET = createHandler(ReferenceAdminController.getVillages, { auth: true, regencyScope: true });
export const dynamic = 'force-dynamic';
