"use client";

import { useEffect, useState } from "react";

type Product = {
    id: number;
    itemCode: string;
    itemName: string;
    price: number;
    qty: number;
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/products")
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setProducts(data);
                } else {
                    console.error("API returned non-array:", data);
                    setProducts([]);
                }
            })
            .catch(err => {
                console.error("Error loading products:", err);
                setProducts([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading products...</div>;

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">Products</h1>

            <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2">Code</th>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Price</th>
                        <th className="border p-2">Qty</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id}>
                            <td className="border p-2">{p.itemCode}</td>
                            <td className="border p-2">{p.itemName}</td>
                            <td className="border p-2">{p.price}</td>
                            <td className="border p-2">{p.qty}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
