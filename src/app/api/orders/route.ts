import { NextResponse } from "next/server";
import { createOrder, updateOrder } from "@/db/orders";
import { verifyToken } from "@/lib/jwt";
import { appEmitter, EVENTS } from "@/lib/events";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.tableName || !body.items || body.items.length === 0) {
            return NextResponse.json(
                { message: "Invalid order data" },
                { status: 400 }
            );
        }

        // Extract user from token
        const cookieHeader = request.headers.get("cookie") || "";
        const tokenPair = cookieHeader.split(";").map(s => s.trim()).find(s => s.startsWith("ta_token="));
        let user: any = null;
        if (tokenPair) {
            const token = tokenPair.split("=").slice(1).join("=");
            user = verifyToken(token);
        }

        // If this payload contains an existing order id, update instead of create
        if (body.orderId || body.OrderID) {
            const id = body.orderId || body.OrderID;
            try {
                const result = await updateOrder(Number(id), body, user ? { ID: user.ID, IsAdmin: !!user.IsAdmin } : undefined);

                // Emit event for updated order (Non-blocking)
                try {
                    appEmitter.emit(EVENTS.ORDER_UPDATED, {
                        orderId: id,
                        tableName: body.tableName,
                        user: user ? user.Name || user.Username || "User" : "System",
                        userId: user?.ID,
                        amount: body.netTotal,
                        type: body.orderType
                    });
                } catch (e) {
                    console.error("Notification Error:", e);
                }

                return NextResponse.json(result);
            } catch (err: any) {
                if (err.message?.includes("FORBIDDEN")) {
                    return NextResponse.json({ message: err.message }, { status: 403 });
                }
                throw err;
            }
        }

        // For new orders, set the creator UserID if logged in
        if (user) {
            body.userId = user.ID;
        }

        const result = await createOrder(body);

        // Emit event for new order (Non-blocking)
        try {
            appEmitter.emit(EVENTS.ORDER_CREATED, {
                orderId: result.saleID,
                tableName: body.tableName,
                user: user ? user.Name || user.Username || "User" : "System",
                userId: user?.ID,
                amount: body.netTotal,
                type: body.orderType
            });
        } catch (e) {
            console.error("Notification Error:", e);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Order API Error Details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return NextResponse.json(
            { message: `Failed to create order: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
