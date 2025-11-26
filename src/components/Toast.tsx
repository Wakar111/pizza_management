import { useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    show: boolean;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type = 'success', show, onClose, duration = 2000 }: ToastProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show) return null;

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    }[type];

    return (
        <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transition-opacity z-50 animate-fade-in`}>
            {message}
        </div>
    );
}
