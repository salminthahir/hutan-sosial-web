const { createHandler } = require('@/lib/routeAdapter');
const PriorityController = require('@/lib/controllers/PriorityController');

export const GET = createHandler(PriorityController.getPriorityMap);
export const dynamic = 'force-dynamic';
