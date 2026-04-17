import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import CommentSection from './CommentSection';
import LikesModal from './LikesModal';
import ConfirmModal from '../Common/ConfirmModal';
import likeService from '../../services/likeService';
import postService from '../../services/postService';
import friendService from '../../services/friendService';
import { useAuth } from '../../context/AuthContext';

/* ── Glassmorphism card style ── */
const glassCard = {
  background: 'rgba(255,255,255,0.68)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(99,102,241,0.06), 0 1px 6px rgba(0,0,0,0.04)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

const PrivacyIcon = ({ privacy }) => {
  if (privacy === 'Friends') return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  if (privacy === 'OnlyMe') return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

const PostCard = ({ post, getFullAvatarUrl, onLikeChange, onPostDelete, user: parentUser }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const currentUser = parentUser || user;
  const [isCommentOpen, setIsCommentOpen]   = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const [likeCount, setLikeCount]           = useState(post.likeCount || 0);
  const [isLiked, setIsLiked]               = useState(post.isLiked || false);
  const [isLiking, setIsLiking]             = useState(false);
  const [isDeleting, setIsDeleting]         = useState(false);
  const [isSaved, setIsSaved]               = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isExpanded, setIsExpanded]         = useState(false);
  const [likeAnimating, setLikeAnimating]   = useState(false);
  const [isSentRequest, setIsSentRequest]   = useState(false);

  const isPostOwner = currentUser?.userId === post.userId;
  const privacy = post.privacy || 'Public';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu on scroll - important for portals
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleScroll = () => setIsMenuOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isMenuOpen]);

  const handleMenuToggle = (e) => {
    if (!isMenuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX,
      });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    const apiBase = process.env.REACT_APP_API_URL || 'https://social-mini-app.onrender.com';
    const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    return `${cleanBase}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return t('post.justNow') || 'Vừa xong';
    
    // Attempt to parse. If it's an ISO string from backend, it works.
    // Handle the case where the string might not be UTC-marked
    const utcString = (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.includes('+')) 
      ? `${dateString}Z` 
      : dateString;
      
    const date = new Date(utcString);
    
    // Check if the date is actually valid
    if (isNaN(date.getTime())) {
      // If it failed, try the original string without the Z hack
      const fallbackDate = new Date(dateString);
      if (isNaN(fallbackDate.getTime())) return '...'; // Last resort
      return fallbackDate.toLocaleDateString('vi-VN');
    }

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return t('post.justNow') || 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    try {
      const response = await likeService.toggleLike(post.postId || post.id);
      const newIsLiked = response?.isLiked ?? !isLiked;
      setIsLiked(newIsLiked);
      setLikeCount(newIsLiked ? likeCount + 1 : likeCount - 1);
      if (onLikeChange) onLikeChange();
    } catch (error) {
      toast.error(t(`api.${error.errorMessage || 'likeError'}`));
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postService.deletePost(post.postId || post.id);
      // Silencing success toast per user request
      if (onPostDelete) onPostDelete();
    } catch (error) {
      toast.error(t(`api.${error.errorMessage || 'posts.deleteError'}`));
    } finally {
      setIsDeleting(false);
      setIsMenuOpen(false);
    }
  };

  const handlePrivacyChange = async (newPrivacy) => {
    try {
      await postService.updatePost(post.postId || post.id, { Content: post.postContent, Privacy: newPrivacy });
      post.privacy = newPrivacy;
      toast.success(t('api.Post.Upsert.UpdateSuccess'));
    } catch (error) {
      toast.error(t(`api.${error.errorMessage || 'Post.Upsert.UpdateFail'}`));
    } finally {
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <style>{`
        /* PostCard CSS-only hover — no JS state, no re-render, no jitter */
        .post-card-glass {
          background: rgba(255,255,255,0.68);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.55);
          box-shadow: 0 4px 24px rgba(99,102,241,0.06), 0 1px 6px rgba(0,0,0,0.04);
          transition: box-shadow 0.3s ease, transform 0.3s ease, background 0.3s ease;
          will-change: transform;
        }
        .post-card-glass:hover {
          background: rgba(255,255,255,0.82);
          box-shadow: 0 12px 40px rgba(99,102,241,0.1), 0 2px 12px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }
        .post-card-glass .post-img {
          transition: transform 0.6s ease;
        }
        .post-card-glass:hover .post-img {
          transform: scale(1.01);
        }
        @keyframes likeHeartPop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.4) rotate(-8deg); }
          60%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .like-heart-pop { animation: likeHeartPop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
        .action-btn { transition: all 0.2s ease; }
        .action-btn:hover { transform: translateY(-2px); }
        .action-btn:active { transform: scale(0.95); }
      `}</style>

      <div
        className="rounded-2xl overflow-visible post-card-glass relative"
        style={{ zIndex: isMenuOpen ? 900 : 1 }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={isPostOwner ? '/profile' : `/profile/${post.userId}`}
              className="relative flex-shrink-0 transition-transform duration-200 hover:scale-105">
              <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-indigo-200/50">
                <img src={getFullAvatarUrl(post.avatarUrl || post.authorAvatar, post.author)} alt={post.author}
                  className="w-full h-full object-cover" />
              </div>
              {/* Online indicator */}
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
            </Link>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={isPostOwner ? '/profile' : `/profile/${post.userId}`}
                  className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors duration-200">
                  {post.author || 'Người dùng'}
                </Link>
                {isPostOwner ? (
                  <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.1)' }}>Bạn</span>
                ) : (
                  <button
                    onClick={async () => {
                      setIsSentRequest(true); // Optimistic update
                      try {
                        await friendService.sendRequest(post.userId);
                        // Silencing success toast per user request
                      } catch (err) {
                        // Silent error per user request - we keep 'Sent' for UX
                        console.error('Lỗi gửi kết bạn:', err);
                      }
                    }}
                    disabled={isSentRequest}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all hover:scale-105 active:scale-95"
                    style={isSentRequest 
                      ? { background: 'rgba(99,102,241,0.06)', color: '#94a3b8', cursor: 'default' }
                      : { background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
                    onMouseEnter={e => !isSentRequest && (e.currentTarget.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)', e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => !isSentRequest && (e.currentTarget.style.background = 'rgba(99,102,241,0.08)', e.currentTarget.style.color = '#6366f1')}
                  >
                    {isSentRequest ? 'Đã gửi' : '+ Kết bạn'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-400">{getTimeAgo(post.time || post.createdAt)}</span>
                <span className="text-slate-200 text-[10px]">•</span>
                <span className="text-slate-400" title={privacy}><PrivacyIcon privacy={privacy} /></span>
              </div>
            </div>
          </div>

          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={handleMenuToggle}
              className="w-8 h-8 rounded-full text-slate-400 flex items-center justify-center transition-all duration-200 hover:bg-slate-50 hover:text-indigo-500"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Content ────────────────────────────────── */}
        <div className="px-5 pb-3">
          <p className="text-slate-800 text-[15px] leading-relaxed break-words">
            {post.postContent?.length > 250 && !isExpanded
              ? `${post.postContent.substring(0, 250)}...`
              : post.postContent}
            {post.postContent?.length > 250 && (
              <button onClick={() => setIsExpanded(!isExpanded)}
                className="ml-1 font-bold text-sm transition-colors hover:underline"
                style={{ color: '#6366f1' }}>
                {isExpanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </p>
        </div>

        {/* ── Image ──────────────────────────────────── */}
        {post.imageUrl && (
          <div className="w-full max-h-[560px] overflow-hidden flex items-center justify-center relative"
            style={{ borderTop: '1px solid rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
            <img src={getFullImageUrl(post.imageUrl)} alt="post"
              className="w-full h-auto max-h-[560px] object-contain post-img"
            />
          </div>
        )}

        {/* ── Stats ──────────────────────────────────── */}
        {(likeCount > 0 || (post.commentCount || 0) > 0) && (
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium px-5 py-2.5"
            style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
            {likeCount > 0 && (
              <button onClick={() => setIsLikesModalOpen(true)}
                className="flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)' }}>❤️</div>
                <span className="font-semibold text-slate-700 hover:text-indigo-600 transition-colors">{likeCount}</span>
                <span>lượt thích</span>
              </button>
            )}
            {(post.commentCount || 0) > 0 && (
              <button onClick={() => setIsCommentOpen(true)}
                className="transition-all duration-200 hover:text-indigo-600 hover:scale-105 active:scale-95">
                <span className="font-semibold text-slate-700">{post.commentCount}</span> bình luận
              </button>
            )}
          </div>
        )}

        {/* ── Actions ────────────────────────────────── */}
        <div className="flex items-center px-3 py-1.5 gap-1">
          {/* Like */}
          <button onClick={handleLike} disabled={isLiking}
            className="action-btn flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm flex-1 justify-center relative overflow-hidden"
            style={{
              color: isLiked ? '#f43f5e' : '#64748b',
              background: isLiked ? 'rgba(244,63,94,0.07)' : 'transparent',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => !isLiked && (e.currentTarget.style.background = 'rgba(99,102,241,0.06)')}
            onMouseLeave={e => !isLiked && (e.currentTarget.style.background = 'transparent')}
          >
            <svg className={`h-5 w-5 ${likeAnimating ? 'like-heart-pop' : ''}`}
              fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="hidden sm:inline">{isLiked ? 'Đã thích' : 'Thích'}</span>
          </button>

          {/* Comment */}
          <button onClick={() => setIsCommentOpen(true)}
            className="action-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 font-semibold text-sm flex-1 justify-center"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.06)', e.currentTarget.style.color = '#6366f1')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#64748b')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="hidden sm:inline">Bình luận</span>
          </button>

          {/* Share */}
          <button className="action-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 font-semibold text-sm flex-1 justify-center"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.06)', e.currentTarget.style.color = '#10b981')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#64748b')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>

          {/* Save */}
          <button onClick={() => setIsSaved(!isSaved)}
            className="action-btn p-2.5 rounded-xl transition-all duration-200"
            style={{
              color: isSaved ? '#f59e0b' : '#94a3b8',
              background: isSaved ? 'rgba(245,158,11,0.08)' : 'transparent',
            }}
            onMouseEnter={e => !isSaved && (e.currentTarget.style.color = '#f59e0b', e.currentTarget.style.background = 'rgba(245,158,11,0.06)')}
            onMouseLeave={e => !isSaved && (e.currentTarget.style.color = '#94a3b8', e.currentTarget.style.background = 'transparent')}
          >
            <svg className="h-5 w-5" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z" />
            </svg>
          </button>
        </div>
      </div>

      {createPortal(
        <>
          <CommentSection postId={post.postId || post.id} isOpen={isCommentOpen} onClose={() => setIsCommentOpen(false)} getFullAvatarUrl={getFullAvatarUrl} />
          <LikesModal postId={post.postId || post.id} isOpen={isLikesModalOpen} onClose={() => setIsLikesModalOpen(false)} />
          <ConfirmModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} onConfirm={handleDelete}
            title={t('posts.deleteConfirmTitle')} message={t('posts.deleteConfirmMsg')}
            confirmText={t('posts.deleteConfirmBtn')} type="danger" />
        </>,
        document.body
      )}

      {/* ===== 3-Dot Menu Portal ===== */}
      {isMenuOpen && createPortal(
        <div 
          className="fixed z-[5000] rounded-[1.2rem] overflow-hidden min-w-[200px] py-2 shadow-[0_20px_50px_rgba(0,0,0,0.2),0_10px_20px_rgba(99,102,241,0.1)] border border-slate-100/50"
          style={{
            top: menuCoords.top - window.scrollY + 8,
            left: menuCoords.left - window.scrollX - 200, // Align right edge
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            animation: 'modalScaleUp 0.15s ease-out forwards',
          }}
        >
          {isPostOwner && (
            <>
              <p className="px-4 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">QUYỀN RIÊNG TƯ</p>
              {[
                { key: 'Public', label: 'Công khai' },
                { key: 'Friends', label: 'Bạn bè' },
                { key: 'OnlyMe', label: 'Chỉ mình tôi' },
              ].map(p => (
                <button key={p.key} onClick={() => { handlePrivacyChange(p.key); setIsMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-[14px] flex items-center gap-3 transition-all duration-150 hover:bg-slate-50"
                  style={privacy === p.key
                    ? { background: 'rgba(99,102,241,0.06)', color: '#6366f1', fontWeight: 700 }
                    : { color: '#4d5b7c' }}
                >
                  <span className={privacy === p.key ? 'text-indigo-500 scale-110' : 'text-slate-400'}>
                    <PrivacyIcon privacy={p.key} />
                  </span>
                  <span className="flex-1">{p.label}</span>
                  {privacy === p.key && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  )}
                </button>
              ))}
              
              <div className="h-px my-2 mx-3 bg-slate-100/80" />
              
              <button onClick={() => { setIsConfirmDeleteOpen(true); setIsMenuOpen(false); }}
                disabled={isDeleting}
                className="w-full px-4 py-2.5 text-left text-[14px] flex items-center gap-3 transition-all duration-150 text-red-500 font-bold hover:bg-red-50"
              >
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                {isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default PostCard;