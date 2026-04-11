import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const db = require('@/lib/db/models');
        await db.sequelize.authenticate();
        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
export const dynamic = 'force-dynamic';
