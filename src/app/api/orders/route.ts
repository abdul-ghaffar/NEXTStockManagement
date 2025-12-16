import { NextResponse } from "next/server";
import { createOrder, updateOrder } from "@/db/orders";

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

        // If this payload contains an existing order id, update instead of create
        if (body.orderId || body.OrderID) {
            const id = body.orderId || body.OrderID;
            const result = await updateOrder(Number(id), body);
            return NextResponse.json(result);
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
