import { NextResponse } from "next/server";
import { appEmitter, EVENTS } from "@/lib/events";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderIds, closeAllRunning } = body;

        // Dynamic import to avoid ESM/CJS interop issues when the module is hot-reloaded in dev.
        const mod = await import('@/app/server/orders');
        const closeManyOrders = (mod as any).closeManyOrders ?? (mod as any).default?.closeManyOrders;
        const closeAllRunningOrders = (mod as any).closeAllRunningOrders ?? (mod as any).default?.closeAllRunningOrders;

        if (typeof closeManyOrders !== 'function' || typeof closeAllRunningOrders !== 'function') {
            return NextResponse.json({ message: 'Server functions not available' }, { status: 500 });
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

        let result;
        if (closeAllRunning) {
            result = await closeAllRunningOrders(user);
            // Emit a generic close event to trigger refresh on clients
            try {
                appEmitter.emit(EVENTS.ORDER_CLOSED, {
                    orderId: 0,
                    user: user.Name || user.Username || "Admin",
                    userId: user.ID
                });
            } catch (e) { console.error(e); }
        } else if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
            result = await closeManyOrders(orderIds, user);
            // Emit event for recent closed orders (limit to avoid flood)
            try {
                if (orderIds.length <= 20) {
                    orderIds.forEach((id: number) => {
                        appEmitter.emit(EVENTS.ORDER_CLOSED, {
                            orderId: id,
                            user: user.Name || user.Username || "Admin",
                            userId: user.ID
                        });
                    });
                } else {
                    appEmitter.emit(EVENTS.ORDER_CLOSED, {
                        orderId: 0,
                        user: user.Name || user.Username || "Admin",
                        userId: user.ID
                    });
                }
            } catch (e) { console.error(e); }
        } else {
            return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error('Bulk API error:', err);
        return NextResponse.json({ message: 'Failed to process bulk action' }, { status: 500 });
    }
}
