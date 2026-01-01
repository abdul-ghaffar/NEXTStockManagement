"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { FaEye, FaPrint } from "react-icons/fa";
import { useAuth } from "@/app/ui/context/AuthContext";
import { useRealTime } from "@/app/ui/components/RealTimeProvider";
import { EVENTS } from "@/lib/events";
import { generateReceiptHtml } from "@/lib/receipt";
import { toast } from "react-toastify";
import { Modal, ConfirmationModal } from "@/app/ui/components/ui/modal";

type Sale = {
    ID: number;
    ClientName: string;
    SaleDate: string;
    TotalAmount: number;
    OrderType: string;
    PhoneNo: string;
    DeliveryAddress: string;
    Closed: boolean;
    UserID?: number | null;
};

export default function SalesListPage() {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const { subscribe } = useRealTime();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchId, setSearchId] = useState("");
    const [orderType, setOrderType] = useState("All");
    const [status, setStatus] = useState("All");

    const [selectedSales, setSelectedSales] = useState<Set<number>>(new Set());
    const [bulkAction, setBulkAction] = useState("");

    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

    const toggleSelectAll = () => {
        if (selectedSales.size === sales.length && sales.length > 0) {
            setSelectedSales(new Set());
        } else {
            setSelectedSales(new Set(sales.map(s => s.ID)));
        }
    };

    const toggleSelectRow = (id: number) => {
        const newSet = new Set(selectedSales);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedSales(newSet);
    };

    const handleBulkApply = async () => {
        if (!bulkAction) return;

        if (bulkAction === 'close-selected') {
            if (selectedSales.size === 0) return toast.warning("No orders selected");

            setConfirmation({
                isOpen: true,
                title: "Confirm Bulk Close",
                message: `Are you sure you want to close ${selectedSales.size} selected orders?`,
                onConfirm: async () => {
                    setLoading(true);
                    try {
                        const res = await fetch('/api/sales/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderIds: Array.from(selectedSales) })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            toast.success(`Closed ${data.count} orders successfully`);
                            setSelectedSales(new Set());
                            setBulkAction("");
                            fetchSales();
                        } else {
                            toast.error("Failed to close orders");
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error("Error performing bulk action");
                    } finally {
                        setLoading(false);
                    }
                }
            });

        } else if (bulkAction === 'close-all-running') {
            setConfirmation({
                isOpen: true,
                title: "Confirm Close All",
                message: "Are you sure you want to CLOSE ALL RUNNING ORDERS? This will clear all active tables.",
                onConfirm: async () => {
                    setLoading(true);
                    try {
                        const res = await fetch('/api/sales/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ closeAllRunning: true })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            toast.success(`Closed ${data.count} orders successfully`);
                            setBulkAction("");
                            fetchSales();
                        } else {
                            toast.error("Failed to close all running orders");
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error("Error performing bulk action");
                    } finally {
                        setLoading(false);
                    }
                }
            });
        }
    };

    // ... (rest of useEffects and fetchSales) ...
    // Note: I will need to replace the component body essentially to inject the UI comfortably.

    useEffect(() => {
        // Subscribe to real-time events to refresh the list
        const unsubscribeCreated = subscribe(EVENTS.ORDER_CREATED, () => {
            console.log("Refreshing sales list due to new order...");
            fetchSales();
        });
        const unsubscribeUpdated = subscribe(EVENTS.ORDER_UPDATED, () => {
            console.log("Refreshing sales list due to order update...");
            fetchSales();
        });
        const unsubscribeClosed = subscribe(EVENTS.ORDER_CLOSED, () => {
            // If we rely on this for refresh, good.
            console.log("Refreshing sales list due to order closure...");
            fetchSales();
        });

        return () => {
            unsubscribeCreated();
            unsubscribeUpdated();
            unsubscribeClosed();
        };
    }, [subscribe]);

    useEffect(() => {
        // Check Access
        fetch('/api/auth/me', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (!data.user || !data.user.IsAdmin) {
                    router.push('/sale/details');
                } else {
                    fetchSales();
                }
            })
            .catch(() => router.push('/sale/details'));
    }, [page, orderType, status, limit]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(searchId && { search: searchId }),
                ...(orderType !== 'All' && { orderType }),
                ...(status !== 'All' && { status })
            });
            const res = await fetch(`/api/sales?${params}`);
            const data = await res.json();
            if (res.ok) {
                setSales(data.data);
                setTotalPages(data.totalPages);
                // Reset selection on page change or refresh if desired, or keep across pages? 
                // Usually reset is safer unless advanced.
                setSelectedSales(new Set());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // ... item logic ... 

    const handlePrint = async (sale: Sale) => {
        try {
            const res = await fetch(`/api/orders/${sale.ID}`);
            if (!res.ok) throw new Error("Failed to fetch order details");
            const data = await res.json();

            const html = await generateReceiptHtml(data.sale, data.items);

            if (window.api && window.api.printOrder) {
                const result = await window.api.printOrder(html);
                if (result.success) {
                    toast.success(`Printing order #${sale.ID}...`);
                } else {
                    toast.error(`Print failed: ${result.error}`);
                }
            } else {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    printWindow.print();
                }
            }
        } catch (error: any) {
            console.error("Print error:", error);
            toast.error("Error preparing receipt for print");
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Reset to page 1
        fetchSales();
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow min-h-[80vh] border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Sales List</h1>
                <Link href="/sale/details" className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded">
                    New Sale
                </Link>
            </div>

            <div className="flex gap-4 mb-6 flex-wrap items-end">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search by Order ID..."
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2"
                    />
                    <button type="submit" className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500">
                        Search
                    </button>
                </form>

                <select
                    value={orderType}
                    onChange={(e) => {
                        setOrderType(e.target.value);
                        setPage(1);
                    }}
                    className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2"
                >
                    <option value="All">All Types</option>
                    <option value="Dine In">Dine In</option>
                    <option value="Take Away">Take Away</option>
                    <option value="Home Delivery">Home Delivery</option>
                </select>

                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                    }}
                    className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2"
                >
                    <option value="All">All Status</option>
                    <option value="Running">Running Only</option>
                    <option value="Closed">Closed Only</option>
                </select>

                <div className="flex items-center gap-2 border-l pl-4 dark:border-gray-700">
                    <select
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value)}
                        className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2"
                    >
                        <option value="">-- Bulk Actions --</option>
                        <option value="close-selected">Close Selected</option>
                        <option value="close-all-running">Close ALL Running</option>
                    </select>
                    <button
                        onClick={handleBulkApply}
                        disabled={!bulkAction || (bulkAction === 'close-selected' && selectedSales.size === 0)}
                        className="bg-brand-500 text-white px-4 py-2 rounded hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                    >
                        Apply
                    </button>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Rows:</span>
                    <select
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-2"
                    >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-sm leading-normal">
                        <tr>
                            <th className="py-3 px-6">Order ID</th>
                            <th className="py-3 px-6">Date</th>
                            <th className="py-3 px-6">Customer / Table</th>
                            <th className="py-3 px-6">Type</th>
                            <th className="py-3 px-6">Status</th>
                            <th className="py-3 px-6">Delivery Info</th>
                            <th className="py-3 px-6 text-right">Total</th>
                            <th className="py-3 px-6 text-center">Action</th>
                            <th className="py-3 px-6 text-center">
                                <input
                                    type="checkbox"
                                    checked={sales.length > 0 && selectedSales.size === sales.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-300 text-sm font-light">
                        {loading ? (
                            <tr><td colSpan={9} className="text-center py-6">Loading...</td></tr>
                        ) : sales.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-6">No sales found</td></tr>
                        ) : (
                            sales.map((sale) => (
                                <tr key={sale.ID} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${selectedSales.has(sale.ID) ? "bg-brand-50/50 dark:bg-brand-500/10" : ""}`}>
                                    <td className="py-3 px-6 font-medium whitespace-nowrap">#{sale.ID}</td>
                                    <td className="py-3 px-6">{new Date(sale.SaleDate).toLocaleString()}</td>
                                    <td className="py-3 px-6 font-medium">{sale.ClientName || "-"}</td>
                                    <td className="py-3 px-6 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${sale.OrderType === 'Dine In' ? 'bg-blue-100 text-blue-600' :
                                            sale.OrderType === 'Home Delivery' ? 'bg-orange-100 text-orange-600' :
                                                'bg-green-100 text-green-600'
                                            }`}>
                                            {sale.OrderType}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${sale.Closed ? 'bg-gray-200 text-gray-600' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            {sale.Closed ? 'Closed' : 'Running'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 max-w-xs truncate">
                                        {sale.OrderType === 'Home Delivery' ? (
                                            <div className="flex flex-col text-xs">
                                                <span>{sale.PhoneNo}</span>
                                                <span className="truncate" title={sale.DeliveryAddress}>{sale.DeliveryAddress}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-6 text-right font-bold text-brand-600">
                                        {typeof sale.TotalAmount === 'number' ? sale.TotalAmount.toFixed(2) : sale.TotalAmount}
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/sale/details?id=${sale.ID}`}>
                                                <button className="text-blue-500 hover:text-blue-700 p-2 flex items-center justify-center gap-1" title="View/Edit Order">
                                                    <FaEye size={18} />
                                                    <span className="text-xs font-semibold">
                                                        {(sale.Closed || (!currentUser?.IsAdmin && sale.UserID && sale.UserID !== currentUser?.ID)) ? 'View' : 'Edit'}
                                                    </span>
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => handlePrint(sale)}
                                                className="text-gray-600 hover:text-brand-500 p-2 flex items-center justify-center gap-1"
                                                title="Print Receipt"
                                            >
                                                <FaPrint size={18} />
                                                <span className="text-xs font-semibold">Print</span>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedSales.has(sale.ID)}
                                            onChange={() => toggleSelectRow(sale.ID)}
                                            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-6">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Next
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                title={confirmation.title}
                message={confirmation.message}
                onConfirm={confirmation.onConfirm}
            />
        </div>
    );
}
