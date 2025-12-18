import { NextResponse } from 'next/server';
import { getOrder } from '@/db/orders';

export async function GET(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const orderId = parseInt(params.orderId);
        if (isNaN(orderId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const data = await getOrder(orderId);
        if (!data) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
