import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import friendService from '../../services/friendService';
import { toast } from 'react-toastify';

const PAGE_SIZE = 12;

const PRESET_CATEGORIES = [
  "Công nghệ", "Kinh doanh", "Giải trí", "Giáo dục", "Khoa học",
  "Sức khỏe", "Thể thao", "Nghệ thuật", "Xã hội", "Đời sống",
  "Văn hóa", "Thiên nhiên", "Chính trị", "Tôn giáo", "Công nghiệp",
  "Truyền thông", "Mua sắm", "Du lịch", "Ẩm thực", "Thời trang",
  "Gia đình", "Quan hệ", "Nghề nghiệp", "Tài chính", "Nhà cửa",
  "Xe cộ", "Cộng đồng", "Sở thích", "Hoạt động ngoài trời", "Phát triển bản thân"
];

const glass = {
  card: {
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 8px 32px rgba(99,102,241,0.07), 0 2px 8px rgba(0,0,0,0.04)',
  }
};

const GRAD_PAIRS = [
  '#6366f1,#8b5cf6', '#ec4899,#f43f5e', '#10b981,#06b6d4',
  '#f59e0b,#f97316', '#a855f7,#6366f1', '#3b82f6,#06b6d4',
  '#ef4444,#f97316', '#14b8a6,#06b6d4',
];

const PeopleSuggestions = () => {
  const { user, getFullAvatarUrl } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentIds, setSentIds] = useState(new Set());
  const [friendIds, setFriendIds] = useState(new Set());

  // Filter & search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all users + friendship status
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
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

        const friends = new Set(
          withStatus.filter(u => u.friendshipStatus === 'Accepted').map(u => u.userId)
        );
        const sent = new Set(
          withStatus.filter(u => u.friendshipStatus === 'Sent').map(u => u.userId)
        );

        setFriendIds(friends);
        setSentIds(sent);
        setAllUsers(withStatus.filter(u => u.friendshipStatus !== 'Accepted'));
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách người dùng');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  // Reset page khi filter thay đổi
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategory]);

  // Filtered list
  const filtered = allUsers.filter(u => {
    // C# API có thể trả về Category (PascalCase) hoặc category (camelCase)
    const cat = (u.category || u.Category || '').trim();
    const matchCat = !filterCategory || cat === filterCategory;
    const matchSearch = !searchTerm.trim() ||
      (u.fullName || u.FullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || u.Username || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

  // Pagination range helper
  const getPageRange = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }
    if (range[0] > 1) { range.unshift('...'); range.unshift(1); }
    if (range[range.length - 1] < totalPages) { range.push('...'); range.push(totalPages); }
    return range;
  };

  return (
    <div className="min-h-screen" style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: 'linear-gradient(135deg, #f0f0ff 0%, #f5f0ff 30%, #fdf4ff 60%, #f0f6ff 100%)',
    }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Link to="/" className="text-slate-400 hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gợi ý kết bạn</h1>
          </div>
          <p className="text-slate-500 ml-8">Khám phá và kết nối với những người có cùng sở thích</p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc username..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-white rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm"
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
              className="w-full pl-9 pr-8 py-2.5 bg-white/80 border border-white rounded-2xl focus:ring-2 focus:ring-violet-400 outline-none transition-all text-sm font-semibold text-slate-700 appearance-none cursor-pointer"
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

        {/* Stats row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {filterCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                {filterCategory}
                <button onClick={() => setFilterCategory('')} className="hover:bg-violet-200 rounded-full w-3.5 h-3.5 flex items-center justify-center transition-colors">×</button>
              </span>
            )}
            {!loading && (
              <span className="text-sm text-slate-500 font-medium">
                {filtered.length} người dùng
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-slate-400 font-medium">
              Trang {currentPage}/{totalPages}
            </span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="rounded-3xl p-6 animate-pulse" style={glass.card}>
                <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto mb-4" />
                <div className="h-4 bg-slate-200 rounded-full w-3/4 mx-auto mb-2" />
                <div className="h-3 bg-slate-100 rounded-full w-1/2 mx-auto mb-4" />
                <div className="h-9 bg-slate-100 rounded-2xl w-full" />
              </div>
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {paginated.map((u, i) => {
              const grad = GRAD_PAIRS[(i + (currentPage - 1) * PAGE_SIZE) % GRAD_PAIRS.length];
              const isSent = sentIds.has(u.userId);
              return (
                <div
                  key={u.userId}
                  className="rounded-3xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:translate-y-[-4px] group"
                  style={glass.card}
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
        ) : (
          <div className="bg-white/30 border border-white/50 rounded-3xl p-16 text-center">
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

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-10">
            {/* Prev */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.8)', color: '#6366f1' }}
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
                  onClick={() => setCurrentPage(page)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all hover:scale-105 active:scale-95"
                  style={currentPage === page
                    ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }
                    : { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.8)', color: '#475569' }
                  }
                >
                  {page}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.8)', color: '#6366f1' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeopleSuggestions;
