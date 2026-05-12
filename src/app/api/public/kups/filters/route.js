const { createHandler } = require('@/lib/routeAdapter');
const KupsController = require('@/lib/controllers/KupsController');

export const GET = createHandler(KupsController.getFilters);
export const dynamic = 'force-dynamic';
