const { createHandler } = require('@/lib/routeAdapter');
const AuthController = require('@/lib/controllers/AuthController');

export const GET = createHandler(AuthController.me, { auth: true });
