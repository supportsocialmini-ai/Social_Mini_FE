import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Xác nhận", cancelText = "Hủy", type = "danger" }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return (
                    <div className="w-16 h-16 rounded-[2rem] bg-red-50 flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-16 h-16 rounded-[2rem] bg-amber-50 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col items-center text-center group">
                {getIcon()}

                <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-3">
                    {title}
                </h3>

                <p className="text-slate-400 font-medium text-[15px] leading-relaxed mb-10 px-2">
                    {message}
                </p>

                <div className="flex flex-col w-full gap-4">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`w-full py-4.5 rounded-3xl font-bold text-sm transition-all active:scale-95 shadow-xl ${type === 'danger'
                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200 hover:shadow-red-300'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300'
                            }`}
                    >
                        {confirmText}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-4.5 rounded-3xl font-bold text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
