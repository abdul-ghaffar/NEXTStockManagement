import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FaSearch, FaTimes } from "react-icons/fa";

type Table = { id: number; name: string; isActive?: boolean; saleId?: number | null; saleTotal?: number | null; createdBy?: string | null; userId?: number | null };

export default function TableGrid({ tables, onSelect }: { tables: Table[]; onSelect: (t: Table) => void }) {
    const { user: currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Running" | "Free">("Running");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // debounce input to reduce filtering frequency (200ms)
    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(searchTerm.trim().toLowerCase()), 200);
        return () => clearTimeout(id);
    }, [searchTerm]);

    const filteredTables = useMemo(() => {
        let result = tables;

        // Apply Status Filter
        if (statusFilter === "Running") {
            result = result.filter(t => t.isActive);
        } else if (statusFilter === "Free") {
            result = result.filter(t => !t.isActive);
        }

        // Apply Search Term
        const q = debouncedQuery;
        if (q) {
            result = result.filter((t) => {
                const name = (t.name || "").toLowerCase();
                if (name.includes(q)) return true;

                const amount = Number(t.saleTotal || 0).toFixed(2).toString().toLowerCase();
                if (amount.includes(q)) return true;

                const status = (t.isActive ? "running" : "free").toLowerCase();
                if (status.includes(q)) return true;

                return false;
            });
        }

        // Sorting: Prioritize My Tables (if Running)
        return [...result].sort((a, b) => {
            const aIsMine = a.userId === currentUser?.ID && a.isActive;
            const bIsMine = b.userId === currentUser?.ID && b.isActive;
            if (aIsMine && !bIsMine) return -1;
            if (!aIsMine && bIsMine) return 1;
            return 0;
        });

    }, [tables, debouncedQuery, statusFilter, currentUser?.ID]);

    const counts = useMemo(() => {
        const total = filteredTables.length;
        const running = filteredTables.filter((t) => t.isActive).length;
        const free = total - running;
        return { total, free, running };
    }, [filteredTables]);
    return (
        <>
            {/* Search and Status Filters Row */}
            <div className="flex items-center gap-3 mb-4 h-10">
                {/* Status Toggles on left */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg shrink-0">
                    {(["All", "Running", "Free"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${statusFilter === s
                                ? "bg-white dark:bg-gray-800 text-brand-500 dark:text-white shadow-theme-xs border border-transparent"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Animated Search */}
                <div className={`flex items-center transition-all duration-300 ease-in-out relative ${isSearchExpanded ? 'w-full max-w-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg pl-3 pr-8 py-1.5' : 'w-10 h-10'}`}>
                    <button
                        onClick={() => {
                            if (!isSearchExpanded) {
                                setIsSearchExpanded(true);
                            }
                        }}
                        className={`flex items-center justify-center shrink-0 transition-colors ${isSearchExpanded ? 'text-gray-400' : 'w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                        aria-label="Toggle search"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2.5a7.5 7.5 0 010 14.15z" />
                        </svg>
                    </button>

                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search tables..."
                        className={`transition-all duration-300 ease-in-out bg-transparent border-none focus:ring-0 text-sm p-0 ml-2 placeholder:text-gray-400 dark:text-white/90 dark:placeholder:text-white/30 ${isSearchExpanded ? 'w-full opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
                        autoFocus={isSearchExpanded}
                    />

                    {isSearchExpanded && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (searchTerm) {
                                    setSearchTerm("");
                                    setDebouncedQuery("");
                                } else {
                                    setIsSearchExpanded(false);
                                }
                            }}
                            className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
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
                {filteredTables.map((t) => {
                    const isRunning = t.isActive;
                    const isMine = t.userId === currentUser?.ID && isRunning;

                    return (
                        <button
                            key={t.id}
                            onClick={() => onSelect(t)}
                            className={`w-full min-h-10 md:min-h-12 py-2 px-3 sm:py-2 sm:px-3 md:py-2 md:px-4 rounded-lg border text-center shadow-sm transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-400/20 
                                    ${isMine
                                    ? 'bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20'
                                    : isRunning
                                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                                        : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800'}`}
                        >
                            <div className="flex flex-col items-center justify-center gap-0.5">
                                <div className="font-semibold text-xs sm:text-sm md:text-sm text-gray-900 dark:text-white">{t.name}</div>
                                {typeof t.saleId !== 'undefined' && t.saleId !== null ? (
                                    <div className={`text-xs sm:text-sm md:text-sm font-bold ${isMine ? 'text-success-600 dark:text-success-400' : 'text-brand-600 dark:text-brand-300'}`}>
                                        {Number(t.saleTotal || 0).toFixed(2)}
                                    </div>
                                ) : null}
                                <div className="text-[10px] sm:text-[11px] md:text-[11px] text-gray-500 dark:text-gray-400">{isRunning ? (isMine ? 'My Table' : 'Running') : 'Free'}</div>
                                {t.createdBy && (
                                    <div className={`mt-1 text-[9px] uppercase tracking-wider font-bold ${isMine ? 'text-success-700 dark:text-success-500' : 'text-brand-500 dark:text-brand-400'}`}>
                                        {t.createdBy}
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </>
    );
}
