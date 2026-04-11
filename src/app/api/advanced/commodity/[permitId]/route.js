const { createHandler } = require('@/lib/routeAdapter');
const CommodityController = require('@/lib/controllers/CommodityController');

export const GET = createHandler(CommodityController.getCommodityData);
export const dynamic = 'force-dynamic';
