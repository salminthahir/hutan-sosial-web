const { createHandler } = require('@/lib/routeAdapter');
const PublicController = require('@/lib/controllers/PublicController');

export const GET = createHandler(PublicController.getLegalDashboardStats);
export const dynamic = 'force-dynamic';
