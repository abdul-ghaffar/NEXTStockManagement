import { NextResponse } from "next/server";
import { createOrder, updateOrder } from "@/db/orders";
import { verifyToken } from "@/lib/jwt";

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
        return NextResponse.json(result);
    } catch (error) {
        console.error("Order API Error:", error);
        return NextResponse.json(
            { message: "Failed to create order" },
            { status: 500 }
        );
    }
}
