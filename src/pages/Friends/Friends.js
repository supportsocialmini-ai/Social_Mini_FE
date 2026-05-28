import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import friendService from '../../services/friendService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 12;

const PRESET_CATEGORIES = [
  "Công nghệ", "Kinh doanh", "Giải trí", "Giáo dục", "Khoa học",
  "Sức khỏe", "Thể thao", "Nghệ thuật", "Xã hội", "Đời sống",
  "Văn hóa", "Thiên nhiên", "Chính trị", "Tôn giáo", "Công nghiệp",
  "Truyền thông", "Mua sắm", "Du lịch", "Ẩm thực", "Thời trang",
  "Gia đình", "Quan hệ", "Nghề nghiệp", "Tài chính", "Nhà cửa",
  "Xe cộ", "Cộng đồng", "Sở thích", "Hoạt động ngoài trời", "Phát triển bản thân"
];

const GRAD_PAIRS = [
  '#6366f1,#8b5cf6', '#ec4899,#f43f5e', '#10b981,#06b6d4',
  '#f59e0b,#f97316', '#a855f7,#6366f1', '#3b82f6,#06b6d4',
  '#ef4444,#f97316', '#14b8a6,#06b6d4',
];

const glassCardStyle = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 8px 32px rgba(99,102,241,0.07), 0 2px 8px rgba(0,0,0,0.04)',
};

const Friends = () => {
    const { user, getFullAvatarUrl } = useAuth();
    const { t } = useTranslation();
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmData, setConfirmData] = useState({ isOpen: false, friendId: null, name: '' });
    
    // Tab state: 'list' (Bạn bè), 'requests' (Lời mời), 'suggestions' (Gợi ý)
    const [activeTab, setActiveTab] = useState('list');

    // Suggestions states
    const [allUsers, setAllUsers] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [sentIds, setSentIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [suggestionsPage, setSuggestionsPage] = useState(1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                friendService.getFriends(),
                friendService.getPendingRequests()
            ]);

            setFriends(friendsRes?.$values || friendsRes || []);
            setPendingRequests(requestsRes?.$values || requestsRes || []);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu bạn bè:", error);
            toast.error(t('friends.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestions = async () => {
        setSuggestionsLoading(true);
        try {
            const response = await userService.getUsers();
            let data = response?.$values || response || [];
            if (!Array.isArray(data)) data = [data];

            // Exclude current user
            const others = data.filter(u => u && u.userId !== user?.userId);

            // Get friendship statuses in parallel
            const withStatus = await Promise.all(
                others.map(async (u) => {
                    try {
                        const res = await friendService.getFriendshipStatus(u.userId);
                        return { ...u, friendshipStatus: res?.status || 'None' };
                    } catch {
                        return { ...u, friendshipStatus: 'None' };
                    }
                })
            );

            const sent = new Set(
                withStatus.filter(u => u.friendshipStatus === 'Sent').map(u => u.userId)
            );

            setSentIds(sent);
            // Exclude already accepted friends
            setAllUsers(withStatus.filter(u => u.friendshipStatus !== 'Accepted'));
        } catch (err) {
            console.error("Lỗi lấy gợi ý kết bạn:", err);
            toast.error('Không thể tải danh sách gợi ý');
        } finally {
            setSuggestionsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'suggestions' && allUsers.length === 0) {
            fetchSuggestions();
        }
    }, [activeTab]);

    // Reset suggestions page on filter change
    useEffect(() => {
        setSuggestionsPage(1);
    }, [searchTerm, filterCategory]);

    const handleAccept = async (requestId) => {
        try {
            await friendService.acceptRequest(requestId);
            fetchData();
            // If suggestions was loaded, we should refresh it too
            if (allUsers.length > 0) {
                fetchSuggestions();
            }
        } catch (error) {
            toast.error(t(`api.${error.errorMessage || 'Friend.Action.AcceptFail'}`));
        }
    };

    const handleDecline = async (requestId) => {
        try {
            await friendService.declineRequest(requestId);
            fetchData();
            if (allUsers.length > 0) {
                fetchSuggestions();
            }
        } catch (error) {
            toast.error(t(`api.${error.errorMessage || 'Friend.Action.DeclineFail'}`));
        }
    };

    const handleUnfriend = async () => {
        const friendId = confirmData.friendId;
        if (!friendId) return;
        
        try {
            await friendService.unfriend(friendId);
            setConfirmData({ ...confirmData, isOpen: false });
            fetchData();
            if (allUsers.length > 0) {
                fetchSuggestions();
            }
        } catch (error) {
            toast.error(t(`api.${error.errorMessage || 'Friend.Action.UnfriendFail'}`));
        }
    };

    const handleAddFriend = async (userId, fullName) => {
        setSentIds(prev => new Set([...prev, userId]));
        try {
            await friendService.sendRequest(userId);
            toast.success(`Đã gửi lời mời kết bạn tới ${fullName}!`);
        } catch {
            setSentIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
            toast.error('Không thể gửi lời mời kết bạn');
        }
    };

    // Filtered suggestions
    const filteredSuggestions = allUsers.filter(u => {
        const cat = (u.category || u.Category || '').trim();
        const matchCat = !filterCategory || cat === filterCategory;
        const matchSearch = !searchTerm.trim() ||
            (u.fullName || u.FullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.username || u.Username || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchCat && matchSearch;
    });

    const suggestionsTotalPages = Math.max(1, Math.ceil(filteredSuggestions.length / PAGE_SIZE));
    const paginatedSuggestions = filteredSuggestions.slice((suggestionsPage - 1) * PAGE_SIZE, suggestionsPage * PAGE_SIZE);

    const getPageRange = () => {
        const delta = 2;
        const range = [];
        for (let i = Math.max(1, suggestionsPage - delta); i <= Math.min(suggestionsTotalPages, suggestionsPage + delta); i++) {
            range.push(i);
        }
        if (range[0] > 1) { range.unshift('...'); range.unshift(1); }
        if (range[range.length - 1] < suggestionsTotalPages) { range.push('...'); range.push(suggestionsTotalPages); }
        return range;
    };

    return (
        <div className="min-h-screen bg-[#fcfcfd]">
            <Navbar />
            <main className="max-w-6xl mx-auto pt-10 px-4 sm:px-6 pb-20">
                <h2 className="text-3xl font-black text-slate-800 mb-8">{t('friends.title')}</h2>

                {/* Tab Switcher */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto whitespace-nowrap scrollbar-none">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`pb-4 px-4 font-bold text-sm transition-all border-b-2 outline-none ${
                            activeTab === 'list'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {t('navbar.friends')} ({friends.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`pb-4 px-4 font-bold text-sm transition-all border-b-2 outline-none relative ${
                            activeTab === 'requests'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {t('friends.requestsTitle')}
                        {pendingRequests.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-black animate-pulse">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('suggestions')}
                        className={`pb-4 px-4 font-bold text-sm transition-all border-b-2 outline-none ${
                            activeTab === 'suggestions'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Gợi ý kết bạn
                    </button>
                </div>

                {/* Tab 1: Danh sách bạn bè */}
                {activeTab === 'list' && (
                    <section className="animate-fadeIn">
                        {loading ? (
                            <p className="text-slate-400 text-sm italic">{t('friends.loading')}</p>
                        ) : friends.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {friends.map(friend => (
                                    <div key={friend.userId} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4 hover:shadow-md transition-all">
                                        <Link to={`/profile/${friend.userId}`} className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
                                            <img
                                                src={getFullAvatarUrl(friend.avatarUrl)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName || friend.username || 'U')}`}
                                            />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/profile/${friend.userId}`} className="font-black text-slate-800 hover:text-indigo-600 transition-colors truncate block">
                                                {friend.fullName || friend.username}
                                            </Link>
                                            <p className="text-xs text-indigo-500 font-bold uppercase tracking-tighter">{t('navbar.friends')}</p>
                                        </div>
                                        <button
                                            onClick={() => setConfirmData({
                                                isOpen: true,
                                                friendId: friend.userId,
                                                name: friend.fullName || friend.username
                                            })}
                                            className="text-xs font-bold text-red-400 hover:text-red-600 transition-all bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl flex-shrink-0"
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
                )}

                {/* Tab 2: Lời mời kết bạn */}
                {activeTab === 'requests' && (
                    <section className="animate-fadeIn">
                        {loading ? (
                            <p className="text-slate-400 text-sm italic">{t('friends.loading')}</p>
                        ) : pendingRequests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pendingRequests.map(req => (
                                    <div key={req.friendId} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Link to={`/profile/${req.requesterId || req.friendId}`} className="w-12 h-12 rounded-full overflow-hidden border border-slate-100 flex-shrink-0">
                                                <img
                                                    src={getFullAvatarUrl(req.requesterAvatar)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requesterName || 'U')}`}
                                                />
                                            </Link>
                                            <div className="min-w-0">
                                                <Link to={`/profile/${req.requesterId || req.friendId}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate block">
                                                    {req.requesterName}
                                                </Link>
                                                <p className="text-xs text-slate-500 truncate">@{req.requesterUsername || 'username'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
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
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
                                <p className="text-slate-400 font-medium">Không có lời mời kết bạn nào.</p>
                            </div>
                        )}
                    </section>
                )}

                {/* Tab 3: Gợi ý kết bạn */}
                {activeTab === 'suggestions' && (
                    <section className="animate-fadeIn">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            {/* Search */}
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên hoặc username..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Category filter */}
                            <div className="relative sm:w-60">
                                <select
                                    value={filterCategory}
                                    onChange={e => setFilterCategory(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-violet-400 outline-none transition-all text-sm font-semibold text-slate-700 appearance-none cursor-pointer"
                                >
                                    <option value="">Tất cả lĩnh vực</option>
                                    {PRESET_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                {filterCategory && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                                        {filterCategory}
                                        <button onClick={() => setFilterCategory('')} className="hover:bg-violet-200 rounded-full w-3.5 h-3.5 flex items-center justify-center transition-colors">×</button>
                                    </span>
                                )}
                                {!suggestionsLoading && (
                                    <span className="text-sm text-slate-500 font-medium">
                                        Tìm thấy {filteredSuggestions.length} gợi ý
                                    </span>
                                )}
                            </div>
                            {suggestionsTotalPages > 1 && (
                                <span className="text-xs text-slate-400 font-medium">
                                    Trang {suggestionsPage}/{suggestionsTotalPages}
                                </span>
                            )}
                        </div>

                        {/* Loading skeletal / Grid */}
                        {suggestionsLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="rounded-3xl p-6 animate-pulse" style={glassCardStyle}>
                                        <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto mb-4" />
                                        <div className="h-4 bg-slate-200 rounded-full w-3/4 mx-auto mb-2" />
                                        <div className="h-3 bg-slate-100 rounded-full w-1/2 mx-auto mb-4" />
                                        <div className="h-9 bg-slate-100 rounded-2xl w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : paginatedSuggestions.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                    {paginatedSuggestions.map((u, i) => {
                                        const grad = GRAD_PAIRS[(i + (suggestionsPage - 1) * PAGE_SIZE) % GRAD_PAIRS.length];
                                        const isSent = sentIds.has(u.userId);
                                        return (
                                            <div
                                                key={u.userId}
                                                className="rounded-3xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:translate-y-[-4px] group"
                                                style={glassCardStyle}
                                            >
                                                {/* Avatar */}
                                                <Link to={`/profile/${u.userId}`} className="relative mb-4">
                                                    <div
                                                        className="w-18 h-18 rounded-full p-[3px] transition-transform duration-300 group-hover:scale-105"
                                                        style={{ background: `linear-gradient(135deg, ${grad})`, width: 72, height: 72 }}
                                                    >
                                                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-200">
                                                            <img
                                                                src={getFullAvatarUrl(u.avatarUrl, u.fullName || u.username)}
                                                                alt={u.fullName}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || u.username || 'U')}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </Link>

                                                {/* Info */}
                                                <Link to={`/profile/${u.userId}`} className="w-full">
                                                    <p className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
                                                        {u.fullName || u.username}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate mb-1">@{u.username}</p>
                                                </Link>

                                                {/* Category badge */}
                                                {(() => {
                                                    const cat = (u.category || u.Category || '').trim();
                                                    return cat ? (
                                                        <span
                                                            className="inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-3 mt-1 cursor-pointer transition-all"
                                                            style={{
                                                                background: filterCategory === cat ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.08)',
                                                                color: filterCategory === cat ? '#fff' : '#6366f1',
                                                            }}
                                                            onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                                                            title="Lọc theo lĩnh vực này"
                                                        >
                                                            {cat}
                                                        </span>
                                                    ) : <div className="mb-3 mt-1" />;
                                                })()}

                                                {/* Action button */}
                                                <button
                                                    onClick={() => !isSent && handleAddFriend(u.userId, u.fullName)}
                                                    disabled={isSent}
                                                    className="w-full py-2 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95 mt-auto"
                                                    style={isSent
                                                        ? { background: 'rgba(99,102,241,0.06)', color: '#94a3b8', cursor: 'default' }
                                                        : { background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }
                                                    }
                                                    onMouseEnter={e => !isSent && (e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)', e.currentTarget.style.color = '#fff', e.currentTarget.style.border = 'none')}
                                                    onMouseLeave={e => !isSent && (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', e.currentTarget.style.color = '#6366f1', e.currentTarget.style.border = '1px solid rgba(99,102,241,0.2)')}
                                                >
                                                    {isSent ? '✓ Đã gửi lời mời' : '+ Thêm bạn'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {suggestionsTotalPages > 1 && (
                                    <div className="flex items-center justify-center gap-1.5 mt-10">
                                        <button
                                            onClick={() => setSuggestionsPage(p => Math.max(1, p - 1))}
                                            disabled={suggestionsPage === 1}
                                            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                                            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226,232,240,0.8)', color: '#6366f1' }}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>

                                        {getPageRange().map((page, idx) =>
                                            page === '...' ? (
                                                <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-slate-400 font-bold text-sm">…</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() => setSuggestionsPage(page)}
                                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all hover:scale-105 active:scale-95"
                                                    style={suggestionsPage === page
                                                        ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }
                                                        : { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226,232,240,0.8)', color: '#475569' }
                                                    }
                                                >
                                                    {page}
                                                </button>
                                            )
                                        )}

                                        <button
                                            onClick={() => setSuggestionsPage(p => Math.min(suggestionsTotalPages, p + 1))}
                                            disabled={suggestionsPage === suggestionsTotalPages}
                                            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                                            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226,232,240,0.8)', color: '#6366f1' }}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center">
                                <svg className="w-14 h-14 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-slate-400 font-semibold mb-1">Không tìm thấy người dùng phù hợp</p>
                                <p className="text-slate-300 text-sm mb-4">Thử thay đổi từ khóa hoặc lĩnh vực khác</p>
                                <button
                                    onClick={() => { setSearchTerm(''); setFilterCategory(''); }}
                                    className="text-sm font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </section>
                )}
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
