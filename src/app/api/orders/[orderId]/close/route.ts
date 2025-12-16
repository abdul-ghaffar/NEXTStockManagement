import { NextResponse } from "next/server";

export async function POST(request: Request, context: { params: any }) {
    try {
        const params = await context.params;
        const orderId = parseInt(params.orderId, 10);
        if (Number.isNaN(orderId)) return NextResponse.json({ message: 'Invalid order id' }, { status: 400 });

        // Dynamic import to avoid ESM/CJS interop issues when the module is hot-reloaded in dev.
        const mod = await import('@/db/orders');
    const closeOrder = (mod as any).closeOrder ?? (mod as any).default?.closeOrder;
        if (typeof closeOrder !== 'function') {
            console.error('closeOrder is not a function in orders module', Object.keys(mod));
            return NextResponse.json({ message: 'closeOrder not available' }, { status: 500 });
        }

        const result = await closeOrder(orderId);
        return NextResponse.json(result);
    } catch (err) {
        console.error('Close order API error:', err);
        return NextResponse.json({ message: 'Failed to close order' }, { status: 500 });
    }
}
