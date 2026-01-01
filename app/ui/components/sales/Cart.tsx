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
                        <div key={it.id} className="flex flex-col md:flex-row items-start md:items-center justify-between py-2 min-h-16">
                            <div className="flex-1 pr-2">
                                <div className="font-medium text-sm text-gray-900 dark:text-white wrap-break-word" title={it.itemName}>{it.itemName}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{it.price.toFixed(2)} x {it.qty}</div>
                            </div>
                            <div className="mt-2 md:mt-0 flex items-center gap-2">
                                <button aria-label={`Decrease ${it.itemName} quantity`} onClick={() => onQty(it.id, -1)} className="w-8 h-8 flex items-center justify-center bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 rounded-lg transition-colors">-</button>
                                <div className="px-2 text-center font-semibold w-8 text-gray-900 dark:text-white">{it.qty}</div>
                                <button aria-label={`Increase ${it.itemName} quantity`} onClick={() => onQty(it.id, 1)} className="w-8 h-8 flex items-center justify-center bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 rounded-lg transition-colors">+</button>
                                <button onClick={() => onRemove(it.id)} className="ml-3 text-red-500 text-sm" aria-label={`Remove ${it.itemName}`}>
                                    x
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="pt-2 border-t dark:border-gray-700">
                <div className="flex justify-between items-center font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>{total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
