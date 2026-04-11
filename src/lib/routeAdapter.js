/**
 * Express-to-NextJS Adapter
 * Wraps Express-style controller methods (req, res) to work with Next.js Route Handlers.
 */
const { NextResponse } = require('next/server');

function createHandler(controllerMethod, options = {}) {
    return async function handler(request, context) {
        // Build a fake Express-like req object
        const url = new URL(request.url);
        const searchParams = Object.fromEntries(url.searchParams.entries());

        // Extract params from context (Next.js dynamic routes)
        const params = context?.params ? await context.params : {};

        const req = {
            query: searchParams,
            params: params,
            body: null,
            headers: {
                authorization: request.headers.get('authorization'),
            },
            adminUser: null,
            regencyScope: null,
        };

        // Parse body for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            try {
                req.body = await request.json();
            } catch {
                req.body = {};
            }
        }

        // Handle auth if needed
        if (options.auth) {
            const { requireAuth, requireRole, getRegencyScope } = require('@/lib/auth');
            try {
                if (options.roles) {
                    req.adminUser = await requireRole(request, options.roles);
                } else {
                    req.adminUser = await requireAuth(request);
                }
                if (options.regencyScope) {
                    req.regencyScope = getRegencyScope(req.adminUser);
                    // Also support superadmin filtering by query param
                    if (!req.regencyScope && searchParams.regencyId) {
                        req.regencyScope = parseInt(searchParams.regencyId);
                    }
                }
            } catch (error) {
                return NextResponse.json(
                    { success: false, message: error.message },
                    { status: error.status || 401 }
                );
            }
        }

        // Build a fake Express-like res object
        let responseData = null;
        let responseStatus = 200;

        const res = {
            status(code) {
                responseStatus = code;
                return res;
            },
            json(data) {
                responseData = data;
                return res;
            },
            send(data) {
                responseData = data;
                return res;
            }
        };

        try {
            await controllerMethod(req, res);
            return NextResponse.json(responseData, { status: responseStatus });
        } catch (error) {
            console.error('Route handler error:', error);
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 500 }
            );
        }
    };
}

module.exports = { createHandler };
