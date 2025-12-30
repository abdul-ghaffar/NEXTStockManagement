"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Modal } from "@/components/ui/modal";

const NetworkAccess: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [networkUrl, setNetworkUrl] = useState<string>("");

    useEffect(() => {
        const fetchUrl = async () => {
            if (window.api && window.api.getNetworkUrl) {
                const url = await window.api.getNetworkUrl();
                setNetworkUrl(url);
            }
        };
        fetchUrl();
    }, []);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                title="Network Access"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M4.99976 19C4.99976 19 6.99976 15 11.9998 15C16.9998 15 18.9998 19 18.9998 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M2 12C2 12.5523 2.44772 13 3 13C3.55228 13 4 12.5523 4 12C4 11.4477 3.55228 11 3 11C2.44772 11 2 11.4477 2 12Z"
                        fill="currentColor"
                    />
                    <path
                        d="M20 12C20 12.5523 20.4477 13 21 13C21.5523 13 22 12.5523 22 12C22 11.4477 21.5523 11 21 11C20.4477 11 20 11.4477 20 12Z"
                        fill="currentColor"
                    />
                    <path
                        d="M11 21C11 21.5523 11.4477 22 12 22C12.5523 22 13 21.5523 13 21C13 20.4477 12.5523 20 12 20C11.4477 20 11 20.4477 11 21Z"
                        fill="currentColor"
                    />
                </svg>
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-[400px]">
                <div className="p-6 text-center">
                    <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white">
                        Access via Remote Device
                    </h3>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                        Scan the QR code or visit the URL below on any device connected to the same Wi-Fi.
                    </p>

                    <div className="mb-6 flex justify-center rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                        {networkUrl ? (
                            <QRCodeSVG value={networkUrl} size={200} />
                        ) : (
                            <div className="flex h-[200px] w-[200px] items-center justify-center text-gray-400">
                                Loading...
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                            Network URL
                        </p>
                        <p className="mt-1 font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">
                            {networkUrl || "Detecting..."}
                        </p>
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="mt-8 w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default NetworkAccess;
