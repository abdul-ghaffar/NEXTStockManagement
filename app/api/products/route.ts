import { getProducts } from "@/app/server/products";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const products = await getProducts();
        return NextResponse.json(products);
    } catch (error) {
        console.error("Products API error:", error);
        return NextResponse.json(
            { message: "Failed to load products" },
            { status: 500 }
        );
    }
}
