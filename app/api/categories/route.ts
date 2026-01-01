import { NextResponse } from "next/server";
import { getCategories } from "@/app/server/categories";

export async function GET() {
    try {
        const categories = await getCategories();
        return NextResponse.json(categories);
    } catch (err) {
        console.error('Categories API error:', err);
        return NextResponse.json({ message: 'Failed to load categories' }, { status: 500 });
    }
}
