const { createHandler } = require('@/lib/routeAdapter');
const AuthController = require('@/lib/controllers/AuthController');

export const POST = createHandler(AuthController.logout);
