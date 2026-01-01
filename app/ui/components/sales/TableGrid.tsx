import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/ui/context/AuthContext";
import { FaSearch, FaTimes } from "react-icons/fa";

type Table = { id: number; name: string; isActive?: boolean; saleId?: number | null; saleTotal?: number | null; createdBy?: string | null; userId?: number | null };

export default function TableGrid({ tables, onSelect }: { tables: Table[]; onSelect: (t: Table) => void }) {
    const { user: currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Running" | "Free" | "Mine">("Running");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Set default filter to 'Mine' for non-admin users once user is loaded
    useEffect(() => {
        if (currentUser && !currentUser.IsAdmin) {
            setStatusFilter("Mine");
        }
    }, [currentUser]);

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
        } else if (statusFilter === "Mine") {
            result = result.filter(t => t.isActive && t.userId === currentUser?.ID);
        }

        // Apply Search Term
        const q = debouncedQuery;
        if (q) {
            result = result.filter((t) => {
                const name = (t.name || "").toLowerCase();
                return name.includes(q);
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
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mr-2">Tables</h2>

                {/* Status Toggles on left */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg shrink-0">
                    {(["All", "Running", "Mine", "Free"] as const).map((s) => (
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
                <div className={`flex items-center transition-all duration-300 ease-in-out relative ml-auto ${isSearchExpanded ? 'w-full max-w-xs sm:max-w-sm ml-0 md:ml-auto bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg pl-3 pr-8 py-1.5' : 'w-10 h-10'}`}>
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
                        className={`transition-all duration-300 ease-in-out bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm p-0 ml-2 placeholder:text-gray-400 dark:text-white/90 dark:placeholder:text-white/30 ${isSearchExpanded ? 'w-full opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3">
                {filteredTables.map((t) => {
                    const isRunning = t.isActive;
                    const isMine = t.userId === currentUser?.ID && isRunning;

                    return (
                        <button
                            key={t.id}
                            onClick={() => onSelect(t)}
                            className={`w-full min-h-10 py-1.5 px-2 rounded-lg border text-center shadow-sm transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-400/20 
                                    ${isMine
                                    ? 'bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20'
                                    : isRunning
                                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                                        : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800'}`}
                        >
                            <div className="flex flex-col items-center justify-center gap-0.5">
                                <div className="font-bold text-xs text-gray-900 dark:text-white leading-tight">{t.name}</div>
                                {typeof t.saleId !== 'undefined' && t.saleId !== null ? (
                                    <div className={`text-xs font-bold leading-tight ${isMine ? 'text-success-600 dark:text-success-400' : 'text-brand-600 dark:text-brand-300'}`}>
                                        {Number(t.saleTotal || 0).toFixed(2)}
                                    </div>
                                ) : null}
                                <div className="text-[10px] leading-none text-gray-500 dark:text-gray-400 opacity-80 mt-0.5">{isRunning ? (isMine ? 'My Table' : 'Running') : 'Free'}</div>
                                {t.createdBy && (
                                    <div className={`text-[9px] uppercase tracking-wider font-bold leading-none mt-0.5 ${isMine ? 'text-success-700 dark:text-success-500' : 'text-brand-500 dark:text-brand-400'}`}>
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
