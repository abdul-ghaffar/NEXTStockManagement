import { FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";
import { useState } from "react";

type Cat = { id: number; name: string; image?: any };

export default function CategoryList({ categories, onSelect, selectedCategoryId }: { categories: Cat[]; onSelect: (c: Cat) => void; selectedCategoryId?: number }) {
    const [isExpanded, setIsExpanded] = useState(true);

    const bgColors = [
        "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
        "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
        "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
        "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
        "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
        "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
        "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100",
        "bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100",
    ];

    const allCat = { id: -1, name: 'All' };
    // We treat existing categories as having valid IDs.
    // If selectedCategoryId is undefined or -1, 'All' is selected.
    const isAllSelected = !selectedCategoryId || selectedCategoryId === -1;
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    return (
        <div className="w-full mb-3">
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none snap-x items-center">
                {/* All Pill */}
                <button
                    onClick={() => onSelect(allCat as any)}
                    className={`flex-none px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all border snap-start ${isAllSelected
                        ? "bg-gray-800 text-white border-gray-900 shadow-md transform scale-105"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                >
                    All
                </button>

                {categories.map((c, idx) => {
                    const isSelected = c.id === selectedCategoryId;
                    const colorClass = bgColors[idx % bgColors.length];

                    return (
                        <button
                            key={c.id}
                            onClick={() => onSelect(c)}
                            className={`flex-none px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all border snap-start ${isSelected
                                ? "bg-teal-600 text-white border-teal-700 shadow-md shadow-teal-200 dark:shadow-teal-900/20 transform scale-105"
                                : `${colorClass} dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-750`
                                }`}
                        >
                            {c.name.toUpperCase()}
                        </button>
                    );
                })}
            </div>

            {/* Active Filter Indicator */}
            {selectedCategory && (
                <div className="mt-2 flex justify-center animate-in fade-in slide-in-from-top-2 duration-300">
                    <button
                        onClick={() => onSelect(allCat as any)}
                        className="group flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-bold shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer"
                    >
                        <span>{selectedCategory.name.toUpperCase()}</span>
                        <div className="w-4 h-4 rounded-full bg-teal-100 text-teal-600 group-hover:bg-red-100 group-hover:text-red-500 flex items-center justify-center transition-colors">
                            <FaTimes className="w-2.5 h-2.5" />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
