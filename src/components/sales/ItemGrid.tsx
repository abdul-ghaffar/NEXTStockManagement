"use client";
import React from "react";

type Item = { id: number; itemCode: string; itemName: string; price: number };

export default function ItemGrid({ items, onAdd }: { items: Item[]; onAdd: (it: Item) => void }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((it) => (
                <div key={it.id} className="border p-3 rounded-lg flex flex-col justify-between hover:shadow transition bg-amber-50 dark:bg-amber-900/40">
                    <div className="min-h-12">
                        <div className="font-medium text-sm truncate" title={it.itemName}>{it.itemName}</div>
                        <div className="text-xs text-gray-500 truncate" title={it.itemCode}>{it.itemCode}</div>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <div className="font-bold">{Number(it.price).toFixed(2)}</div>
                        <button onClick={() => onAdd(it)} className="w-full sm:w-auto px-3 py-2 bg-brand-500 text-white rounded">Add</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
