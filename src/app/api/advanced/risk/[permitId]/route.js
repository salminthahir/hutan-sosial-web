const { createHandler } = require('@/lib/routeAdapter');
const RiskController = require('@/lib/controllers/RiskController');

export const GET = createHandler(RiskController.getRiskData);
export const dynamic = 'force-dynamic';
