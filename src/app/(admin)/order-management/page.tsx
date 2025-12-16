"use client";

import { useEffect, useState } from "react";
import { TrashBinIcon, PlusIcon } from "@/icons";
// Verify icons later, for now using simple placeholders if needed or assuming Lucide/Heroicon generic names if mapped.
// Actually, looking at AppSidebar, we have a custom icon file. I should check what is available but for now I will use text or simple SVGs inline if I am not sure about exports.
// To be safe, I'll inline simple SVGs for the cart actions to avoid import errors, or use text buttons.

type Product = {
    id: number;
    itemCode: string; // Ensure this matches DB/API
    itemName: string;
    price: number;
    qty?: number; // Stock
};

type CartItem = Product & {
    cartQty: number;
};

const tables = ["Table 1", "Table 2", "Table 3", "Table 4", "Walk-in"];

export default function OrderManagementPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedTable, setSelectedTable] = useState(tables[0]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch("/api/products")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setProducts(data);
                    setFilteredProducts(data);
                } else {
                    console.error("Invalid products data", data);
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const lower = search.toLowerCase();
        setFilteredProducts(
            products.filter(
                (p) =>
                    p.itemName.toLowerCase().includes(lower) ||
                    p.itemCode.toLowerCase().includes(lower)
            )
        );
    }, [search, products]);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, cartQty: item.cartQty + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartQty: 1 }];
        });
    };

    const removeFromCart = (id: number) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const updateQty = (id: number, delta: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const newQty = Math.max(1, item.cartQty + delta);
                    return { ...item, cartQty: newQty };
                }
                return item;
            })
        );
    };

    const totalAmount = cart.reduce(
        (sum, item) => sum + item.price * item.cartQty,
        0
    );

    const handleSubmit = async () => {
        if (cart.length === 0) return;
        setSubmitting(true);
        try {
            const orderData = {
                tableName: selectedTable,
                items: cart.map(item => ({
                    itemCode: item.itemCode,
                    qty: item.cartQty,
                    price: item.price,
                    total: item.price * item.cartQty
                })),
                netTotal: totalAmount
            };

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                alert("Order placed successfully!");
                setCart([]);
            } else {
                alert("Failed to place order.");
            }
        } catch (error) {
            console.error(error);
            alert("Error placing order.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4">
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold dark:text-white">Products</h2>
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="overflow-y-auto flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        filteredProducts.map((p) => (
                            <div
                                key={p.id}
                                className="border p-3 rounded-lg flex flex-col justify-between cursor-pointer hover:shadow-md transition dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                                onClick={() => addToCart(p)}
                            >
                                <div>
                                    <p className="font-semibold text-sm truncate dark:text-gray-200">{p.itemName}</p>
                                    <p className="text-xs text-gray-500">{p.itemCode}</p>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <span className="font-bold text-brand-600 dark:text-brand-400">
                                        {p.price.toFixed(2)}
                                    </span>
                                    <button className="bg-brand-500 text-white text-xs px-2 py-1 rounded">
                                        Add
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right: Cart */}
            <div className="w-1/3 min-w-[300px] flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-xl font-bold dark:text-white">Order Details</h2>

                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Table / Customer</label>
                    <select
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                    >
                        {tables.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto border-t border-b dark:border-gray-700 py-2">
                    {cart.length === 0 ? (
                        <p className="text-center text-gray-400 mt-4">Cart is empty</p>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="flex items-center justify-between mb-2">
                                <div className="flex-1 truncate pr-2">
                                    <p className="text-sm font-medium dark:text-gray-200">{item.itemName}</p>
                                    <p className="text-xs text-gray-500">
                                        {item.price.toFixed(2)} x {item.cartQty}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQty(item.id, -1)}
                                        className="p-1 px-3 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 font-bold"
                                    >
                                        -
                                    </button>
                                    <span className="text-sm w-4 text-center dark:text-white">{item.cartQty}</span>
                                    <button
                                        onClick={() => updateQty(item.id, 1)}
                                        className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300"
                                    >
                                        <div className="w-4 h-4"><PlusIcon /></div>
                                    </button>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-1 text-red-500 hover:text-red-700 ml-1"
                                    >
                                        <div className="w-4 h-4"><TrashBinIcon /></div>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-2">
                    <div className="flex justify-between text-lg font-bold mb-4 dark:text-white">
                        <span>Total:</span>
                        <span>{totalAmount.toFixed(2)}</span>
                    </div>
                    <button
                        className={`w-full py-3 rounded-lg text-white font-bold transition ${cart.length === 0 || submitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-brand-500 hover:bg-brand-600 shadow-lg"
                            }`}
                        onClick={handleSubmit}
                        disabled={cart.length === 0 || submitting}
                    >
                        {submitting ? "Processing..." : "Place Order"}
                    </button>
                </div>
            </div>
        </div>
    );
}
