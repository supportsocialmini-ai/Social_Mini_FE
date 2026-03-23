import React, { useState, useEffect } from 'react';
import postService from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const LikesModal = ({ postId, isOpen, onClose }) => {
    const { getFullAvatarUrl } = useAuth();
    const [likes, setLikes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchLikes();
        }
    }, [isOpen, postId]);

    const fetchLikes = async () => {
        setIsLoading(true);
        try {
            const response = await postService.getPostLikes(postId);
            // axiosClient đã bóc result nên response là List<User>
            const data = response?.$values || response || [];
            setLikes(data);
        } catch (error) {
            console.error("Lỗi lấy danh sách like:", error);
            toast.error(error.errorMessage || "Không thể tải danh sách người thích");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[70vh]">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Người đã thích</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        </div>
                    ) : likes.length === 0 ? (
                        <p className="text-center text-slate-400 py-8">Chưa có ai thích bài viết này</p>
                    ) : (
                        likes.map(user => (
                            <div key={user.userId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-2xl transition-all">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-100">
                                    {user.avatarUrl ? (
                                        <img
                                            src={getFullAvatarUrl(user.avatarUrl)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}`}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase">
                                            {user.username.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{user.fullName || user.username}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">@{user.username}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LikesModal;
