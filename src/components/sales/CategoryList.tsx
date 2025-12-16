"use client";
import React from "react";

type Cat = { id: number; name: string; image?: any };

export default function CategoryList({ categories, onSelect }: { categories: Cat[]; onSelect: (c: Cat) => void }) {
    return (
        // Grid with 4 columns and fixed visible rows (4 rows). Add vertical scroll when categories overflow.
        // Each button has fixed height so the grid height is consistent.
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2 max-h-72 overflow-y-auto">
            {categories.map((c) => (
                <button
                    key={c.id}
                    onClick={() => onSelect(c)}
                    title={c.name}
                    className="h-16 px-3 rounded-lg border bg-sky-50 dark:bg-sky-900/40 shadow-sm text-left flex items-center hover:scale-[1.01] transition-all"
                >
                    <div className="text-sm font-medium truncate">{c.name}</div>
                </button>
            ))}
        </div>
    );
}
