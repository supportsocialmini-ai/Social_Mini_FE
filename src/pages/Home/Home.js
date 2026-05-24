import React, { useState, useEffect, useRef } from 'react';
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

const TRENDING = (t) => [
  { category: t('home.trendingItems.tech'), tag: '#ReactJS', count: `12.5K ${t('home.trendingItems.posts')}`, color: '#6366f1' },
  { category: t('home.trendingItems.design'), tag: '#Minimalism', count: `8.2K ${t('home.trendingItems.posts')}`, color: '#8b5cf6' },
  { category: t('home.trendingItems.vietnam'), tag: '#CherryBlossom', count: `43.1K ${t('home.trendingItems.posts')}`, color: '#ec4899' },
];

const NAV_ITEMS = (t) => [
  { to: '/', label: t('home.nav.home'), grad: 'from-indigo-500 to-blue-500', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
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
  const [posts, setPosts] = useState([]);
  const [sentIds, setSentIds] = useState(new Set());
  const [suggestedGroups, setSuggestedGroups] = useState([]);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const SUGGESTED_INTERESTS = ["Công nghệ", "Đánh cầu", "Du lịch", "Ẩm thực", "Âm nhạc", "Phim ảnh", "Kinh doanh", "Thể thao", "Nghệ thuật"];

  const fetchSuggestions = async () => {
    try {
      const response = await userService.getUsers();
      let data = response?.$values || response || [];
      if (!Array.isArray(data)) data = [data];
      
      const potentialSuggestions = data.filter(u => u && u.userId !== user?.userId).slice(0, 15);
      
      const suggestionsWithStatus = await Promise.all(
        potentialSuggestions.map(async (u) => {
          try {
            const statusRes = await friendService.getFriendshipStatus(u.userId);
            return { ...u, friendshipStatus: statusRes?.status || 'None' };
          } catch {
            return { ...u, friendshipStatus: 'None' };
          }
        })
      );

      const finalFiltered = suggestionsWithStatus
        .filter(u => u.friendshipStatus !== 'Accepted')
        .slice(0, 5);

      const initiallySent = new Set(
        finalFiltered
          .filter(u => u.friendshipStatus === 'Sent')
          .map(u => u.userId)
      );

      setSentIds(initiallySent);
      setSuggestions(finalFiltered);
    } catch (err) { 
      console.error('Lỗi lấy suggestions:', err); 
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchSuggestions();
      fetchSuggestedGroups();
      
      // Check if user has no interests and show modal
      if (!user.interests) {
        setShowInterestsModal(true);
      }
    }
  }, [user]);

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const handleSaveInterests = async () => {
    if (selectedInterests.length === 0) {
      toast.info("Vui lòng chọn ít nhất một sở thích để chúng mình gợi ý tốt hơn nhé!");
      return;
    }
    
    setLoading(true);
    try {
      const interestsString = selectedInterests.join(', ');
      const response = await userService.updateUser({
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        interests: interestsString
      });
      
      updateUserData(response || { ...user, interests: interestsString });
      setShowInterestsModal(false);
      toast.success("Tuyệt vời! Đang chuẩn bị không gian riêng cho bạn...");
      fetchSuggestedGroups();
    } catch (error) {
      toast.error("Có lỗi khi lưu sở thích, hãy thử lại sau nhé!");
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
      } else {
        setPosts(prev => [...prev, ...normalized]);
      }
      // Determine if more data exists based on returned count
      if (normalized.length < 10) {
        setHasMore(false);
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
                <Link to="/friends" className="text-xs font-bold transition-colors" style={{ color: '#6366f1' }}>{t('common.viewAll')}</Link>
              </div>
              <div className="space-y-3">
                {suggestions.map((u, i) => (
                  <div key={u.userId} className="flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Link to={`/profile/${u.userId}`} className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ring-2 ring-white/60"
                      style={{ background: `linear-gradient(135deg, ${['#6366f1,#8b5cf6', '#ec4899,#f43f5e', '#10b981,#06b6d4', '#f59e0b,#f97316', '#a855f7,#6366f1'][i % 5]})` }}>
                      <img src={getFullAvatarUrl(u.avatarUrl, u.fullName || u.username)} alt="" className="w-full h-full object-cover" />
                    </Link>
                    <Link to={`/profile/${u.userId}`} className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate hover:text-indigo-600 transition-colors">{u.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                    </Link>
                    <button
                      onClick={() => handleFollow(u.userId, u.fullName)}
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
                ))}
              </div>
            </div>

            {/* Trending */}
            <div className="rounded-2xl p-5 transition-all duration-300" style={glass.card}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="font-bold text-slate-800 text-sm">{t('home.trending')}</p>
              </div>
              <div className="space-y-3.5">
                {TRENDING(t).map((item, i) => (
                  <div key={item.tag} className="cursor-pointer group p-2.5 rounded-xl transition-all duration-200"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = `${item.color}0d`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <p className="text-[10px] text-slate-400 font-medium">{item.category}</p>
                    <p className="text-sm font-bold mt-0.5 transition-colors group-hover:text-indigo-600" style={{ color: '#1e293b' }}>{item.tag}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-1">
              <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                {[
                  { key: 'home.about', label: t('home.about') },
                  { key: 'home.help', label: t('home.help') },
                  { key: 'home.privacy', label: t('home.privacy') },
                  { key: 'home.terms', label: t('home.terms') }
                ].map(item => (
                  <button key={item.key} className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:underline transition-colors">{item.label}</button>
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
            <div className="p-8 md:p-12">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8 mx-auto rotate-3">
                <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                </svg>
              </div>
              
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Chào mừng bạn! 👋</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Để trải nghiệm của bạn tuyệt vời hơn, hãy chọn những lĩnh vực bạn quan tâm nhé. Chúng mình sẽ gợi ý những cộng đồng phù hợp nhất!
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {SUGGESTED_INTERESTS.map(interest => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' 
                          : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSaveInterests}
                disabled={loading || selectedInterests.length === 0}
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
    </div>
  );
};

export default Home;