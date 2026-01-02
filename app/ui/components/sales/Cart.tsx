"use client";
import React from "react";

type CartItem = { id: number; itemName: string; price: number; qty: number };

export default function Cart({ items, onQty, onRemove, deliveryCharge, orderType, servicePercent }: { items: CartItem[]; onQty: (id: number, delta: number) => void; onRemove: (id: number) => void; deliveryCharge?: number; orderType?: string; servicePercent?: number }) {
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const serviceAmount = orderType === 'Dine In' ? total * (Number(servicePercent || 0) / 100) : 0;
    const net = total + serviceAmount + (orderType === 'Home Delivery' ? Number(deliveryCharge || 0) : 0);
    return (
        <div className="flex flex-col gap-3">
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="text-center text-gray-400">Cart empty</div>
                ) : (
                    items.map((it) => (
                        <div key={it.id} className="flex flex-row items-center justify-between py-2">
                            <div className="flex-1 pr-2">
                                <div className="font-medium text-sm text-gray-900 dark:text-white wrap-break-word" title={it.itemName}>{it.itemName}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{it.price.toFixed(2)} x {it.qty}</div>
                            </div>
                            <div className="flex items-center gap-2 ml-2 shrink-0">
                                <button aria-label={`Decrease ${it.itemName} quantity`} onClick={() => onQty(it.id, -1)} className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 rounded-lg transition-colors font-bold">-</button>
                                <div className="px-1 text-center font-bold text-sm w-6 text-gray-900 dark:text-white">{it.qty}</div>
                                <button aria-label={`Increase ${it.itemName} quantity`} onClick={() => onQty(it.id, 1)} className="w-8 h-8 flex items-center justify-center bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-900/30 rounded-lg transition-colors font-bold">+</button>
                                <button onClick={() => onRemove(it.id)} className="ml-1 p-2 text-gray-400 hover:text-red-500 transition-colors" aria-label={`Remove ${it.itemName}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="pt-2 border-t dark:border-gray-700">
                {orderType === 'Home Delivery' ? (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>Item total:</span>
                            <span className="font-bold">{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>DC:</span>
                            <span className="font-bold">{Number(deliveryCharge || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 dark:text-white border-t pt-2 font-bold">
                            <span>Net total:</span>
                            <span>{net.toFixed(2)}</span>
                        </div>
                    </div>
                ) : orderType === 'Dine In' ? (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>Item total:</span>
                            <span className="font-bold">{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>Service ({Number(servicePercent || 0).toFixed(2)}%):</span>
                            <span className="font-bold">{serviceAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 dark:text-white border-t pt-2 font-bold">
                            <span>Net total:</span>
                            <span>{net.toFixed(2)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center font-bold text-gray-900 dark:text-white">
                        <span>Total</span>
                        <span>{total.toFixed(2)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
