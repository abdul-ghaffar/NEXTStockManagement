"use client";
import React from "react";

type CartItem = { id: number; itemName: string; price: number; qty: number };

export default function Cart({ items, onQty, onRemove }: { items: CartItem[]; onQty: (id: number, delta: number) => void; onRemove: (id: number) => void }) {
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    return (
        <div className="flex flex-col gap-3">
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="text-center text-gray-400">Cart empty</div>
                ) : (
                    items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between py-2 min-h-16">
                            <div className="flex-1 pr-2">
                                <div className="font-medium text-sm truncate" title={it.itemName}>{it.itemName}</div>
                                <div className="text-xs text-gray-500">{it.price.toFixed(2)} x {it.qty}</div>
                            </div>
                            <div className="flex flex-col items-center gap-1 ml-3">
                                <button onClick={() => onQty(it.id, -1)} className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded">-</button>
                                <div className="w-8 h-8 flex items-center justify-center font-semibold">{it.qty}</div>
                                <button onClick={() => onQty(it.id, 1)} className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded">+</button>
                                <button onClick={() => onRemove(it.id)} className="mt-1 text-red-500 text-sm">x</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="pt-2 border-t dark:border-gray-700">
                <div className="flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span>{total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
