"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/ui/context/AuthContext";
import { Modal, ConfirmationModal } from "@/app/ui/components/ui/modal";
import TableGrid from "@/app/ui/components/sales/TableGrid";
import CategoryList from "@/app/ui/components/sales/CategoryList";
import ItemGrid from "@/app/ui/components/sales/ItemGrid";
import Cart from "@/app/ui/components/sales/Cart";
import { FaExpand, FaCompress, FaArrowUp, FaShoppingCart, FaCheck, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { toast } from "react-toastify";
import { useRealTime } from "@/app/ui/components/RealTimeProvider";
import { EVENTS } from "@/lib/events";

import { Suspense } from "react";

type Table = { id: number; name: string; isActive?: boolean; saleId?: number | null; saleTotal?: number | null };
type Category = { id: number; name: string };
type Item = { id: number; itemCode: string; itemName: string; price: number };

function SaleContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { subscribe } = useRealTime();
    const isAdmin = !!user?.IsAdmin;
    const [step, setStep] = useState<"tables" | "items">(searchParams.get('id') ? "items" : "tables");
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isOwner, setIsOwner] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [cart, setCart] = useState<{ id: number; itemCode: string; itemName: string; price: number; qty: number }[]>([]);
    const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [orderType, setOrderType] = useState('Dine In');
    const [customerPhone, setCustomerPhone] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [isDeliveryOpen, setIsDeliveryOpen] = useState(true);
    const [isOrderClosed, setIsOrderClosed] = useState(false);
    const [dialogMessage, setDialogMessage] = useState<string | null>(null);
    const [showDialog, setShowDialog] = useState(false);
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

    const initialOrderState = React.useRef<{
        cart: string;
        orderType: string;
        phone: string;
        address: string;
        tableName: string;
    } | null>(null);

    useEffect(() => {
        fetch('/api/tables').then(r => r.json()).then(setTables).catch(err => console.error(err));
        fetch('/api/categories').then(r => r.json()).then(setCategories).catch(err => console.error(err));
    }, []);

    // Load order if ID is present
    useEffect(() => {
        const orderId = searchParams.get('id');
        if (orderId) {
            fetch(`/api/orders/${orderId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.sale) {
                        setCurrentOrderId(data.sale.ID);
                        const type = data.sale.OrderType || 'Dine In';
                        const phone = data.sale.PhoneNo || data.sale.phone || data.sale.Phone || '';
                        const address = data.sale.DeliveryAddress || data.sale.address || data.sale.Address || '';
                        const tableName = data.sale.TableName || data.sale.tableName || '';

                        setOrderType(type);
                        setCustomerPhone(phone);
                        setDeliveryAddress(address);
                        if (type === 'Home Delivery') {
                            setIsDeliveryOpen(true);
                        }
                        setIsOrderClosed(!!data.sale.Closed);

                        // Ownership check
                        if (!isAdmin && data.sale.UserID && data.sale.UserID !== user?.ID) {
                            setIsOwner(false);
                        } else {
                            setIsOwner(true);
                        }

                        const loadedItems = (data.items || []).map((i: any) => ({
                            id: i.id || i.ProductID || i.prodID || Math.random(),
                            itemCode: i.itemCode || i.ItemCode,
                            itemName: i.itemName || i.ItemName || i.ItemsName || i.itemCode || 'Unknown',
                            price: Number(i.price) || Number(i.SalePrice) || 0,
                            qty: Number(i.qty) || Number(i.Qty) || 0
                        }));
                        console.log("Setting cart with:", loadedItems);
                        setCart(loadedItems);

                        // Capture initial state for change detection
                        initialOrderState.current = {
                            cart: JSON.stringify(loadedItems.map((c: any) => ({ itemCode: c.itemCode, qty: c.qty }))),
                            orderType: type,
                            phone: phone,
                            address: address,
                            tableName: tableName
                        };

                        // Auto-expand if requested
                        if (searchParams.get('expanded') === 'true') {
                            setIsCartExpanded(true);
                        }

                        // Switch to items view
                        setStep('items');
                    }
                })
                .catch(err => console.error("Err loading order", err));
        }
    }, [searchParams]);

    // Update selectedTable based on loaded order and active tables
    useEffect(() => {
        if (currentOrderId && tables.length > 0 && orderType === 'Dine In' && !isOrderClosed) {
            // Find table that has this saleId
            const activeTable = tables.find(t => t.saleId === currentOrderId);
            if (activeTable) {
                setSelectedTable(activeTable);
            }
        }
    }, [currentOrderId, tables, orderType, isOrderClosed]);

    // Real-time table status refresh
    useEffect(() => {
        const refreshTables = () => {
            fetch('/api/tables')
                .then(r => r.json())
                .then(setTables)
                .catch(err => console.error("Real-time table refresh error:", err));
        };

        const unsubCreated = subscribe(EVENTS.ORDER_CREATED, refreshTables);
        const unsubUpdated = subscribe(EVENTS.ORDER_UPDATED, refreshTables);
        const unsubClosed = subscribe(EVENTS.ORDER_CLOSED, refreshTables);

        return () => {
            unsubCreated();
            unsubUpdated();
            unsubClosed();
        };
    }, [subscribe]);

    useEffect(() => {
        if (!selectedCategory) {
            // no category selected -> load all products
            fetch('/api/products')
                .then(r => r.json())
                .then(setItems)
                .catch(err => console.error(err));
            return;
        }
        fetch(`/api/products-by-category?category=${selectedCategory.id}`)
            .then(r => r.json())
            .then(setItems)
            .catch(err => console.error(err));
    }, [selectedCategory]);

    const showAlertDialog = (message: string) => {
        setDialogMessage(message);
        setShowDialog(true);
    };

    const closeAlertDialog = () => {
        setDialogMessage(null);
        setShowDialog(false);
    };

    const onSelectTable = async (t: Table) => {
        setSelectedTable(t);
        // If this table has a running sale, load its details into cart
        if (t.saleId) {
            try {
                const res = await fetch(`/api/orders/${t.saleId}`);
                if (res.ok) {
                    const data = await res.json();
                    const items = data.items || [];
                    const mapped = items.map((it: any) => ({
                        id: it.id || it.ProductID || it.prodID,
                        itemCode: it.itemCode || it.ItemCode,
                        itemName: it.itemName || it.ItemName || '',
                        price: Number(it.price) || Number(it.SalePrice) || 0,
                        qty: Number(it.qty) || Number(it.Qty) || 1
                    }));
                    setCart(mapped);
                    setCurrentOrderId(Number(t.saleId));

                    // Ownership check
                    if (!isAdmin && data.sale.UserID && data.sale.UserID !== user?.ID) {
                        setIsOwner(false);
                    } else {
                        setIsOwner(true);
                    }

                    // Update initial state for change detection when manually selecting a table
                    const type = data.sale.OrderType || 'Dine In';
                    const phone = data.sale.PhoneNo || data.sale.phone || data.sale.Phone || '';
                    const address = data.sale.DeliveryAddress || data.sale.address || data.sale.Address || '';
                    const tableName = data.sale.TableName || data.sale.tableName || '';

                    initialOrderState.current = {
                        cart: JSON.stringify(mapped.map((c: any) => ({ itemCode: c.itemCode, qty: c.qty }))),
                        orderType: type,
                        phone: phone,
                        address: address,
                        tableName: tableName
                    };
                } else {
                    console.error('Failed to load order details');
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            // new order
            setCart([]);
            setCurrentOrderId(null);
            setIsOwner(true);
        }
        setStep('items');
    };

    const onSelectCategory = (c: Category) => {
        if (c.id === -1 || selectedCategory?.id === c.id) {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(c);
        }
    };

    const addToCart = (it: Item) => {
        setCart(prev => {
            const ex = prev.find(p => p.id === it.id);
            if (ex) return prev.map(p => p.id === it.id ? { ...p, qty: p.qty + 1 } : p);
            return [...prev, { id: it.id, itemCode: it.itemCode, itemName: it.itemName, price: Number(it.price) || 0, qty: 1 }];
        });
    };

    const onQty = (id: number, delta: number) => {
        setCart(prev => prev.map(p => p.id === id ? { ...p, qty: Math.max(1, p.qty + delta) } : p));
    };

    const onRemove = (id: number) => {
        setCart(prev => prev.filter(p => p.id !== id));
    };

    const placeOrder = async () => {
        if (orderType === 'Dine In' && !selectedTable) return showAlertDialog('Select table');
        if (orderType === 'Home Delivery' && (!customerPhone || !deliveryAddress)) return showAlertDialog('Please enter delivery details (Phone & Address)');
        if (cart.length === 0) return showAlertDialog('Cart empty');

        const sale = {
            orderId: currentOrderId,
            tableName: selectedTable?.name || orderType,
            items: cart.map(c => ({ itemCode: c.itemCode, qty: c.qty, price: c.price })),
            netTotal: cart.reduce((s, c) => s + c.price * c.qty, 0),
            areaId: selectedTable?.id ?? null,
            orderType: orderType,
            phone: orderType === 'Home Delivery' ? customerPhone : undefined,
            address: orderType === 'Home Delivery' ? deliveryAddress : undefined
        };

        // Smart Update: Detection of changes
        if (currentOrderId && initialOrderState.current) {
            const currentOrderStr = JSON.stringify(cart.map(c => ({ itemCode: c.itemCode, qty: c.qty })));

            const checks = {
                cart: currentOrderStr !== initialOrderState.current.cart,
                orderType: orderType !== initialOrderState.current.orderType,
                phone: (orderType === 'Home Delivery' ? customerPhone : '') !== initialOrderState.current.phone,
                address: (orderType === 'Home Delivery' ? deliveryAddress : '') !== initialOrderState.current.address,
                tableName: (selectedTable?.name || orderType) !== initialOrderState.current.tableName
            };

            const isChanged = Object.values(checks).some(b => b);

            if (!isChanged) {
                console.log("No changes detected. Debug:", checks);
                toast.info("No changes detected in the order.");
                return;
            }
            console.log("Changes detected. Debug:", checks);
        }

        try {
            const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sale) });
            const data = await res.json();

            if (res.status === 403) {
                showAlertDialog(data.message || "Forbidden: You don't have permission to update this order.");
                return;
            }

            if (!res.ok) {
                console.error('Save failed', data); // Log error for debugging
                showAlertDialog('Failed to save order');
                return;
            }

            // If server returned saleID, update currentOrderId
            const saleId = data.saleId || data.orderId || data.orderID || null;
            if (saleId) {
                setCurrentOrderId(Number(saleId));
            }

            // Refetch tables to get updated sale totals and states
            try {
                const tblRes = await fetch('/api/tables');
                if (tblRes.ok) {
                    const tbls = await tblRes.json();
                    setTables(tbls);

                    // Update selectedTable from fresh list (so saleTotal and saleId are current)
                    if (selectedTable) {
                        const updated = tbls.find((x: any) => x.id === selectedTable.id);
                        if (updated) {
                            setSelectedTable(updated);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to refresh tables after save', err);
            }

            toast.success(currentOrderId ? "Order updated successfully!" : "Order placed successfully!");

            // Update initial state to the newly saved state
            initialOrderState.current = {
                cart: JSON.stringify(cart.map(c => ({ itemCode: c.itemCode, qty: c.qty }))),
                orderType: orderType,
                phone: orderType === 'Home Delivery' ? customerPhone : '',
                address: orderType === 'Home Delivery' ? deliveryAddress : '',
                tableName: selectedTable?.name || orderType
            };

            // If Admin, redirect to list. If not, reset for next order.
            if (isAdmin) {
                router.push('/sale');
                return;
            }

            // After saving, go back to the tables view for non-admin
            setCart([]);
            setSelectedTable(null);
            setStep('tables');
            setOrderType('Dine In');
            setCustomerPhone('');
            setDeliveryAddress('');
        } catch (err) {
            console.error(err); // Log error for debugging
            showAlertDialog('Error saving order');
        }
    };

    {/* Order Type Selector Helper */ }
    const OrderTypeSelector = (
        <div className={`flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg w-fit ${(isAdmin || isOwner) ? "" : "opacity-50 pointer-events-none grayscale-[0.5]"}`}>
            {['Dine In', 'Take Away', 'Home Delivery'].filter(type => isAdmin || type === 'Dine In').map(type => (
                <button
                    key={type}
                    onClick={() => {
                        setOrderType(type);
                        if (type === 'Dine In') {
                            setStep('tables');
                        } else {
                            setStep('items');
                            setSelectedTable(null);
                            // If we were editing an existing table order, clear it
                            if (currentOrderId) {
                                setCart([]);
                                setCurrentOrderId(null);
                            }
                        }
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${orderType === type
                        ? 'bg-white dark:bg-gray-800 shadow-theme-sm text-brand-500 dark:text-white border border-transparent'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    {type}
                </button>
            ))}
        </div>
    );

    return (
        <div className="">
            {isOrderClosed && (
                <div className="flex items-center justify-end mb-3">
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                        ORDER CLOSED
                    </span>
                </div>
            )}

            {step === 'tables' && (
                <div>
                    <div className="mb-4">
                        {OrderTypeSelector}
                    </div>

                    <TableGrid tables={tables} onSelect={onSelectTable} />
                </div>
            )}

            {step === 'items' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[calc(100vh-100px)]">
                    {!isCartExpanded && (
                        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
                            <div className="flex-none">
                                <div className="mb-3 flex flex-wrap items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
                                    {/* Back Button */}
                                    {orderType === 'Dine In' && (
                                        <button
                                            onClick={() => { setStep('tables'); setSelectedTable(null); }}
                                            className="px-3.5 py-2 border border-blue-200 dark:border-gray-600 bg-blue-50 dark:bg-gray-700 rounded-lg text-xs hover:bg-blue-100 dark:hover:bg-gray-600 transition-all flex items-center gap-2 font-bold text-blue-700 dark:text-gray-200 shadow-xs"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                            </svg>
                                            Back
                                        </button>
                                    )}

                                    {/* Order Type Selector */}
                                    <div className="h-full flex items-center">
                                        {OrderTypeSelector}
                                    </div>

                                    {/* Table Name */}
                                    {selectedTable && (
                                        <div className="flex items-center gap-2 ml-auto">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Table</span>
                                            <span className="px-4 py-1.5 bg-brand-500 text-white rounded-lg text-sm font-bold shadow-md shadow-brand-500/20">
                                                {selectedTable.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <CategoryList categories={categories} onSelect={onSelectCategory} selectedCategoryId={selectedCategory?.id} />
                            </div>

                            <div className={`mt-2 h-[calc(100vh-220px)] lg:h-auto lg:flex-1 min-h-0 overflow-hidden ${(isAdmin || isOwner) ? "" : "opacity-50 pointer-events-none"}`}>
                                <ItemGrid
                                    items={items}
                                    onAdd={addToCart}
                                    categoryName={selectedCategory?.name}
                                    onClearCategory={() => setSelectedCategory(null)}
                                />
                            </div>
                        </div>
                    )}

                    <div id="cart-section" className={`${isCartExpanded ? "lg:col-span-3" : ""} h-full flex flex-col overflow-hidden`}>
                        <div className="border border-gray-200 dark:border-gray-800 p-3 rounded-xl bg-white dark:bg-gray-900 transition-all duration-300 shadow-theme-sm h-full flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-2 flex-none">
                                <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    Cart
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-normal bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                                        Items: {cart.reduce((acc, item) => acc + item.qty, 0)}
                                    </span>
                                </h3>
                                <button
                                    onClick={() => setIsCartExpanded(!isCartExpanded)}
                                    className="p-1.5 text-gray-500 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    title={isCartExpanded ? "Collapse View" : "Expand Cart"}
                                >
                                    {isCartExpanded ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
                                </button>
                            </div>

                            {orderType === 'Home Delivery' && (
                                <div className={`mb-4 bg-blue-50 dark:bg-gray-700 rounded border border-blue-100 dark:border-gray-600 overflow-hidden transition-all ${(isAdmin || isOwner) ? "" : "opacity-80 pointer-events-none"}`}>
                                    <div
                                        className="flex items-center justify-between p-3 cursor-pointer bg-blue-100/50 dark:bg-gray-800/50"
                                        onClick={() => setIsDeliveryOpen(!isDeliveryOpen)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Delivery Details</h4>
                                            {!isDeliveryOpen && (
                                                <div className="flex gap-2 text-xs ml-2">
                                                    <span className={`flex items-center gap-1 ${customerPhone ? 'text-green-600' : 'text-red-500'}`}>
                                                        Phone {customerPhone ? <FaCheck /> : <span className="font-bold">✕</span>}
                                                    </span>
                                                    <span className={`flex items-center gap-1 ${deliveryAddress ? 'text-green-600' : 'text-red-500'}`}>
                                                        Address {deliveryAddress ? <FaCheck /> : <span className="font-bold">✕</span>}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {isDeliveryOpen ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
                                    </div>

                                    {isDeliveryOpen && (
                                        <div className="p-3 space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={customerPhone}
                                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                                    className={`w-full p-2 border rounded text-sm bg-white dark:bg-gray-950 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${!customerPhone ? 'border-red-300' : 'border-gray-300'}`}
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Address <span className="text-red-500">*</span></label>
                                                <textarea
                                                    value={deliveryAddress}
                                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                                    className={`w-full p-2 border rounded text-sm bg-white dark:bg-gray-950 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${!deliveryAddress ? 'border-red-300' : 'border-gray-300'}`}
                                                    placeholder="Enter full address"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={(isAdmin || isOwner) ? "" : "opacity-80 pointer-events-none"}>
                                <Cart items={cart} onQty={onQty} onRemove={onRemove} />
                            </div>

                            {!isOrderClosed ? (
                                <div className="flex flex-col gap-2 mt-3">
                                    <button
                                        onClick={placeOrder}
                                        disabled={(!isAdmin && !isOwner) || cart.length === 0}
                                        className="w-full py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-colors shadow-theme-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {currentOrderId ? "Update Order" : "Place Order"}
                                    </button>

                                    {(!isAdmin && !isOwner) && (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-center text-amber-700 dark:text-amber-400 text-xs font-medium">
                                            View Only: This order belongs to another user.
                                        </div>
                                    )}

                                    {isAdmin && currentOrderId ? (
                                        <button onClick={() => {
                                            if (!currentOrderId) return;
                                            const isDineIn = orderType === 'Dine In';
                                            setConfirmation({
                                                isOpen: true,
                                                title: isDineIn ? "Confirm Close" : "Confirm Close Order",
                                                message: isDineIn
                                                    ? "Close this table and complete the order?"
                                                    : "Are you sure you want to Close this order?",
                                                onConfirm: async () => {
                                                    try {
                                                        const res = await fetch(`/api/orders/${currentOrderId}/close`, { method: 'POST' });
                                                        if (res.ok) {
                                                            toast.success(isDineIn ? 'Table closed successfully' : 'Order closed successfully');
                                                            // clear cart and selected table
                                                            setCart([]);
                                                            setCurrentOrderId(null);
                                                            setIsCartExpanded(false);
                                                            // refresh tables
                                                            const tblRes = await fetch('/api/tables');
                                                            if (tblRes.ok) setTables(await tblRes.json());
                                                            setSelectedTable(null);
                                                            setStep('tables');
                                                            // If redirected from list, maybe go back?
                                                            if (searchParams.get('id')) {
                                                                router.push('/sale');
                                                            }
                                                        } else {
                                                            const data = await res.json();
                                                            console.error('Close failed', data);
                                                            showAlertDialog(data.message || (isDineIn ? 'Failed to close table' : 'Failed to close order'));
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        showAlertDialog(isDineIn ? 'Error closing table' : 'Error closing order');
                                                    }
                                                }
                                            });
                                        }} className="w-full py-2.5 px-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/30 transition-colors font-bold shadow-sm">
                                            {orderType === 'Dine In' ? "Close Table" : "Close Order"}
                                        </button>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-center text-gray-600 dark:text-gray-400 font-medium">
                                    Order is closed and cannot be modified.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={showDialog} onClose={closeAlertDialog} className="max-w-sm p-6" showCloseButton={false}>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Message</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{dialogMessage}</p>
                <button
                    onClick={closeAlertDialog}
                    className="w-full py-2 px-4 bg-brand-500 text-white rounded hover:bg-brand-600"
                >
                    OK
                </button>
            </Modal>

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
            />

            {/* Mobile Floating Actions */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 lg:hidden">
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
                    aria-label="Scroll to top"
                >
                    <FaArrowUp className="w-5 h-5" />
                </button>
                <button
                    onClick={() => document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="p-3 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition-colors relative"
                    aria-label="Scroll to cart"
                >
                    <FaShoppingCart className="w-5 h-5" />
                    {cart.reduce((acc, item) => acc + item.qty, 0) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                            {cart.reduce((acc, item) => acc + item.qty, 0)}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function SalePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SaleContent />
        </Suspense>
    );
}
