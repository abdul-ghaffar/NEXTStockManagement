"use client";
import React, { useEffect, useState } from "react";
import TableGrid from "@/components/sales/TableGrid";
import CategoryList from "@/components/sales/CategoryList";
import ItemGrid from "@/components/sales/ItemGrid";
import Cart from "@/components/sales/Cart";

type Table = { id: number; name: string; isActive?: boolean; saleId?: number | null; saleTotal?: number | null };
type Category = { id: number; name: string };
type Item = { id: number; itemCode: string; itemName: string; price: number };

export default function SalePage() {
    const [step, setStep] = useState<"tables" | "items">("tables");
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [cart, setCart] = useState<{ id: number; itemCode: string; itemName: string; price: number; qty: number }[]>([]);
    const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);

    useEffect(() => {
        fetch('/api/tables').then(r => r.json()).then(setTables).catch(err => console.error(err));
        fetch('/api/categories').then(r => r.json()).then(setCategories).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (!selectedCategory) return;
        fetch(`/api/products-by-category?category=${selectedCategory.id}`)
            .then(r => r.json())
            .then(setItems)
            .catch(err => console.error(err));
    }, [selectedCategory]);

    const onSelectTable = async (t: Table) => {
        setSelectedTable(t);
        // If this table has a running sale, load its details into cart
        if (t.saleId) {
            try {
                const res = await fetch(`/api/orders/${t.saleId}`);
                if (res.ok) {
                    const data = await res.json();
                    const items = data.items || [];
                    const mapped = items.map((it: any, idx: number) => ({
                        id: it.prodID ?? idx,
                        itemCode: it.ItemCode,
                        itemName: it.ItemName || it.itemName || '',
                        price: Number(it.SalePrice) || Number(it.price) || 0,
                        qty: Number(it.Qty) || 1
                    }));
                    setCart(mapped);
                    setCurrentOrderId(Number(t.saleId));
                } else {
                    console.error('Failed to load order details');
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            // new order
            setCart([]);
            setCurrentOrderId(null);
        }
        setStep('items');
    };

    const onSelectCategory = (c: Category) => {
        setSelectedCategory(c);
    };

    const addToCart = (it: Item) => {
        setCart(prev => {
            const ex = prev.find(p => p.id === it.id);
            if (ex) return prev.map(p => p.id === it.id ? { ...p, qty: p.qty + 1 } : p);
            return [...prev, { id: it.id, itemCode: it.itemCode, itemName: it.itemName, price: Number(it.price) || 0, qty: 1 }];
        });
    };

    const onQty = (id: number, delta: number) => {
        setCart(prev => prev.map(p => p.id === id ? { ...p, qty: Math.max(1, p.qty + delta) } : p));
    };

    const onRemove = (id: number) => {
        setCart(prev => prev.filter(p => p.id !== id));
    };

    const placeOrder = async () => {
        if (!selectedTable) return alert('Select table');
        if (cart.length === 0) return alert('Cart empty');

        const sale = {
            orderId: currentOrderId,
            tableName: selectedTable.name,
            items: cart.map(c => ({ itemCode: c.itemCode, qty: c.qty, price: c.price })),
            netTotal: cart.reduce((s, c) => s + c.price * c.qty, 0),
            areaId: selectedTable?.id ?? null
        };

        try {
            const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sale) });
            const data = await res.json();
            if (!res.ok) {
                console.error('Save failed', data);
                alert('Failed to save order');
                return;
            }

            // If server returned saleID, update currentOrderId
            const saleId = data.saleId || data.orderId || data.orderID || null;
            if (saleId) {
                setCurrentOrderId(Number(saleId));
            }

            // Refetch tables to get updated sale totals and states
            try {
                const tblRes = await fetch('/api/tables');
                if (tblRes.ok) {
                    const tbls = await tblRes.json();
                    setTables(tbls);

                    // Update selectedTable from fresh list (so saleTotal and saleId are current)
                    const updated = tbls.find((x: any) => x.id === selectedTable.id);
                    if (updated) {
                        setSelectedTable(updated);
                    }
                }
            } catch (err) {
                console.error('Failed to refresh tables after save', err);
            }

            alert('Order saved');
            // keep user on items view so they can continue editing the same table; if you prefer to go back to tables view, uncomment below
            // setCart([]); setSelectedTable(null); setStep('tables');
        } catch (err) {
            console.error(err);
            alert('Error saving order');
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-3">Sale / POS</h1>

            {step === 'tables' && (
                <div>
                    <h2 className="mb-2 font-medium">Select Table</h2>
                    <TableGrid tables={tables} onSelect={onSelectTable} />
                </div>
            )}

            {step === 'items' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <div className="mb-2 flex items-center justify-between">
                            <div>
                                <button onClick={() => { setStep('tables'); setSelectedTable(null); }} className="px-3 py-1 border rounded">Back</button>
                                <span className="ml-3 font-medium">Table: {selectedTable?.name}</span>
                            </div>
                        </div>

                        <CategoryList categories={categories} onSelect={onSelectCategory} />

                        <div className="mt-3">
                            <ItemGrid items={items} onAdd={addToCart} />
                        </div>
                    </div>

                    <div>
                        <div className="border p-3 rounded-lg bg-white dark:bg-gray-800">
                            <h3 className="font-medium mb-2">Cart</h3>
                            <Cart items={cart} onQty={onQty} onRemove={onRemove} />
                            <div className="flex gap-2 mt-3">
                                <button onClick={placeOrder} className="flex-1 py-2 rounded bg-brand-500 text-white">Place Order</button>
                                {currentOrderId ? (
                                    <button onClick={async () => {
                                        if (!currentOrderId) return;
                                        if (!confirm('Close this table and complete the order?')) return;
                                        try {
                                            const res = await fetch(`/api/orders/${currentOrderId}/close`, { method: 'POST' });
                                            if (res.ok) {
                                                alert('Table closed');
                                                // clear cart and selected table
                                                setCart([]);
                                                setCurrentOrderId(null);
                                                // refresh tables
                                                const tblRes = await fetch('/api/tables');
                                                if (tblRes.ok) setTables(await tblRes.json());
                                                setSelectedTable(null);
                                                setStep('tables');
                                            } else {
                                                const data = await res.json();
                                                console.error('Close failed', data);
                                                alert('Failed to close table');
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            alert('Error closing table');
                                        }
                                    }} className="py-2 px-3 rounded border bg-white">Close</button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
