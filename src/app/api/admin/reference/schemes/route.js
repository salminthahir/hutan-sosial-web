const { createHandler } = require('@/lib/routeAdapter');
const ReferenceAdminController = require('@/lib/controllers/admin/ReferenceAdminController');

export const GET = createHandler(ReferenceAdminController.getSchemes, { auth: true });
export const dynamic = 'force-dynamic';
