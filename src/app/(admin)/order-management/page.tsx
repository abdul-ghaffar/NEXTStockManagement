"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { FaEye } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

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
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchId, setSearchId] = useState("");
    const [orderType, setOrderType] = useState("All");
    const [status, setStatus] = useState("All");

    useEffect(() => {
        // Check Access
        fetch('/api/auth/me', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (!data.user || !data.user.IsAdmin) {
                    router.push('/order-management/sale');
                } else {
                    fetchSales();
                }
            })
            .catch(() => router.push('/order-management/sale'));
    }, [page, orderType, status]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(searchId && { search: searchId }),
                ...(orderType !== 'All' && { orderType }),
                ...(status !== 'All' && { status })
            });
            const res = await fetch(`/api/sales?${params}`);
            const data = await res.json();
            if (res.ok) {
                setSales(data.data);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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
                <Link href="/order-management/sale" className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded">
                    New Sale
                </Link>
            </div>

            <div className="flex gap-4 mb-6 flex-wrap">
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
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-300 text-sm font-light">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-6">Loading...</td></tr>
                        ) : sales.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-6">No sales found</td></tr>
                        ) : (
                            sales.map((sale) => (
                                <tr key={sale.ID} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                                    <td className="py-3 px-6 font-medium whitespace-nowrap">#{sale.ID}</td>
                                    <td className="py-3 px-6">{new Date(sale.SaleDate).toLocaleString()}</td>
                                    <td className="py-3 px-6 font-medium">{sale.ClientName || "-"}</td>
                                    <td className="py-3 px-6">
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
                                        <Link href={`/order-management/sale?id=${sale.ID}`}>
                                            <button className="text-blue-500 hover:text-blue-700 p-2 flex items-center justify-center gap-1 mx-auto" title="View/Edit Order">
                                                <FaEye size={18} />
                                                <span className="text-xs font-semibold">
                                                    {(sale.Closed || (!currentUser?.IsAdmin && sale.UserID && sale.UserID !== currentUser?.ID)) ? 'View' : 'Edit'}
                                                </span>
                                            </button>
                                        </Link>
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
        </div>
    );
}
