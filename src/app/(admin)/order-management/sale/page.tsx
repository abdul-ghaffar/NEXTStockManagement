"use client";
import React, { useEffect, useState } from "react";
import { Modal, ConfirmationModal } from "@/components/ui/modal";
import TableGrid from "@/components/sales/TableGrid";
import CategoryList from "@/components/sales/CategoryList";
import ItemGrid from "@/components/sales/ItemGrid";
import Cart from "@/components/sales/Cart";
import { FaExpand, FaCompress, FaArrowUp, FaShoppingCart, FaCheck, FaChevronDown, FaChevronUp } from "react-icons/fa";

type Table = { id: number; name: string; isActive?: boolean; saleId?: number | null; saleTotal?: number | null };
type Category = { id: number; name: string };
type Item = { id: number; itemCode: string; itemName: string; price: number };

export default function SalePage() {
    const [step, setStep] = useState<"tables" | "items">("tables");
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
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

    useEffect(() => {
        fetch('/api/tables').then(r => r.json()).then(setTables).catch(err => console.error(err));
        fetch('/api/categories').then(r => r.json()).then(setCategories).catch(err => console.error(err));
    }, []);

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
                    const mapped = items.map((it: any, idx: number) => ({
                        id: it.prodID ?? idx,
                        itemCode: it.ItemCode,
                        itemName: it.ItemName || it.itemName || '',
                        price: Number(it.SalePrice) || Number(it.price) || 0,
                        qty: Number(it.Qty) || 1
                    }));
                    setCart(mapped);
                    setCurrentOrderId(Number(t.saleId));
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
        }
        setStep('items');
    };

    const onSelectCategory = (c: Category) => {
        if (selectedCategory?.id === c.id) {
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

        try {
            const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sale) });
            const data = await res.json();
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

            showAlertDialog('Order saved');
            // After saving, go back to the tables view
            setCart([]);
            setSelectedTable(null);
            setStep('tables');
        } catch (err) {
            console.error(err); // Log error for debugging
            showAlertDialog('Error saving order');
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-3">Sale / POS</h1>

            {/* Order Type Selector - Always visible */}
            <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
                {['Dine In', 'Take Away', 'Home Delivery'].map(type => (
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
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${orderType === type
                            ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-white'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {step === 'tables' && (
                <div>
                    <h2 className="mb-2 font-medium">Select Table</h2>
                    <TableGrid tables={tables} onSelect={onSelectTable} />
                </div>
            )}

            {step === 'items' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {!isCartExpanded && (
                        <div className="lg:col-span-2">
                            <div className="mb-2 flex items-center justify-between">
                                <div>
                                    {orderType === 'Dine In' && (
                                        <>
                                            <button onClick={() => { setStep('tables'); setSelectedTable(null); }} className="px-3 py-1 border rounded">Back</button>
                                            <span className="ml-3 font-medium">Table: {selectedTable?.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <CategoryList categories={categories} onSelect={onSelectCategory} selectedCategoryId={selectedCategory?.id} />

                            <div className="mt-3">
                                <ItemGrid
                                    items={items}
                                    onAdd={addToCart}
                                    categoryName={selectedCategory?.name}
                                    onClearCategory={() => setSelectedCategory(null)}
                                />
                            </div>
                        </div>
                    )}

                    <div id="cart-section" className={isCartExpanded ? "lg:col-span-3" : ""}>
                        <div className="border p-3 rounded-lg bg-white dark:bg-gray-800 transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">Cart</h3>
                                <button
                                    onClick={() => setIsCartExpanded(!isCartExpanded)}
                                    className="p-1.5 text-gray-500 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    title={isCartExpanded ? "Collapse View" : "Expand Cart"}
                                >
                                    {isCartExpanded ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
                                </button>
                            </div>

                            {orderType === 'Home Delivery' && (
                                <div className="mb-4 bg-blue-50 dark:bg-gray-700 rounded border border-blue-100 dark:border-gray-600 overflow-hidden transition-all">
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
                                                    className={`w-full p-2 border rounded text-sm dark:bg-gray-800 dark:border-gray-600 ${!customerPhone ? 'border-red-300' : 'border-gray-300'}`}
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Address <span className="text-red-500">*</span></label>
                                                <textarea
                                                    value={deliveryAddress}
                                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                                    className={`w-full p-2 border rounded text-sm dark:bg-gray-800 dark:border-gray-600 ${!deliveryAddress ? 'border-red-300' : 'border-gray-300'}`}
                                                    placeholder="Enter full address"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Cart items={cart} onQty={onQty} onRemove={onRemove} />
                            <div className="flex gap-2 mt-3">
                                <button onClick={placeOrder} className="flex-1 py-2 rounded bg-brand-500 text-white">{currentOrderId ? "Update Order" : "Place Order"}</button>
                                {currentOrderId ? (
                                    <button onClick={() => {
                                        if (!currentOrderId) return;

                                        setConfirmation({
                                            isOpen: true,
                                            title: "Confirm Close",
                                            message: "Close this table and complete the order?",
                                            onConfirm: async () => {
                                                try {
                                                    const res = await fetch(`/api/orders/${currentOrderId}/close`, { method: 'POST' });
                                                    if (res.ok) {
                                                        showAlertDialog('Table closed');
                                                        // clear cart and selected table
                                                        setCart([]);
                                                        setCurrentOrderId(null);
                                                        setIsCartExpanded(false);
                                                        // refresh tables
                                                        const tblRes = await fetch('/api/tables');
                                                        if (tblRes.ok) setTables(await tblRes.json());
                                                        setSelectedTable(null);
                                                        setStep('tables');
                                                    } else {
                                                        const data = await res.json(); // Log error for debugging
                                                        console.error('Close failed', data);
                                                        showAlertDialog('Failed to close table');
                                                    }
                                                } catch (err) {
                                                    console.error(err); // Log error for debugging
                                                    showAlertDialog('Error closing table');
                                                }
                                            }
                                        });
                                    }} className="py-2 px-3 rounded border bg-white">Close</button>
                                ) : null}
                            </div>
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
                    className="p-3 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition-colors"
                    aria-label="Scroll to cart"
                >
                    <FaShoppingCart className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
