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
        "bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/40",
        "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40",
        "bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 hover:border-violet-300 dark:hover:border-violet-500/40",
        "bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/40",
        "bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/40",
        "bg-cyan-50 border-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-500/20 hover:border-cyan-300 dark:hover:border-cyan-500/40",
        "bg-fuchsia-50 border-fuchsia-100 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/20 hover:border-fuchsia-300 dark:hover:border-fuchsia-500/40",
        "bg-lime-50 border-lime-100 dark:bg-lime-500/10 dark:border-lime-500/20 hover:border-lime-300 dark:hover:border-lime-500/40",
    ];

    const getColor = (id: number) => colors[id % colors.length];

    // Helper to get text color based on bg color index
    const getTextColor = (id: number) => {
        const textColors = [
            "text-blue-800 dark:text-blue-100",
            "text-emerald-800 dark:text-emerald-100",
            "text-violet-800 dark:text-violet-100",
            "text-amber-800 dark:text-amber-100",
            "text-rose-800 dark:text-rose-100",
            "text-cyan-800 dark:text-cyan-100",
            "text-fuchsia-800 dark:text-fuchsia-100",
            "text-lime-800 dark:text-lime-100",
        ];
        return textColors[id % textColors.length];
    };

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
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-theme-sm">
            <div
                className="flex items-center justify-between cursor-pointer mb-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
                        Products
                        {categoryName && (
                            <span className="text-brand-500 font-normal ml-1 flex items-center gap-1 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full text-sm">
                                / {categoryName}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClearCategory?.();
                                    }}
                                    className="text-gray-500 hover:text-red-500 dark:text-gray-400 transition-colors ml-1"
                                >
                                    <FaTimes className="w-4 h-4" />
                                </button>
                            </span>
                        )}
                    </h3>
                    {isExpanded && (
                        <div className="relative w-64" onClick={(e) => e.stopPropagation()}>
                            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2.5a7.5 7.5 0 010 14.15z" />
                                </svg>
                            </span>
                            <input
                                id="item-search"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="block w-full pl-9 pr-8 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-brand-500/10 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 appearance-none"
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
                    )}
                </div>
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    {isExpanded ? <FaChevronUp className="w-5 h-5" /> : <FaChevronDown className="w-5 h-5" />}
                </button>
            </div>

            {isExpanded && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {filtered.map((it) => (
                        <div key={it.id} className={`border p-3 rounded-lg flex flex-col justify-between shadow-sm hover:shadow-md transition group ${getColor(it.id)}`}>
                            <div className="min-h-12">
                                <div className={`font-medium text-sm wrap-break-word whitespace-normal ${getTextColor(it.id)}`} title={it.itemName}>{it.itemName}</div>
                                <div className="text-xs text-gray-500 mt-1 wrap-break-word whitespace-normal mix-blend-multiply dark:mix-blend-screen opacity-70" title={it.itemCode}>{it.itemCode}</div>
                            </div>
                            <div className="mt-3 flex flex-col items-stretch gap-2">
                                <div className="flex justify-between items-center">
                                    <div className="font-bold text-gray-900 dark:text-white">{Number(it.price).toFixed(2)}</div>
                                </div>
                                <button
                                    onClick={() => onAdd(it)}
                                    className="w-full py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500 dark:hover:text-white rounded text-sm font-medium transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
