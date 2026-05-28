import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import PostCard from '../../components/Post/PostCard';
import PostCreator from '../../components/Post/PostCreator';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import postService from '../../services/postService';
import friendService from '../../services/friendService';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import axiosClient from '../../api/axiosClient';

const NAV_ITEMS = (t) => [
  { to: '/friends', label: t('home.nav.friends'), grad: 'from-violet-500 to-purple-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to: '/messaging', label: t('home.nav.messages'), grad: 'from-purple-500 to-pink-500', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { to: '/groups', label: 'Cộng đồng', grad: 'from-orange-500 to-red-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to: '/settings', label: t('home.nav.settings'), grad: 'from-slate-500 to-slate-400', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

/* ── Glassmorphism style helper ─── */
const glass = {
  card: {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: '0 8px 32px rgba(99,102,241,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  },
  hoverCard: {
    background: 'rgba(255,255,255,0.8)',
  },
};

const Home = () => {
  const { user, getFullAvatarUrl, updateUserData } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [posts, setPosts] = useState([]);
  const [sentIds, setSentIds] = useState(new Set());
  const [suggestedGroups, setSuggestedGroups] = useState([]);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [interestsList, setInterestsList] = useState([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeFooterModal, setActiveFooterModal] = useState(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const categoryBtnRef = useRef(null);

  const PRESET_CATEGORIES = ["Công nghệ", "Kinh doanh", "Giải trí", "Giáo dục", "Khoa học", "Sức khỏe", "Thể thao", "Nghệ thuật", "Xã hội", "Đời sống", "Văn hóa", "Thiên nhiên", "Chính trị", "Tôn giáo", "Công nghiệp", "Truyền thông", "Mua sắm", "Du lịch", "Ẩm thực", "Thời trang", "Gia đình", "Quan hệ", "Nghề nghiệp", "Tài chính", "Nhà cửa", "Xe cộ", "Cộng đồng", "Sở thích", "Hoạt động ngoài trời", "Phát triển bản thân"];

  const fetchSuggestions = async () => {
    try {
      const response = await friendService.getFriends();
      let data = response?.$values || response || [];
      if (!Array.isArray(data)) data = [data];
      setSuggestions(data.filter(u => u && u.userId !== user?.userId).slice(0, 8));
    } catch (err) {
      console.error('Lỗi lấy bạn bè:', err);
    }
  };

  const fetchFriendSuggestions = async () => {
    try {
      // 1. Lấy danh sách bạn bè hiện tại để loại trừ
      const friendsRes = await friendService.getFriends();
      let friendsData = friendsRes?.$values || friendsRes || [];
      if (!Array.isArray(friendsData)) friendsData = [friendsData];
      const friendIds = new Set(friendsData.map(f => f.userId));

      // 2. Lấy danh sách lời mời đang chờ (pending) để loại trừ
      const pendingRes = await friendService.getPendingRequests();
      let pendingData = pendingRes?.$values || pendingRes || [];
      if (!Array.isArray(pendingData)) pendingData = [pendingData];
      const pendingIds = new Set(pendingData.map(p => p.userId || p.senderId || p.receiverId));

      // 3. Lấy toàn bộ người dùng trong hệ thống
      const allUsersRes = await userService.getUsers();
      let allUsersData = allUsersRes?.$values || allUsersRes || [];
      if (!Array.isArray(allUsersData)) allUsersData = [allUsersData];

      // 4. Lọc ứng viên:
      // - Cùng lĩnh vực quan tâm với user hiện tại
      // - Không phải bản thân
      // - Chưa là bạn bè
      // - Chưa gửi lời mời kết bạn
      const myCategory = (user?.category || '').trim().toLowerCase();
      let candidates = allUsersData.filter(u => {
        if (!u || u.userId === user?.userId) return false;
        if (friendIds.has(u.userId) || pendingIds.has(u.userId)) return false;
        
        const uCategory = (u.category || u.Category || '').trim().toLowerCase();
        return myCategory && uCategory === myCategory;
      });

      setFriendSuggestions(candidates.slice(0, 5));
    } catch (err) {
      console.error('Lỗi lấy gợi ý kết bạn cùng lĩnh vực:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchSuggestions();
      fetchFriendSuggestions();
      fetchSuggestedGroups();
      
      // Check if user has no category and show modal
      if (!user.category) {
        setShowInterestsModal(true);
      }
    }
  }, [user]);

  const handleAddWelcomeInterest = () => {
    const trimmed = customInterestInput.trim();
    if (!trimmed) return;
    if (!interestsList.includes(trimmed)) {
      setInterestsList(prev => [...prev, trimmed]);
    }
    setCustomInterestInput('');
  };

  const handleSaveInterests = async () => {
    if (!selectedCategory) {
      toast.warn("Vui lòng chọn một lĩnh vực quan tâm chính!");
      return;
    }
    if (selectedCategory === 'Other' && !customCategoryName.trim()) {
      toast.warn("Vui lòng nhập lĩnh vực quan tâm chính của bạn!");
      return;
    }
    
    setLoading(true);
    try {
      const finalCategory = selectedCategory === 'Other' ? customCategoryName.trim() : selectedCategory;
      const interestsString = interestsList.join(', ');
      const response = await userService.updateUser({
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        category: finalCategory,
        interests: interestsString
      });
      
      updateUserData(response || { ...user, category: finalCategory, interests: interestsString });
      setShowInterestsModal(false);
      toast.success("Tuyệt vời! Đang chuẩn bị không gian riêng cho bạn...");
      fetchSuggestedGroups();
      fetchFriendSuggestions();
    } catch (error) {
      toast.error("Có lỗi khi lưu thông tin, hãy thử lại sau nhé!");
    } finally {
      setLoading(false);
    }
  };

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const loadMoreRef = useRef(null);

  const fetchPosts = async (pageNumber = 1) => {
    try {
      const response = await postService.getPosts(pageNumber, 10);
      const rawPosts = Array.isArray(response) ? response : (response?.$values || []);
      const normalized = rawPosts.filter(p => p).map(post => ({
        ...post,
        postId: post.postId || post.id,
        author: post.fullName || post.FullName || t('navbar.user'),
        authorAvatar: getFullAvatarUrl(post.avatarUrl || post.AvatarUrl, post.fullName || 'User'),
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        isLiked: post.isLiked || false,
      }));
      if (pageNumber === 1) {
        setPosts(normalized);
        setPage(1);
        setHasMore(normalized.length === 10);
      } else {
        setPosts(prev => [...prev, ...normalized]);
        if (normalized.length < 10) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Lỗi lấy bài viết:', err);
    } finally {
      setIsFeedLoading(false);
      setIsNextLoading(false);
    }
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isNextLoading) {
        setIsNextLoading(true);
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage);
      }
    }, { rootMargin: '200px' });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMoreRef.current, hasMore, isNextLoading, page]);

  const fetchSuggestedGroups = async () => {
    try {
      const { default: groupService } = await import('../../services/groupService');
      const response = await groupService.getSuggestedGroups();
      setSuggestedGroups(response?.$values || response || []);
    } catch (err) {
      console.error('Lỗi lấy nhóm gợi ý:', err);
    }
  };

  const handleFollow = async (userId, fullName) => {
    setSentIds(prev => new Set([...prev, userId]));
    try {
      await friendService.sendRequest(userId);
    } catch (error) { 
      console.error('Không thể gửi lời mời kết bạn:', error);
    }
  };

  return (
    <div className="min-h-screen relative" style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: 'linear-gradient(135deg, #f0f0ff 0%, #f5f0ff 30%, #fdf4ff 60%, #f0f6ff 100%)',
    }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', animation: 'blob1 18s ease-in-out infinite' }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)', animation: 'blob2 22s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)', animation: 'blob3 16s ease-in-out infinite' }} />
      </div>

      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.1)} 66%{transform:translate(-30px,60px) scale(0.95)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-80px,40px) scale(1.08)} 66%{transform:translate(40px,-50px) scale(1.05)} }
        @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-60px,-30px) scale(1.12)} }
        @keyframes fadeUp { from{opacity:0} to{opacity:1} }
        @keyframes storyPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        .post-enter { animation: fadeUp 0.45s ease both; }
        .story-ring:hover { animation: storyPulse 0.6s ease; }
        .glass-hover:hover { background: rgba(255,255,255,0.82) !important; box-shadow: 0 12px 40px rgba(99,102,241,0.1), 0 2px 8px rgba(0,0,0,0.06) !important; transform: translateY(-1px); }
        .nav-item:hover .nav-icon { transform: scale(1.1); }
        .post-creator { transition: box-shadow 0.25s ease; }
        .post-creator:focus-within { box-shadow: 0 0 0 2px rgba(99,102,241,0.28), 0 8px 32px rgba(99,102,241,0.1) !important; }
        .post-creator textarea { transition: height 0.2s ease; min-height: 52px; max-height: 200px; }
        .like-pop { animation: likePop 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
        @keyframes likePop { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
      `}</style>

      <Navbar />

      <div className="relative z-10 max-w-full mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6 pt-6 px-4 sm:px-8 pb-24">

        <aside className="hidden lg:block">
          <div className="sticky top-[76px] space-y-2">
            <Link to="/profile" className="glass-hover flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group"
              style={glass.card}>
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-indigo-300/60 flex-shrink-0">
                <img src={getFullAvatarUrl(user?.avatarUrl, user?.fullName || user?.username)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {user?.fullName || t('navbar.user')}
                </p>
                <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
              </div>
            </Link>

            <div className="h-px mx-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent)' }} />

            {NAV_ITEMS(t).map(item => (
              <Link key={item.to + item.label} to={item.to}
                className="glass-hover nav-item flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 group"
                style={glass.card}
              >
                <div className={`nav-icon w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${item.grad} transition-transform duration-300`}>
                  <svg className="h-[18px] w-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <span className="font-semibold text-sm text-slate-700 group-hover:text-slate-900">{item.label}</span>
              </Link>
            ))}

            <div className="h-px mx-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent)' }} />
            
            <p className="text-[10px] font-black text-slate-400/80 uppercase tracking-widest px-3 pt-1">Cộng đồng gợi ý</p>
            {suggestedGroups.slice(0, 5).map(g => (
              <Link key={g.groupId} to={`/groups/${g.groupId}`}
                className="glass-hover flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-300 group"
                style={glass.card}
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-100 flex-shrink-0 border border-indigo-50">
                  <img src={getFullAvatarUrl(g.avatarUrl, g.name)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{g.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{g.category || 'Cộng đồng'}</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>

        <main className="min-w-0 space-y-4 max-w-[800px] mx-auto w-full">
          <div className="rounded-2xl p-4 transition-all duration-300" style={glass.card}>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer story-ring">
                <div className="relative w-[60px] h-[60px]">
                  <div className="w-full h-full rounded-full p-[2.5px]"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)' }}>
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                      <img src={getFullAvatarUrl(user?.avatarUrl, user?.fullName || user?.username)} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <span className="text-white text-[11px] font-bold leading-none">+</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">{t('home.myStory')}</span>
              </div>

              {suggestions.map((u, i) => (
                <div key={u.userId} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer story-ring group">
                  <div className="w-[60px] h-[60px] rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${['#f43f5e,#fb923c', '#8b5cf6,#6366f1', '#06b6d4,#3b82f6', '#10b981,#059669', '#f59e0b,#ef4444'][i % 5]})` }}>
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-200">
                      <img src={getFullAvatarUrl(u.avatarUrl, u.fullName || u.username)} alt={u.fullName} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight truncate max-w-[60px]">
                    {u.username || u.fullName?.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <PostCreator
            user={user}
            getFullAvatarUrl={getFullAvatarUrl}
            onPostSuccess={() => fetchPosts(1)}
          />

          {isFeedLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl p-6 animate-pulse" style={glass.card}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full" style={{ background: 'rgba(99,102,241,0.1)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded-full w-32" style={{ background: 'rgba(99,102,241,0.1)' }} />
                      <div className="h-3 rounded-full w-20" style={{ background: 'rgba(99,102,241,0.06)' }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 rounded-full w-full" style={{ background: 'rgba(99,102,241,0.06)' }} />
                    <div className="h-4 rounded-full w-4/5" style={{ background: 'rgba(99,102,241,0.06)' }} />
                    <div className="h-4 rounded-full w-3/5" style={{ background: 'rgba(99,102,241,0.04)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
<>
            <div className="space-y-4">
              {posts.map((post, idx) => (
                <div key={post.postId || post.id} className="post-enter" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <PostCard
                    post={post}
                    user={user}
                    getFullAvatarUrl={getFullAvatarUrl}
                    onLikeChange={fetchPosts}
                    onPostDelete={fetchPosts}
                  />
                </div>
              ))}
            </div>
            {isNextLoading && (
              <div className="flex justify-center items-center py-4 text-slate-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
                  <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="4" />
                </svg>
                Đang tải thêm bài viết...
              </div>
            )}
            <div ref={loadMoreRef} />
          </>
          ) : (
            <div className="rounded-2xl p-16 text-center" style={glass.card}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))' }}>
                <svg className="h-8 w-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 font-semibold text-sm">{t('home.noPostsTitle')}</p>
              <p className="text-slate-400 text-xs mt-1">{t('home.noPostsDesc')}</p>
            </div>
          )}
        </main>

        {/* ── RIGHT SIDEBAR ────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-[76px] space-y-4">

            {/* Suggestions */}
            <div className="rounded-2xl p-5 transition-all duration-300" style={glass.card}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-slate-800 text-sm">{t('home.suggestedForYou')}</p>
                <Link to="/people/suggestions" className="text-xs font-bold transition-colors" style={{ color: '#6366f1' }}>{t('common.viewAll')}</Link>
              </div>
              <div className="space-y-3">
                {friendSuggestions.map((u, i) => {
                  const name = u.fullName || u.FullName || u.username || u.Username;
                  const username = u.username || u.Username;
                  const avatar = u.avatarUrl || u.AvatarUrl;
                  const cat = (u.category || u.Category || '').trim();

                  return (
                    <div key={u.userId} className="flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                      style={{ background: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Link to={`/profile/${u.userId}`} className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ring-2 ring-white/60"
                        style={{ background: `linear-gradient(135deg, ${['#6366f1,#8b5cf6', '#ec4899,#f43f5e', '#10b981,#06b6d4', '#f59e0b,#f97316', '#a855f7,#6366f1'][i % 5]})` }}>
                        <img src={getFullAvatarUrl(avatar, name)} alt="" className="w-full h-full object-cover" />
                      </Link>
                      <Link to={`/profile/${u.userId}`} className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate hover:text-indigo-600 transition-colors">{name}</p>
                        {cat ? (
                          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider truncate">{cat}</p>
                        ) : (
                          <p className="text-xs text-slate-400 truncate">@{username}</p>
                        )}
                      </Link>
                      <button
                        onClick={() => handleFollow(u.userId, name)}
                        disabled={sentIds.has(u.userId)}
                        className="text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                        style={sentIds.has(u.userId)
                          ? { background: 'rgba(99,102,241,0.06)', color: '#94a3b8', cursor: 'default' }
                          : { background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
                        onMouseEnter={e => !sentIds.has(u.userId) && (e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)', e.currentTarget.style.color = '#fff')}
                        onMouseLeave={e => !sentIds.has(u.userId) && (e.currentTarget.style.background = 'rgba(99,102,241,0.1)', e.currentTarget.style.color = '#6366f1')}
                      >
                        {sentIds.has(u.userId) ? t('posts.sent') : t('posts.addFriend')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hot Features Card */}
            <div className="rounded-2xl p-5 transition-all duration-300" style={glass.card}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)' }}>
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="font-bold text-slate-800 text-sm">Tính năng đang HOT</p>
              </div>
              
              <div 
                onClick={() => navigate('/chat-random')}
                className="cursor-pointer group p-3.5 rounded-2xl transition-all duration-300 border border-transparent hover:border-pink-200/50 hover:shadow-lg hover:shadow-pink-500/5 relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.03), rgba(236, 72, 153, 0.03))',
                  border: '1px solid rgba(244, 63, 94, 0.08)' 
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(244, 63, 94, 0.06), rgba(236, 72, 153, 0.06))';
                  e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(244, 63, 94, 0.03), rgba(236, 72, 153, 0.03))';
                  e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.08)';
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-slate-800 transition-colors group-hover:text-rose-500">Chat Random Ẩn Danh</p>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-100 uppercase tracking-wider animate-pulse">
                    Hot
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Tìm kiếm và ghép cặp ngẫu nhiên với người dùng khác. Trò chuyện hoàn toàn ẩn danh, bảo mật và kết nối nhanh chóng!
                </p>
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-500 group-hover:translate-x-1 transition-transform">
                  <span>Trải nghiệm ngay</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-1">
              <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                {[
                  { key: 'about', label: t('home.about') },
                  { key: 'help', label: t('home.help') },
                  { key: 'privacy', label: t('home.privacy') },
                  { key: 'terms', label: t('home.terms') }
                ].map(item => (
                  <button 
                    key={item.key} 
                    onClick={() => setActiveFooterModal(item.key)}
                    className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:underline transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-slate-400 tracking-wider">© 2026 MINISOCIAL · v2.0.0</p>
            </div>
          </div>
        </aside>
      </div>
      {/* Interests Selection Modal (for new users) */}
      {showInterestsModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 md:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 mx-auto rotate-3">
                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                </svg>
              </div>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Chào mừng bạn! 👋</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Để gợi ý những cộng đồng phù hợp nhất, hãy chọn lĩnh vực quan tâm chính và các sở thích của bạn nhé!
                </p>
              </div>

              {/* Lĩnh vực quan tâm */}
              <div className="mb-6 space-y-1.5 relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Lĩnh vực quan tâm chính <span className="text-red-500">*</span></label>
                <div className="relative">
                  <button
                    ref={categoryBtnRef}
                    type="button"
                    onClick={() => {
                      if (!isCategoryDropdownOpen && categoryBtnRef.current) {
                        const rect = categoryBtnRef.current.getBoundingClientRect();
                        setDropdownPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
                      }
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all flex items-center justify-between text-slate-700 text-left cursor-pointer"
                  >
                    <span>
                      {selectedCategory === 'Other' 
                        ? (customCategoryName.trim() ? customCategoryName : "Lĩnh vực khác...") 
                        : (selectedCategory || "Chọn lĩnh vực quan tâm...")}
                    </span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isCategoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[10000]" onClick={() => setIsCategoryDropdownOpen(false)} />
                      <div className="fixed z-[10001] bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-2 custom-scrollbar" style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('');
                            setShowCustomCategory(false);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                          Chọn lĩnh vực quan tâm...
                        </button>
                        {PRESET_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setShowCustomCategory(false);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                              selectedCategory === cat ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{cat}</span>
                            {selectedCategory === cat && (
                              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('Other');
                            setShowCustomCategory(true);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                            selectedCategory === 'Other' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>Lĩnh vực khác...</span>
                          {selectedCategory === 'Other' && (
                            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {showCustomCategory && (
                <div className="mb-6 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Nhập lĩnh vực quan tâm khác <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nhập lĩnh vực khác..."
                    value={customCategoryName}
                    onChange={e => setCustomCategoryName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              )}

              {/* Nhập sở thích khác */}
              <div className="mb-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Sở thích khác của bạn</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInterestInput}
                      onChange={(e) => setCustomInterestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddWelcomeInterest();
                        }
                      }}
                      placeholder="Nhập sở thích khác..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddWelcomeInterest}
                      className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                {/* Danh sách sở thích đã chọn */}
                {interestsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl items-center">
                    {interestsList.map((interest, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg">
                        {interest}
                        <button
                          type="button"
                          onClick={() => setInterestsList(prev => prev.filter(item => item !== interest))}
                          className="ml-1 w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-indigo-200 text-indigo-700 font-bold text-[10px]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveInterests}
                disabled={loading || !selectedCategory}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang chuẩn bị...</span>
                  </div>
                ) : "Bắt đầu khám phá ngay"}
              </button>
              
              <p className="text-center mt-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Bạn có thể thay đổi trong phần cài đặt sau</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Static Modals */}
      {activeFooterModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveFooterModal(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  {activeFooterModal === 'about' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {activeFooterModal === 'help' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {activeFooterModal === 'privacy' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  )}
                  {activeFooterModal === 'terms' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  )}
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  {activeFooterModal === 'about' && "Giới thiệu về MiniSocial"}
                  {activeFooterModal === 'help' && "Trung tâm Trợ giúp (FAQ)"}
                  {activeFooterModal === 'privacy' && "Chính sách Quyền riêng tư"}
                  {activeFooterModal === 'terms' && "Điều khoản Dịch vụ"}
                </h3>
              </div>
              <button 
                onClick={() => setActiveFooterModal(null)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto px-6 py-5 flex-1 text-slate-600 text-sm leading-relaxed space-y-4">
              {activeFooterModal === 'about' && (
                <>
                  <p><strong>MiniSocial</strong> là nền tảng mạng xã hội thu nhỏ hiện đại, thân thiện, được phát triển nhằm mục đích kết nối cộng đồng, chia sẻ khoảnh khắc cá nhân và tương tác thời gian thực.</p>
                  <p>Nền tảng của chúng tôi tập trung tối đa vào tốc độ truyền tải, thiết kế hiện đại (Glassmorphism) và sự đơn giản, giúp bạn trải nghiệm không gian mạng xã hội sạch sẽ và văn minh nhất.</p>
                  <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 space-y-2.5">
                    <p className="font-bold text-indigo-950 text-xs uppercase tracking-wider">Tính năng nổi bật</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 font-medium">
                      <li>Bảng tin (News Feed) cập nhật bài đăng tức thì.</li>
                      <li>Nhắn tin và gọi điện WebRTC thời gian thực.</li>
                      <li>Chat Random ẩn danh - ghép đôi ngẫu nhiên đầy thú vị.</li>
                      <li>Hệ thống nhóm cộng đồng đa dạng chủ đề thảo luận.</li>
                    </ul>
                  </div>
                  <p>Chúng tôi luôn nỗ lực không ngừng cải tiến và cập nhật các tính năng mới để xây dựng một cộng đồng MiniSocial bền vững, kết nối mọi người xích lại gần nhau hơn.</p>
                </>
              )}

              {activeFooterModal === 'help' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-800">1. Làm thế nào để đăng ký Premium?</p>
                    <p className="text-slate-600 text-xs">Bạn có thể chọn gói mong muốn ở danh sách bên cột phải (ở giao diện Trang chủ) hoặc vào <strong>Cài đặt &gt; Nâng cấp Premium</strong>. Thanh toán an toàn, nhanh chóng qua cổng VNPay.</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-800">2. Chat Random ẩn danh là gì?</p>
                    <p className="text-slate-600 text-xs">Đây là tính năng độc đáo cho phép bạn ghép đôi trò chuyện ngẫu nhiên với một thành viên online khác trên hệ thống. Mọi thông tin cá nhân của cả hai bên đều được giữ kín hoàn toàn để đảm bảo sự ẩn danh và thú vị.</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-800">3. Làm sao để báo cáo vi phạm?</p>
                    <p className="text-slate-600 text-xs">Nếu phát hiện bài viết hoặc hành vi không lành mạnh, hãy bấm vào nút 3 chấm góc phải bài đăng đó, chọn <strong>Báo cáo xấu</strong>, ghi rõ lý do và nhấn gửi. Ban quản trị sẽ tiếp nhận và xử lý trong vòng 24h.</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-800">4. Liên hệ hỗ trợ trực tiếp</p>
                    <p className="text-slate-600 text-xs">Mọi thắc mắc kỹ thuật vui lòng gửi về email: <span className="text-indigo-600 font-bold">support.socialmini@gmail.com</span> hoặc liên hệ Hotline: <span className="font-bold">1900 6060</span> (8:00 - 22:00 hàng ngày).</p>
                  </div>
                </div>
              )}

              {activeFooterModal === 'privacy' && (
                <>
                  <p>MiniSocial cam kết bảo vệ thông tin cá nhân và tôn trọng quyền riêng tư của bạn. Dưới đây là tóm tắt chính sách bảo mật dữ liệu:</p>
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">1. Thu thập dữ liệu</p>
                      <p className="text-slate-600 text-xs mt-1">Chúng tôi chỉ thu thập thông tin cơ bản phục vụ tài khoản như: Họ và tên, Email, Ảnh đại diện và thông tin sở thích để gợi ý nội dung phù hợp.</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">2. Bảo mật thông tin</p>
                      <p className="text-slate-600 text-xs mt-1">Mật khẩu tài khoản của bạn được mã hóa một chiều bằng thuật toán BCrypt cực kỳ bảo mật trước khi lưu vào cơ sở dữ liệu. Dữ liệu chat được truyền tải an toàn qua giao thức SignalR.</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">3. Chia sẻ dữ liệu</p>
                      <p className="text-slate-600 text-xs mt-1">Chúng tôi cam kết tuyệt đối KHÔNG bán, cho thuê hay chia sẻ thông tin cá nhân của bạn với bất kỳ bên thứ ba nào vì mục đích quảng cáo hay thương mại.</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">4. Quyền tự quyết tài khoản</p>
                      <p className="text-slate-600 text-xs mt-1">Bạn có toàn quyền chỉnh sửa thông tin cá nhân hoặc xóa tài khoản vĩnh viễn trong phần <strong>Cài đặt &gt; Quản lý tài khoản</strong> bất cứ khi nào bạn muốn.</p>
                    </div>
                  </div>
                </>
              )}

              {activeFooterModal === 'terms' && (
                <>
                  <p>Chào mừng bạn đến với MiniSocial. Khi tham gia cộng đồng của chúng tôi, bạn đồng ý tuân thủ các điều khoản dịch vụ sau đây:</p>
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">1. Đăng ký & Bảo mật tài khoản</p>
                      <p className="text-slate-600 text-xs mt-1">Bạn cần cung cấp email hợp lệ và tự chịu trách nhiệm đối với mọi hoạt động phát sinh từ tài khoản và mật khẩu của mình.</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">2. Quy định đăng tải nội dung</p>
                      <p className="text-slate-600 text-xs mt-1">Nghiêm cấm đăng tải hình ảnh bạo lực, đồi trụy, thông tin sai sự thật, hoặc các nội dung quấy rối, công kích cá nhân hay tổ chức khác.</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">3. Quyền sở hữu trí tuệ</p>
                      <p className="text-slate-600 text-xs mt-1">Bạn sở hữu bản quyền bài viết của mình đăng lên. Tuy nhiên, bằng việc đăng tải, bạn cho phép MiniSocial quyền hiển thị công khai nội dung đó trên hệ thống.</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">4. Chấm dứt dịch vụ</p>
                      <p className="text-slate-600 text-xs mt-1">Chúng tôi có quyền khóa hoặc hủy bỏ tài khoản vi phạm nghiêm trọng quy chuẩn ứng xử mà không cần thông báo trước.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex justify-end">
              <button 
                onClick={() => setActiveFooterModal(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors shadow-lg shadow-slate-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;