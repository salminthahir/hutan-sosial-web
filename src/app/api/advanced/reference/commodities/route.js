const { NextResponse } = require('next/server');

export async function GET() {
    try {
        const { Commodities } = require('@/lib/db/models');
        const comms = await Commodities.findAll({ order: [['name', 'ASC']] });
        return NextResponse.json(comms);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch commodities' }, { status: 500 });
    }
}
export const dynamic = 'force-dynamic';
