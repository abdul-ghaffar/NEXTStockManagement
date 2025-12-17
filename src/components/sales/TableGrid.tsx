"use client";
import React, { useEffect, useMemo, useState } from "react";

type Table = { id: number; name: string; isActive?: boolean; saleId?: number | null; saleTotal?: number | null };

export default function TableGrid({ tables, onSelect }: { tables: Table[]; onSelect: (t: Table) => void }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // debounce input to reduce filtering frequency (200ms)
    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(searchTerm.trim().toLowerCase()), 200);
        return () => clearTimeout(id);
    }, [searchTerm]);

    const filteredTables = useMemo(() => {
        const q = debouncedQuery;
        if (!q) return tables;
        return tables.filter((t) => {
            const name = (t.name || "").toLowerCase();
            if (name.includes(q)) return true;

            const amount = Number(t.saleTotal || 0).toFixed(2).toString().toLowerCase();
            if (amount.includes(q)) return true;

            const status = (t.isActive ? "running" : "free").toLowerCase();
            if (status.includes(q)) return true;

            return false;
        });
    }, [tables, debouncedQuery]);

    const counts = useMemo(() => {
        const total = filteredTables.length;
        const running = filteredTables.filter((t) => t.isActive).length;
        const free = total - running;
        return { total, free, running };
    }, [filteredTables]);

    return (
        <div>
            {/* Search input (frontend only) */}
            <div className="mb-3">
                <label htmlFor="table-search" className="sr-only">Search tables</label>
                <div className="relative max-w-md">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2.5a7.5 7.5 0 010 14.15z" />
                        </svg>
                    </span>
                    <input
                        id="table-search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, amount or status (free/running)"
                        className="block w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500/10 focus:border-brand-300 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 appearance-none"
                        aria-label="Search tables"
                    />
                    {searchTerm ? (
                        <button
                            type="button"
                            onClick={() => { setSearchTerm(""); setDebouncedQuery(""); }}
                            className="absolute inset-y-0 right-2 inline-flex items-center justify-center px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    ) : null}
                </div>
            </div>

            {/* counts updated based on filtered results */}
            <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="mr-4">Total: <span className="font-semibold text-gray-900 dark:text-white">{counts.total}</span></span>
                <span className="mr-4">Free: <span className="font-semibold text-gray-900 dark:text-white">{counts.free}</span></span>
                <span>Running: <span className="font-semibold text-gray-900 dark:text-white">{counts.running}</span></span>
            </div>

            {/* responsive grid: 2 cols on xs, 3 on sm, 4 on md, 6 on lg+ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-4">
                {filteredTables.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => onSelect(t)}
                        className={`w-full min-h-10 md:min-h-12 py-2 px-3 sm:py-2 sm:px-3 md:py-2 md:px-4 rounded-md border border-gray-200 dark:border-gray-800 text-center shadow-sm transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-400/20 ${t.isActive ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-white dark:bg-gray-800'}`}
                    >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="font-semibold text-xs sm:text-sm md:text-sm text-gray-900 dark:text-white">{t.name}</div>
                            {typeof t.saleId !== 'undefined' && t.saleId !== null ? (
                                <div className="text-xs sm:text-sm md:text-sm font-bold text-brand-600 dark:text-brand-300">{Number(t.saleTotal || 0).toFixed(2)}</div>
                            ) : null}
                            <div className="text-[10px] sm:text-[11px] md:text-[11px] text-gray-500 dark:text-gray-400">{t.isActive ? 'Running' : 'Free'}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
