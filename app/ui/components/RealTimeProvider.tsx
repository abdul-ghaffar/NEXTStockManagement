"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/app/ui/context/AuthContext";
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

type Notification = {
    id: string;
    type: "ORDER_CREATED" | "ORDER_UPDATED" | "ORDER_CLOSED";
    message: string;
    data: any;
    timestamp: Date;
    read: boolean;
};

type RealTimeContextType = {
    notifications: Notification[];
    markAsRead: (id: string) => void;
    clearAll: () => void;
    subscribe: (event: string, callback: (data: any) => void) => () => void;
};

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export const RealTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const subscribersRef = useRef<{ [event: string]: ((data: any) => void)[] }>({});

    const subscribe = useCallback((event: string, callback: (data: any) => void) => {
        if (!subscribersRef.current[event]) {
            subscribersRef.current[event] = [];
        }
        subscribersRef.current[event].push(callback);

        return () => {
            subscribersRef.current[event] = subscribersRef.current[event].filter(cb => cb !== callback);
        };
    }, []);

    useEffect(() => {
        if (!user) return;

        console.log("Establishing SSE connection...");
        const eventSource = new EventSource("/api/notifications/stream");

        const handleEvent = (type: "ORDER_CREATED" | "ORDER_UPDATED" | "ORDER_CLOSED", data: any) => {
            console.log(`Received real-time event: ${type}`, data);

            // Filter: Admin only AND do not show to the sender
            if (!user?.IsAdmin) return;
            if (data.userId && data.userId === user.ID) return;

            // Trigger Toastify
            if (type === "ORDER_CREATED") {
                const orderInfo = data.type === 'Dine In' ? `table: ${data.tableName}` : data.type;
                toast.success(
                    <div className="cursor-pointer" onClick={() => router.push(`/order-management/sale?id=${data.orderId}&expanded=true`)}>
                        <div className="font-bold underline decoration-2 underline-offset-2">New Order #{data.orderId}</div>
                        <div className="text-sm mt-1">{orderInfo}, amt: {data.amount}</div>
                    </div>,
                    {
                        autoClose: false,
                        closeOnClick: false,
                    }
                );
            } else if (type === "ORDER_UPDATED") {
                toast.info(
                    <div className="cursor-pointer" onClick={() => router.push(`/order-management/sale?id=${data.orderId}&expanded=true`)}>
                        <div className="font-bold underline decoration-2 underline-offset-2">Order Updated #{data.orderId}</div>
                        <div className="text-sm mt-1">New amount: {data.amount}</div>
                    </div>,
                    {
                        autoClose: false,
                        closeOnClick: false,
                    }
                );
            } else if (type === "ORDER_CLOSED") {
                toast.warn(
                    <div className="cursor-pointer" onClick={() => router.push(`/order-management/sale?id=${data.orderId}&expanded=true`)}>
                        <div className="font-bold underline decoration-2 underline-offset-2">Order Closed #{data.orderId}</div>
                        <div className="text-sm mt-1">Closed by {data.user}</div>
                    </div>,
                    {
                        autoClose: 5000,
                        closeOnClick: false,
                    }
                );
            }

            // Create notification object for state
            const newNotification: Notification = {
                id: Math.random().toString(36).substr(2, 9),
                type,
                message: `${type} event received for order #${data.orderId}`,
                data,
                timestamp: new Date(),
                read: false
            };

            setNotifications(prev => [newNotification, ...prev].slice(0, 50));

            // Notify local subscribers
            const currentSubscribers = subscribersRef.current[type];
            if (currentSubscribers) {
                currentSubscribers.forEach(cb => {
                    try { cb(data); } catch (err) { console.error("Subscriber error:", err); }
                });
            }
        };

        const onCreated = (e: MessageEvent) => handleEvent("ORDER_CREATED", JSON.parse(e.data));
        const onUpdated = (e: MessageEvent) => handleEvent("ORDER_UPDATED", JSON.parse(e.data));
        const onClosed = (e: MessageEvent) => handleEvent("ORDER_CLOSED", JSON.parse(e.data));

        eventSource.addEventListener("ORDER_CREATED", onCreated);
        eventSource.addEventListener("ORDER_UPDATED", onUpdated);
        eventSource.addEventListener("ORDER_CLOSED", onClosed);

        eventSource.onerror = (err) => {
            console.error("SSE Connection Error:", err);
            eventSource.close();
        };

        return () => {
            console.log("Closing SSE connection...");
            eventSource.close();
        };
    }, [user, router]);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <RealTimeContext.Provider value={{ notifications, markAsRead, clearAll, subscribe }}>
            {children}
        </RealTimeContext.Provider>
    );
};

export const useRealTime = () => {
    const context = useContext(RealTimeContext);
    if (!context) {
        throw new Error("useRealTime must be used within a RealTimeProvider");
    }
    return context;
};
