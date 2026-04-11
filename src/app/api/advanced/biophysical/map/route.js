const { createHandler } = require('@/lib/routeAdapter');
const BiophysicalController = require('@/lib/controllers/BiophysicalController');

export const GET = createHandler(BiophysicalController.getBiophysicalMap);
export const dynamic = 'force-dynamic';
