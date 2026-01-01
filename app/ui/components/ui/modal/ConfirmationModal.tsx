import React from "react";
import { Modal } from "./index";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonColor?: string; // Optional custom color for confirm button
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmButtonColor = "bg-brand-500 hover:bg-brand-600",
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm p-6" showCloseButton={false}>
            <h3 className="text-lg font-semibold mb-4 dark:text-white">{title}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    {cancelText}
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={`px-4 py-2 text-white rounded transition-colors ${confirmButtonColor}`}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};
