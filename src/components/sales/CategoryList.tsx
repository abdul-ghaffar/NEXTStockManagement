import { FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";
import { useState } from "react";

type Cat = { id: number; name: string; image?: any };

export default function CategoryList({ categories, onSelect, selectedCategoryId }: { categories: Cat[]; onSelect: (c: Cat) => void; selectedCategoryId?: number }) {
    const [isExpanded, setIsExpanded] = useState(true);

    const colors = [
        "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20",
        "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20",
        "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20",
        "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20",
        "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20",
        "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20 hover:bg-cyan-100 dark:hover:bg-cyan-500/20",
        "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/20 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20",
        "bg-lime-50 text-lime-700 border-lime-100 dark:bg-lime-500/10 dark:text-lime-400 dark:border-lime-500/20 hover:bg-lime-100 dark:hover:bg-lime-500/20",
    ];

    const getColor = (id: number) => colors[id % colors.length];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div
                className="flex items-center justify-between cursor-pointer mb-2"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="font-semibold text-gray-800 dark:text-white">Categories</h3>
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    {isExpanded ? <FaChevronUp className="w-5 h-5" /> : <FaChevronDown className="w-5 h-5" />}
                </button>
            </div>

            {isExpanded && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto custom-scrollbar">
                    {categories.map((c) => {
                        const isSelected = c.id === selectedCategoryId;
                        return (
                            <button
                                key={c.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(c);
                                }}
                                title={c.name}
                                className={`min-h-16 px-3 rounded-lg border shadow-sm text-left flex items-start py-2 hover:scale-[1.01] transition-all relative ${getColor(c.id)} ${isSelected ? 'ring-2 ring-offset-1 ring-brand-500 dark:ring-offset-gray-900 !opacity-100' : 'opacity-80 hover:opacity-100'}`}
                            >
                                <div className="text-sm font-medium break-words whitespace-normal pr-5">{c.name}</div>
                                {isSelected && (
                                    <div className="absolute right-2 top-2 text-current opacity-70">
                                        <FaTimes className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
