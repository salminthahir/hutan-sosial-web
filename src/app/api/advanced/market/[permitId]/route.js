const { createHandler } = require('@/lib/routeAdapter');
const MarketController = require('@/lib/controllers/MarketController');

export const GET = createHandler(MarketController.getMarketData);
export const dynamic = 'force-dynamic';
