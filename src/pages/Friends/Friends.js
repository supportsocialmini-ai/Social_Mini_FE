import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Layout/Navbar';
import friendService from '../../services/friendService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { useTranslation } from 'react-i18next';

const Friends = () => {
    const { getFullAvatarUrl } = useAuth();
    const { t } = useTranslation();
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmData, setConfirmData] = useState({ isOpen: false, friendId: null, name: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                friendService.getFriends(),
                friendService.getPendingRequests()
            ]);

            // axiosClient đã bóc result nên Res là dữ liệu thô
            setFriends(friendsRes?.$values || friendsRes || []);
            setPendingRequests(requestsRes?.$values || requestsRes || []);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu bạn bè:", error);
            toast.error(t('friends.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAccept = async (requestId) => {
        try {
            await friendService.acceptRequest(requestId);
            toast.success(t('friends.acceptSuccess'));
            fetchData();
        } catch (error) {
            toast.error(error.errorMessage || "Lỗi khi chấp nhận lời mời.");
        }
    };

    const handleDecline = async (requestId) => {
        try {
            await friendService.declineRequest(requestId);
            toast.info(t('friends.declineSuccess'));
            fetchData();
        } catch (error) {
            toast.error(error.errorMessage || "Lỗi khi từ chối lời mời.");
        }
    };

    const handleUnfriend = async (friendId) => {
        if (window.confirm("Bạn có chắc chắn muốn hủy kết bạn?")) {
            try {
                await friendService.unfriend(friendId);
                toast.success(t('friends.unfriendSuccess'));
                fetchData();
            } catch (error) {
                toast.error(error.errorMessage || "Lỗi khi hủy kết bạn.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfcfd]">
            <Navbar />
            <main className="max-w-4xl mx-auto pt-10 px-6 pb-20">
                <h2 className="text-3xl font-black text-slate-800 mb-8">{t('friends.title')}</h2>

                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                    <section className="mb-12">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{t('friends.requestsTitle')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingRequests.map(req => (
                                <div key={req.friendId} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100">
                                            <img
                                                src={getFullAvatarUrl(req.requesterAvatar)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requesterName || 'U')}`}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{req.requesterName}</p>
                                            <p className="text-xs text-slate-500">@{req.requesterUsername || 'username'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAccept(req.friendId)}
                                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                                        >
                                            {t('friends.accept')}
                                        </button>
                                        <button
                                            onClick={() => handleDecline(req.friendId)}
                                            className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                                        >
                                            {t('friends.decline')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Friend List Section */}
                <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{t('friends.yourFriendsTitle', { count: friends.length })}</h3>
                    {loading ? (
                        <p className="text-slate-400 text-sm italic">{t('friends.loading')}</p>
                    ) : friends.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {friends.map(friend => (
                                <div key={friend.userId} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4 hover:shadow-md transition-all">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                        <img
                                            src={getFullAvatarUrl(friend.avatarUrl)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName || friend.username || 'U')}`}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-slate-800">{friend.fullName || friend.username}</p>
                                        <p className="text-xs text-indigo-500 font-bold uppercase tracking-tighter">{t('navbar.friends')}</p>
                                    </div>
                                    <button
                                        onClick={() => setConfirmData({
                                            isOpen: true,
                                            friendId: friend.userId,
                                            name: friend.fullName || friend.username
                                        })}
                                        className="text-xs font-bold text-red-400 hover:text-red-600 transition-all bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl"
                                    >
                                        {t('friends.unfriend')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
                            <p className="text-slate-400 font-medium">{t('friends.noFriends')}</p>
                        </div>
                    )}
                </section>
            </main>

             <ConfirmModal
                isOpen={confirmData.isOpen}
                onClose={() => setConfirmData({ ...confirmData, isOpen: false })}
                onConfirm={handleUnfriend}
                title={t('profile.unfriendConfirmTitle') || "Unfriend?"}
                message={t('profile.unfriendConfirmMsg', { name: confirmData.name })}
                confirmText={t('profile.unfriendConfirmBtn') || "Unfriend"}
                type="danger"
            />
        </div>
    );
};

export default Friends;
