"use client";

import React from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const NotificationToaster: React.FC = () => {
    const [hasActiveToasts, setHasActiveToasts] = React.useState(false);
    const activeToastIds = React.useRef(new Set<string | number>());

    React.useEffect(() => {
        const unsubscribe = toast.onChange((payload) => {
            if (payload.status === "added") {
                activeToastIds.current.add(payload.id);
            } else if (payload.status === "removed") {
                activeToastIds.current.delete(payload.id);
            }
            setHasActiveToasts(activeToastIds.current.size > 0);
        });

        return () => {
            // unsubscribe is a function returned by toast.onChange
            if (typeof unsubscribe === 'function') {
                (unsubscribe as () => void)();
            }
        };
    }, []);

    return (
        <>
            {hasActiveToasts && (
                <div className="fixed bottom-24 right-4 z-[99999]">
                    <button
                        onClick={() => toast.dismiss()}
                        className="bg-gray-800/80 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border border-white/10 shadow-lg transition-all"
                    >
                        Clear All Notifications
                    </button>
                </div>
            )}
            <ToastContainer position="top-right" style={{ top: '70px' }} />
        </>
    );
};
