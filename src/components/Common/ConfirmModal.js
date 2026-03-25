import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Xác nhận", cancelText = "Hủy", type = "danger" }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return (
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-rose-200 blur-2xl opacity-40 rounded-full animate-pulse"></div>
                        <div className="relative w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-rose-50 to-white flex items-center justify-center text-rose-500 shadow-inner border border-rose-100/50 group-hover:rotate-12 transition-transform duration-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                    </div>
                );
            case 'warning':
                return (
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-amber-200 blur-2xl opacity-40 rounded-full animate-pulse"></div>
                        <div className="relative w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-amber-50 to-white flex items-center justify-center text-amber-500 shadow-inner border border-amber-100/50 group-hover:rotate-12 transition-transform duration-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="relative bg-white/90 backdrop-blur-2xl w-full max-w-sm rounded-[3.5rem] p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] border border-white/40 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 flex flex-col items-center text-center group">
                <div className="absolute top-6 right-8">
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors p-2 hover:bg-slate-50 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                {getIcon()}

                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-4 leading-tight">
                    {title}
                </h3>

                <p className="text-slate-500 font-semibold text-[16px] leading-relaxed mb-12 px-2 opacity-80">
                    {message}
                </p>

                <div className="flex flex-col w-full gap-4">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`group/btn relative w-full py-5 rounded-[2rem] font-black text-sm tracking-widest uppercase transition-all active:scale-95 overflow-hidden shadow-2xl ${type === 'danger'
                                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-200'
                                : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-indigo-200'
                            }`}
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                        <span className="relative z-10">{confirmText}</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-5 rounded-[2rem] font-bold text-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 transition-all active:scale-95"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
