import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import PostCard from '../../components/Post/PostCard';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import postService from '../../services/postService';
import friendService from '../../services/friendService';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

/* ── Trending Topics (static) ───────────────────────────── */
const TRENDING = [
  { category: 'Trending in Technology', tag: '#ReactJS', count: '12.5K Posts' },
  { category: 'Trending in Design',    tag: '#Minimalism', count: '8.2K Posts' },
  { category: 'Trending in Vietnam',   tag: '#CherryBlossom', count: '43.1K Posts' },
];

const Home = () => {
  const { user, getFullAvatarUrl } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [posts, setPosts]             = useState([]);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting]     = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile]       = useState(null);
  const [sentIds, setSentIds]           = useState(new Set());

  /* ── fetch posts ───────────────────────────────────────── */
  const fetchPosts = async () => {
    try {
      const response  = await postService.getPosts();
      // axiosClient đã bóc result nên response là mảng posts
      const rawPosts  = Array.isArray(response) ? response : (response?.$values || []);
      const normalized = rawPosts.filter(p => p).map(post => ({
        ...post,
        postId:       post.postId || post.id,
        author:       post.fullName || post.FullName || t('navbar.user'),
        authorAvatar: getFullAvatarUrl(post.avatarUrl || post.AvatarUrl, post.fullName || 'User'),
        time:         post.createdAt ? new Date(post.createdAt).toLocaleDateString(t('language') === 'vi' ? 'vi-VN' : 'en-US') : t('posts.time.now'),
        likeCount:    post.likeCount    || 0,
        commentCount: post.commentCount || 0,
        isLiked:      post.isLiked      || false,
      }));
      setPosts(normalized);
    } catch (err) { console.error('Lỗi lấy bài viết:', err); }
  };

  /* ── fetch suggestions ─────────────────────────────────── */
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await userService.getUsers();
        // axiosClient đã bóc result
        let data = response?.$values || response || [];
        if (!Array.isArray(data)) data = [data];
        setSuggestions(data.filter(u => u && u.userId !== user?.userId).slice(0, 5));
      } catch (err) { console.error('Lỗi lấy suggestions:', err); }
    };
    if (user) { fetchSuggestions(); fetchPosts(); }
  }, [user]);

  /* ── post submit ───────────────────────────────────────── */
  const handlePostSubmit = async () => {
    if (!postContent.trim()) return;
    setIsPosting(true);
    try {
      if (imageFile) {
        await postService.createPostWithImage(postContent, 'Public', imageFile);
      } else {
        await postService.createPost({ Content: postContent, privacy: 'Public' });
      }
      setPostContent(''); setImagePreview(null); setImageFile(null);
      fetchPosts();
      toast.success(t('home.postSuccess'));
    } catch (error) { 
      toast.error(error.errorMessage || t('home.postError')); 
    } finally { setIsPosting(false); }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result);
    reader.readAsDataURL(file);
  };

  const handleFollow = async (userId, fullName) => {
    try {
      await friendService.sendRequest(userId);
      setSentIds(prev => new Set([...prev, userId]));
      toast.success(t('posts.friendRequestSent', { name: fullName }));
    } catch { toast.error(t('posts.addFriendError')); }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />

      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-4 pt-4 px-2 sm:px-4 pb-16">

        {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            {/* My Profile shortcut */}
            <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/70 transition-all group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 overflow-hidden flex-shrink-0">
                <img src={getFullAvatarUrl(user?.avatarUrl, user?.fullName || user?.username)} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="font-semibold text-sm text-gray-800 group-hover:text-indigo-600 transition-colors">
                {user?.fullName || t('navbar.profile')}
              </span>
            </Link>

            {[
              { to: '/friends', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: t('friends.title'), color: 'text-indigo-500' },
              { to: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: t('home.home'), color: 'text-orange-500' },
              { to: '/messaging', icon: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z', label: t('messaging.title'), color: 'text-purple-500' },
            ].map(item => (
              <Link key={item.to + item.label} to={item.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/70 transition-all group">
                <div className={`w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <span className="font-semibold text-sm text-gray-800 group-hover:text-gray-900">{item.label}</span>
              </Link>
            ))}

            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/70 transition-all w-full text-left">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-gray-800">{t('home.seeMore')}</span>
            </button>

            <div className="pt-4 pb-2 px-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('home.yourShortcuts')}</p>
            </div>
            {suggestions.slice(0, 2).map(u => (
              <Link key={u.userId} to={`/profile/${u.userId}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/70 transition-all group">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-400 to-pink-500">
                  <img src={getFullAvatarUrl(u.avatarUrl, u.fullName || u.username)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{u.fullName}</p>
                  <p className="text-[10px] text-gray-400">{t('home.community')}</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>

        {/* ── CENTER FEED ──────────────────────────────────── */}
        <main className="min-w-0 space-y-3">

          {/* Stories */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {/* My story */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-400">
                  <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-indigo-400 to-blue-500">
                    <img src={getFullAvatarUrl(user?.avatarUrl, user?.fullName || user?.username)} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">{t('home.yourStory')}</span>
              </div>

              {/* Other stories */}
              {suggestions.map((u, i) => (
                <div key={u.userId} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
                  <div className={`w-14 h-14 rounded-full p-0.5 ${i % 3 === 0 ? 'bg-gradient-to-br from-pink-500 via-red-400 to-yellow-400' : i % 3 === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-400'}`}>
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-200">
                      <img src={getFullAvatarUrl(u.avatarUrl, u.fullName || u.username)} alt={u.fullName} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight truncate max-w-[56px]">
                    {u.username || u.fullName?.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Post Creator */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {imagePreview && (
              <div className="relative w-full h-52 bg-gray-100">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-gray-900/60 hover:bg-gray-900/80 text-white rounded-full flex items-center justify-center transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
              <Link to="/profile" className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-indigo-400 to-blue-500">
                <img src={getFullAvatarUrl(user?.avatarUrl, user?.fullName || user?.username)} alt="" className="w-full h-full object-cover" />
              </Link>
              <textarea
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handlePostSubmit())}
                placeholder={t('home.whatsOnYourMind', { name: user?.fullName?.split(' ').pop() || t('navbar.user') })}
                className="flex-1 bg-[#f0f2f5] rounded-2xl px-4 py-2.5 text-sm outline-none text-gray-700 placeholder:text-gray-500 focus:bg-gray-100 transition-all resize-none min-h-[44px]"
              />
            </div>
            <div className="flex items-center px-2 py-2">
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer transition-all text-sm font-semibold">
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('home.photo')}
              </label>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition-all text-sm font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v18a2 2 0 002 2z" />
                </svg>
                {t('home.video')}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition-all text-sm font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('home.feeling')}
              </button>
              <div className="flex-1" />
              <button
                onClick={handlePostSubmit}
                disabled={isPosting || !postContent.trim()}
                 className="bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white px-6 py-2 rounded-full text-sm font-bold transition-all"
              >
                {isPosting ? t('common.loading') : t('home.post')}
              </button>
            </div>
          </div>

          {/* Posts */}
          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard
                key={post.postId || post.id}
                post={post}
                user={user}
                getFullAvatarUrl={getFullAvatarUrl}
                onLikeChange={fetchPosts}
                onPostDelete={fetchPosts}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
              <p className="text-gray-400 font-medium">{t('profile.posts')} - {t('common.viewAll')}</p>
            </div>
          )}
        </main>

        {/* ── RIGHT SIDEBAR ────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">

            {/* Suggestions */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-gray-800 text-sm">{t('home.suggestedForYou')}</p>
                <Link to="/" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">{t('common.viewAll')}</Link>
              </div>
              <div className="space-y-3">
                {suggestions.map(u => (
                  <div key={u.userId} className="flex items-center gap-3">
                    <Link to={`/profile/${u.userId}`} className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-indigo-400 to-blue-500">
                      <img src={getFullAvatarUrl(u.avatarUrl, u.fullName || u.username)} alt="" className="w-full h-full object-cover" />
                    </Link>
                    <Link to={`/profile/${u.userId}`} className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate hover:text-indigo-600 transition-colors">{u.fullName}</p>
                      <p className="text-[11px] text-gray-400 truncate">@{u.username}</p>
                    </Link>
                    <button
                      onClick={() => handleFollow(u.userId, u.fullName)}
                      disabled={sentIds.has(u.userId)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 transition-colors flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      {sentIds.has(u.userId) ? t('profile.unfollow') : t('profile.follow')}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="font-bold text-gray-800 text-sm">{t('home.trending')}</p>
              </div>
              <div className="space-y-3">
                {TRENDING.map(t => (
                  <div key={t.tag} className="cursor-pointer group">
                    <p className="text-[10px] text-gray-400 font-medium">{t.category}</p>
                    <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{t.tag}</p>
                    <p className="text-[10px] text-gray-400">{t.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-1">
              <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                {[
                  { k: 'home.about', l: 'About' },
                  { k: 'home.help', l: 'Help' },
                  { k: 'profile.privacy', l: 'Privacy' },
                  { k: 'home.terms', l: 'Terms' }
                ].map(item => (
                  <button key={item.k} className="text-[10px] text-gray-400 hover:underline">{t(item.k)}</button>
                ))}
              </div>
              <p className="text-[10px] text-gray-300 uppercase tracking-widest">© 2026 MINISOCIAL</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;