import { FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";
import React, { useEffect, useMemo, useState } from "react";

type Item = { id: number; itemCode: string; itemName: string; price: number };

export default function ItemGrid({ items, onAdd, categoryName, onClearCategory }: { items: Item[]; onAdd: (it: Item) => void; categoryName?: string; onClearCategory?: () => void }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(searchTerm.trim().toLowerCase()), 200);
        return () => clearTimeout(id);
    }, [searchTerm]);

    const colors = [
        "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-800",
        "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-800",
        "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-100 dark:border-violet-800",
        "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-800",
        "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-100 dark:border-rose-800",
        "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-100 dark:border-cyan-800",
        "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100 dark:bg-fuchsia-900/20 dark:text-fuchsia-100 dark:border-fuchsia-800",
        "bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100 dark:bg-lime-900/20 dark:text-lime-100 dark:border-lime-800",
    ];

    const getColor = (id: number) => colors[id % colors.length];

    // Helper to get text color based on bg color index - simplified as colors now have text class
    const getTextColor = (id: number) => ""; // No longer needed as per new colors array

    const filtered = useMemo(() => {
        const q = debouncedQuery;
        if (!q) return items;
        return items.filter((it) => {
            const name = (it.itemName || "").toLowerCase();
            if (name.includes(q)) return true;

            const code = (it.itemCode || "").toLowerCase();
            if (code.includes(q)) return true;

            const price = Number(it.price || 0).toFixed(2).toString().toLowerCase();
            if (price.includes(q)) return true;

            return false;
        });
    }, [items, debouncedQuery]);

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-theme-sm flex flex-col ${isExpanded ? "h-full" : "h-auto"}`}>
            {/* Search Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex gap-3 items-center">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2.5a7.5 7.5 0 010 14.15z" />
                        </svg>
                    </span>
                    <input
                        id="item-search-input"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search item..."
                        className="block w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm font-medium placeholder:text-gray-500 shadow-sm focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-400 outline-none transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => { setSearchTerm(""); setDebouncedQuery(""); }}
                            className="absolute inset-y-0 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                >
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
            </div>

            {/* Items List */}
            {isExpanded && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {categoryName && !searchTerm && (
                        <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                            {categoryName}
                        </div>
                    )}

                    <div
                        className="space-y-1"
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                e.preventDefault();
                                // Select all focusable item rows (with role="button")
                                const items = Array.from(e.currentTarget.querySelectorAll('[role="button"]'));
                                const current = document.activeElement as HTMLElement;
                                const idx = items.indexOf(current);

                                if (idx !== -1) {
                                    const nextIdx = e.key === 'ArrowDown'
                                        ? (idx + 1) % items.length
                                        : (idx - 1 + items.length) % items.length;
                                    (items[nextIdx] as HTMLElement).focus();
                                } else if (items.length > 0) {
                                    (items[0] as HTMLElement).focus();
                                }
                            }
                        }}
                    >
                        {filtered.map((it, idx) => (
                            <div
                                key={it.id}
                                tabIndex={0}
                                role="button"
                                className={`group flex justify-between items-center p-2 rounded-xl transition-all cursor-pointer border shadow-sm outline-none focus:ring-2 focus:ring-brand-500 ${getColor(idx)}`}
                                onClick={() => onAdd(it)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onAdd(it);
                                    }
                                }}
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-current text-sm">{it.itemName}</span>
                                    <span className="text-xs font-medium opacity-80">{Number(it.price).toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAdd(it);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 text-current hover:bg-white hover:shadow-sm transition-all shadow-none"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </button>
                            </div>
                        ))}

                        {filtered.length === 0 && (
                            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                                No items found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
