import { NextResponse } from "next/server";
import { appEmitter, EVENTS } from "@/lib/events";

export async function POST(request: Request, context: { params: any }) {
    try {
        const params = await context.params;
        const orderId = parseInt(params.orderId, 10);
        if (Number.isNaN(orderId)) return NextResponse.json({ message: 'Invalid order id' }, { status: 400 });

        // Dynamic import to avoid ESM/CJS interop issues when the module is hot-reloaded in dev.
        const mod = await import('@/app/server/orders');
        const closeOrder = (mod as any).closeOrder ?? (mod as any).default?.closeOrder;
        if (typeof closeOrder !== 'function') {
            console.error('closeOrder is not a function in orders module', Object.keys(mod));
            return NextResponse.json({ message: 'closeOrder not available' }, { status: 500 });
        }

        // verify JWT token from cookie
        const cookieHeader = request.headers.get("cookie") || "";
        const tokenPair = cookieHeader.split(";").map(s => s.trim()).find(s => s.startsWith("ta_token="));
        let user: any = null;
        if (tokenPair) {
            const token = tokenPair.split("=").slice(1).join("=");
            try {
                const { verifyToken } = await import("@/lib/jwt");
                user = verifyToken(token);
            } catch (err) {
                console.warn("Failed to verify token", err);
            }
        }

        if (!user || !user.IsAdmin) {
            return NextResponse.json({ message: 'Forbidden: admin required' }, { status: 403 });
        }

        const result = await closeOrder(orderId, user);

        // Emit event for closed order (Non-blocking)
        try {
            appEmitter.emit(EVENTS.ORDER_CLOSED, {
                orderId,
                user: user ? user.Name || user.Username || "User" : "System",
                userId: user?.ID
            });
        } catch (e) {
            console.error("Notification Error:", e);
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error('Close order API error:', err);
        return NextResponse.json({ message: 'Failed to close order' }, { status: 500 });
    }
}
