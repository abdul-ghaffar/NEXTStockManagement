import { NextResponse } from 'next/server';
import { getSales } from '@/app/server/orders';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || undefined;
        const orderType = searchParams.get('orderType') || undefined;
        const status = searchParams.get('status') || undefined;

        const data = await getSales(page, limit, search, orderType, status);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
