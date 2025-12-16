"use client";
import React from "react";

type Table = { id: number; name: string; isActive?: boolean; saleId?: number | null; saleTotal?: number | null };

export default function TableGrid({ tables, onSelect }: { tables: Table[]; onSelect: (t: Table) => void }) {
    return (
        // responsive grid: 2 cols on xs, 3 on sm, 4 on md+
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t)}
                    className={`min-h-18 p-4 rounded-lg border text-center shadow-sm transition-all active:scale-[0.99] ${t.isActive ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-white dark:bg-gray-800'}`}
                >
                    <div className="flex flex-col items-center justify-center gap-1">
                        <div className="font-semibold text-sm sm:text-base">{t.name}</div>
                        {typeof t.saleId !== 'undefined' && t.saleId !== null ? (
                            <div className="text-sm font-bold text-brand-600">{Number(t.saleTotal || 0).toFixed(2)}</div>
                        ) : null}
                        <div className="text-xs text-gray-500">{t.isActive ? 'Running' : 'Free'}</div>
                    </div>
                </button>
            ))}
        </div>
    );
}
