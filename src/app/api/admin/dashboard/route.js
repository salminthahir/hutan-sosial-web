const { createHandler } = require('@/lib/routeAdapter');
const DashboardController = require('@/lib/controllers/admin/DashboardController');

export const GET = createHandler(DashboardController.getStats, { auth: true, regencyScope: true });
export const dynamic = 'force-dynamic';
