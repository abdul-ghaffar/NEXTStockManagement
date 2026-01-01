import { NextResponse } from "next/server";
import { getProductsByCategory } from "@/app/server/categories";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const cat = url.searchParams.get('category');
        if (!cat) return NextResponse.json({ message: 'Category id required' }, { status: 400 });
        const categoryId = parseInt(cat, 10);
        const products = await getProductsByCategory(categoryId);
        return NextResponse.json(products);
    } catch (err) {
        console.error('Products-by-category API error:', err);
        return NextResponse.json({ message: 'Failed to load products' }, { status: 500 });
    }
}
