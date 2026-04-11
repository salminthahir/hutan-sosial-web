const { createHandler } = require('@/lib/routeAdapter');
const SocialController = require('@/lib/controllers/SocialController');

export const GET = createHandler(SocialController.getSocialData);
export const dynamic = 'force-dynamic';
