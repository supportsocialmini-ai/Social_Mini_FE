import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import PostCard from '../../components/Post/PostCard';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import postService from '../../services/postService';
import friendService from '../../services/friendService';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { userId: routeUserId } = useParams();
  const { user: currentUser, updateUserData, getFullAvatarUrl } = useAuth();
  const { t } = useTranslation();
  const [profileUser, setProfileUser] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState('None');
  const [requestId, setRequestId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [formData, setFormData] = useState({ username: '', fullName: '', email: '', avatarUrl: '', bio: '' });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const isOwnProfile = !routeUserId || routeUserId === String(currentUser?.userId);

  const fetchProfilePosts = async () => {
    try {
      const response = isOwnProfile
        ? await postService.getMyPosts()
        : await postService.getPostsByUserId(routeUserId);
      // axiosClient đã bóc result
      let rawPosts = Array.isArray(response) ? response : (response?.$values || []);

      const normalizedPosts = rawPosts.filter(p => p).map(post => {
        const postUser = post.user || post.User || {};
        const name = postUser.fullName || postUser.FullName || post.fullName || post.FullName || postUser.username || post.username || 'Người dùng';
        return {
          ...post,
          postId: post.postId || post.id,
          userId: post.userId || post.UserId,
          author: String(name),
          authorAvatar: getFullAvatarUrl(postUser?.avatarUrl || postUser?.AvatarUrl, name),
          avatarUrl: getFullAvatarUrl(postUser?.avatarUrl || postUser?.AvatarUrl, name),
          time: post.time || post.createdAt || 'Vừa xong',
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
          isLiked: post.isLiked || false
        };
      });
      setPosts(normalizedPosts);
    } catch (error) {
      console.error("Lỗi lấy bài viết:", error);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        if (isOwnProfile) {
          setProfileUser(currentUser);
          if (currentUser) {
            setFormData({
              username: currentUser.username || '',
              fullName: currentUser.fullName || '',
              email: currentUser.email || '',
              avatarUrl: currentUser.avatarUrl || ''
            });
          }
        } else {
          // Lấy thông tin người dùng từ DB theo ID
          const foundUser = await userService.getUserById(routeUserId);
          setProfileUser(foundUser);
          
          // Lấy trạng thái bạn bè thực tế từ DB
          const statusRes = await friendService.getFriendshipStatus(routeUserId);
          setFriendshipStatus(statusRes?.status || 'None');
          setRequestId(statusRes?.requestId || null);
        }
        await fetchProfilePosts();
      } catch (error) {
        console.error("Lỗi fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [routeUserId, currentUser, isOwnProfile]);

  const handleAddFriend = async () => {
    try { await friendService.sendRequest(routeUserId); setFriendshipStatus('Sent'); toast.success(t('profile.friendRequestSent')); }
    catch (error) { toast.error(error.errorMessage || t('profile.friendRequestError') || "Error sending request"); }
  };
  const handleAcceptRequest = async () => {
    try { if (!requestId) return; await friendService.acceptRequest(requestId); setFriendshipStatus('Accepted'); toast.success(t('profile.friendAccepted')); }
    catch (error) { toast.error(error.errorMessage || "Error accepting request"); }
  };
  const handleCancelRequest = async () => {
    try { if (!requestId) return; await friendService.cancelRequest(requestId); setFriendshipStatus('None'); setRequestId(null); toast.success(t('profile.requestCancelled')); }
    catch (error) { toast.error(error.errorMessage || "Error cancelling request"); }
  };
  const handleUnfriend = async () => {
    try { await friendService.unfriend(profileUser.userId); setFriendshipStatus('None'); setRequestId(null); toast.success(t('profile.unfriendSuccess')); }
    catch (error) { toast.error(error.errorMessage || "Error unfriending"); }
  };
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    // Regex constants
    const fullNameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    const usernameRegex = /^[a-z0-9_]{4,30}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName) return toast.warn('Họ và tên không được để trống');
    if (!fullNameRegex.test(formData.fullName)) {
        return toast.warn(formData.fullName.length < 2 || formData.fullName.length > 100 
            ? 'Họ và tên phải từ 2 đến 100 ký tự'
            : 'Họ và tên chỉ được chứa chữ cái và khoảng trắng');
    }

    if (!formData.username) return toast.warn('Username không được để trống');
    if (!usernameRegex.test(formData.username)) {
        return toast.warn(formData.username.length < 4 || formData.username.length > 30
            ? 'Username phải từ 4 đến 30 ký tự'
            : 'Username chỉ gồm chữ thường, số và dấu _');
    }

    if (formData.bio && formData.bio.length > 255) {
        return toast.warn("Tiểu sử tối đa 255 ký tự.");
    }

    if (formData.email && (!emailRegex.test(formData.email) || formData.email.length > 255)) {
        return toast.warn(!emailRegex.test(formData.email) ? 'Email không đúng định dạng' : 'Email tối đa 255 ký tự');
    }

    setLoading(true);
    try {
      const response = await userService.updateUser(formData);
      updateUserData(response || formData);
      setIsEditing(false); toast.success(t('profile.updateSuccess'));
    } catch (error) { toast.error(error.errorMessage || t('profile.updateError')); }
    finally { setLoading(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const res = await userService.uploadAvatar(file);
      const newAvatarUrl = res?.avatarUrl;
      const updatedUser = res?.user;
      if (updatedUser) {
        updateUserData(updatedUser);
        setProfileUser(updatedUser);
      } else if (newAvatarUrl) {
        const updated = { ...profileUser, avatarUrl: newAvatarUrl };
        updateUserData(updated);
        setProfileUser(updated);
      }
      toast.success(t('profile.avatarSuccess'));
    } catch (error) {
      toast.error(error.errorMessage || t('profile.avatarError'));
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const renderActionButtons = () => {
    if (isOwnProfile) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-700 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t('profile.editProfile')}
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-all border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      );
    }
    const btnClass = "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all";
    switch (friendshipStatus) {
      case 'Accepted': return (
        <div className="flex gap-2">
          <button onClick={() => setIsConfirmOpen(true)} className={`${btnClass} bg-red-50 text-red-600 hover:bg-red-100`}>{t('friends.unfriend')}</button>
        </div>
      );
      case 'Sent': return <button onClick={handleCancelRequest} className={`${btnClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}>{t('profile.cancelRequest') || 'Cancel Request'}</button>;
      case 'Received': return <button onClick={handleAcceptRequest} className={`${btnClass} bg-gray-900 text-white hover:bg-gray-700`}>{t('friends.accept')}</button>;
      default: return (
        <div className="flex items-center gap-2">
          <button onClick={handleAddFriend} className={`${btnClass} bg-gray-900 text-white hover:bg-gray-700`}>
            {t('profile.follow')}
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-all border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      );
    }
  };

  // Posts có ảnh để hiển thị dạng grid
  const postsWithImage = posts.filter(p => p.imageUrl);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Cover Banner */}
      <div className="relative w-full h-56 md:h-72 bg-gradient-to-br from-slate-400 via-gray-500 to-slate-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6">

        {/* Avatar + Actions Row */}
        <div className="flex items-end justify-between -mt-16 mb-4">
          {/* Avatar */}
          <div className="relative">
            {/* Hidden file input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div
              onClick={isOwnProfile ? () => avatarInputRef.current?.click() : undefined}
              className={`w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white bg-gradient-to-br from-indigo-400 to-blue-500 overflow-hidden shadow-lg ${isOwnProfile ? 'cursor-pointer' : ''} relative group`}
            >
              <img
                src={getFullAvatarUrl(profileUser?.avatarUrl, profileUser?.fullName || profileUser?.username)}
                alt="avatar"
                className="w-full h-full object-cover"
              />
              {/* Upload overlay (own profile only) */}
              {isOwnProfile && (
                <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-all ${
                  avatarUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {avatarUploading ? (
                    <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-white text-[10px] font-bold">{t('profile.changePhoto')}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {isOwnProfile && !avatarUploading && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center border-2 border-white hover:bg-gray-700 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pb-2">
            {renderActionButtons()}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="mb-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">{t('profile.editProfile')}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder={t('profile.fullNamePlaceholder')} required minLength={2} maxLength={100}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/20" />
              <input name="username" value={formData.username} onChange={handleChange} placeholder={t('profile.usernamePlaceholder')} required minLength={4} maxLength={30}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/20" />
              <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder={t('profile.emailPlaceholder')} required
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/20" />
              <input name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} placeholder={t('profile.avatarUrlPlaceholder')}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/20" />
              <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder={t('profile.bioPlaceholder') || "Tiểu sử"} maxLength={255}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/20 md:col-span-2 resize-none" rows="3" />
              <div className="flex gap-3 md:col-span-2 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-all">
                  {loading ? t('profile.saving') : t('profile.saveChanges')}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all">
                  {t('profile.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Name, Username, Bio */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-gray-900">{profileUser?.fullName || profileUser?.username || 'User'}</h1>
            {isOwnProfile && (
              <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-black rounded-full tracking-widest uppercase">PRO</span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-3">@{profileUser?.username || 'username'}</p>
          <p className="text-gray-700 text-sm leading-relaxed max-w-lg mb-3">
            {profileUser?.email ? `📧 ${profileUser.email}` : ''}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('profile.joined')} {profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'MiniSocial'}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-8 mt-6">
              <div className="text-center">
                <p className="font-black text-slate-900 text-xl">{(posts.length)}</p>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('profile.posts')}</p>
              </div>
              <div className="text-center">
                <p className="font-black text-slate-900 text-xl">0</p>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('profile.followers')}</p>
              </div>
              <div className="text-center">
                <p className="font-black text-slate-900 text-xl">0</p>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('profile.following')}</p>
              </div>
            </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 px-6 py-4 border-t-2 transition-all ${activeTab === 'posts' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-[11px] font-black uppercase tracking-widest">{t('profile.posts')}</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-6 py-4 border-t-2 transition-all ${activeTab === 'saved' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="text-[11px] font-black uppercase tracking-widest">{t('profile.saved')}</span>
            </button>
            <button
              onClick={() => setActiveTab('tagged')}
              className={`flex items-center gap-2 px-6 py-4 border-t-2 transition-all ${activeTab === 'tagged' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-[11px] font-black uppercase tracking-widest">{t('profile.tagged')}</span>
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <>
            {/* Image Grid */}
            {postsWithImage.length > 0 && (
              <div className="grid grid-cols-3 gap-1 mb-8">
                {postsWithImage.map(post => (
                  <div key={post.postId} className="aspect-square overflow-hidden bg-gray-100 relative group cursor-pointer">
                    <img
                      src={`${process.env.REACT_APP_API_URL || 'https://social-mini-app.onrender.com'}${post.imageUrl.startsWith('/') ? post.imageUrl : '/' + post.imageUrl}`}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-4 text-white text-sm font-bold">
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                          {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {post.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Posts Feed */}
            <div className="space-y-4 pb-16">
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard
                    key={post.postId || post.id}
                    post={post}
                    user={currentUser}
                    getFullAvatarUrl={getFullAvatarUrl}
                    onLikeChange={fetchProfilePosts}
                    onPostDelete={fetchProfilePosts}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center py-20 text-gray-300">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="font-semibold text-gray-400">{t('profile.noPosts')}</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'saved' && (
          <div className="flex flex-col items-center py-20 text-gray-300 pb-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="font-semibold text-gray-400">{t('profile.noSaved')}</p>
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="flex flex-col items-center py-20 text-gray-300 pb-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="font-semibold text-gray-400">{t('profile.noTagged')}</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleUnfriend}
        title={t('profile.unfriendConfirmTitle')}
        message={t('profile.unfriendConfirmMsg', { name: profileUser?.fullName || profileUser?.username })}
        confirmText={t('profile.unfriendConfirmBtn')}
        type="danger"
      />
    </div>
  );
};

export default Profile;