const { createHandler } = require('@/lib/routeAdapter');
const BiophysicalController = require('@/lib/controllers/BiophysicalController');

export const GET = createHandler(BiophysicalController.getBiophysicalData);
export const dynamic = 'force-dynamic';
