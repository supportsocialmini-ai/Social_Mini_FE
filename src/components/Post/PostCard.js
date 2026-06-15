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
import ReportModal from '../Common/ReportModal';
import ShareModal from './ShareModal';
import { Flag, Share2, Crown, Check, CreditCard, Clock, Shield } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

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
  const [localPrivacy, setLocalPrivacy] = useState(post.privacy || 'Public');
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);
  const [likeCount, setLikeCount]           = useState(post.likeCount || 0);
  const [isLiked, setIsLiked]               = useState(post.isLiked || false);
  const [isLiking, setIsLiking]             = useState(false);
  const [isDeleting, setIsDeleting]         = useState(false);
  const [isSaved, setIsSaved]               = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmSponsorOpen, setIsConfirmSponsorOpen] = useState(false);
  const [isExpanded, setIsExpanded]         = useState(false);
  const [likeAnimating, setLikeAnimating]   = useState(false);
  const [isSentRequest, setIsSentRequest]   = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [dbPackages, setDbPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDays, setCustomDays] = useState(3);
  const [enlargedImage, setEnlargedImage] = useState(null);

  const getSelectedPackage = () => {
    return dbPackages.find(p => p.id === selectedPackageId) || dbPackages[0];
  };

  const getCustomPrice = () => {
    const pkg = getSelectedPackage();
    if (!pkg) return 0;
    const ratePerDay = pkg.price / (pkg.durationDays || 1);
    return Math.round(ratePerDay * customDays);
  };

  const isPostOwner = currentUser?.userId === post.userId;
  const privacy = post.privacy || 'Public';

  useEffect(() => {
    const fetchDbPackages = async () => {
      try {
        const res = await axiosClient.get('/api/payment/packages');
        const adsPackages = (res || []).filter(pkg => 
          pkg.features?.split(',').map(f => f.trim()).includes('Sponsor Post')
        );
        setDbPackages(adsPackages);
        if (adsPackages.length > 0) {
          setSelectedPackageId(adsPackages[0].id);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách gói cước:", err);
      }
    };
    if (showPremiumModal) {
      fetchDbPackages();
    }
  }, [showPremiumModal]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the trigger button and the portal'ed dropdown
      const isOutsideTrigger = menuRef.current && !menuRef.current.contains(event.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);
      
      if (isOutsideTrigger && isOutsideDropdown) {
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
    
    if (seconds < 60) return t('posts.time.justNow');
    if (seconds < 3600) return t('posts.time.minsAgo', { count: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('posts.time.hoursAgo', { count: Math.floor(seconds / 3600) });
    if (seconds < 604800) return t('posts.time.daysAgo', { count: Math.floor(seconds / 86400) });
    return date.toLocaleDateString('vi-VN');
  };

  const getSponsorTimeRemaining = () => {
    if (!post.sponsorEndDate) return '';
    const end = new Date(post.sponsorEndDate);
    const now = new Date();
    const diffMs = end - now;
    if (diffMs <= 0) return 'Hết hạn';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 1) return `Còn ${diffDays} ngày`;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours >= 1) return `Còn ${diffHours} giờ`;
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `Còn ${diffMins} phút`;
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
      setLocalPrivacy(newPrivacy);
      // Update the prop for future re-renders from parent if needed
      post.privacy = newPrivacy; 
      // Silencing success toast per general UI policy
    } catch (error) {
      toast.error(t(`api.${error.errorMessage || 'Post.Upsert.UpdateFail'}`));
    } finally {
      setIsMenuOpen(false);
    }
  };

  const [localIsSponsored, setLocalIsSponsored] = useState(post.isSponsored || false);

  const handleUpgrade = async () => {
    if (!selectedPackageId) return;
    setIsProcessingPayment(true);
    try {
      const response = await axiosClient.post('/api/payment/create', { 
        packageId: selectedPackageId,
        postId: post.postId || post.id,
        customDays: isCustomDuration ? customDays : null
      });
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
    } catch (err) {
      toast.error("Không thể khởi tạo thanh toán.");
      setIsProcessingPayment(false);
    }
  };

  const executeToggleSponsorOff = async () => {
    try {
      const res = await postService.toggleSponsor(post.postId || post.id);
      const isSponsoredNew = res?.data ?? false;
      setLocalIsSponsored(isSponsoredNew);
      post.isSponsored = isSponsoredNew;
      toast.success("Đã tắt quảng cáo bài viết.");
      if (onLikeChange) onLikeChange();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thực hiện thao tác này.");
    }
  };

  const handleToggleSponsor = async () => {
    const isAdmin = currentUser?.isAdmin || false;
    
    if (localIsSponsored) {
      setIsConfirmSponsorOpen(true);
      setIsMenuOpen(false);
      return;
    }

    if (isAdmin) {
      // Admin được quyền bật trực tiếp không cần mua
      try {
        const res = await postService.toggleSponsor(post.postId || post.id);
        const isSponsoredNew = res?.data ?? true;
        setLocalIsSponsored(isSponsoredNew);
        post.isSponsored = isSponsoredNew;
        toast.success("Đã bật quảng cáo bài viết (Quyền Admin).");
        if (onLikeChange) onLikeChange();
      } catch (error) {
        toast.error("Có lỗi xảy ra khi thực hiện thao tác này.");
      } finally {
        setIsMenuOpen(false);
      }
    } else {
      // Người dùng thường phải mua gói quảng cáo cho bài viết này
      setIsMenuOpen(false);
      setShowPremiumModal(true);
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link to={isPostOwner ? '/profile' : `/profile/${post.userId}`}
                  className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors duration-200">
                  {post.author || 'Người dùng'}
                </Link>
                
                {post.groupName && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-medium">›</span>
                    <Link to={`/groups/${post.groupId}`} 
                      className="font-extrabold text-indigo-600 text-[13px] hover:underline transition-all flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-indigo-100 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      {post.groupName}
                    </Link>
                  </div>
                )}

                {isPostOwner ? (
                  <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.1)' }}>{t('posts.you')}</span>
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
                    {isSentRequest ? t('posts.sent') : t('posts.addFriend')}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-slate-400">{getTimeAgo(post.time || post.createdAt)}</span>
                <span className="text-slate-200 text-[10px]">•</span>
                <span className="text-slate-400" title={localPrivacy}><PrivacyIcon privacy={localPrivacy} /></span>
                {localIsSponsored && (
                  <>
                    <span className="text-slate-200 text-[10px]">•</span>
                    <span className="text-[8.5px] font-bold text-amber-500 bg-amber-50/60 border border-amber-200/40 px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-amber-500/5">
                      <svg className="w-2.5 h-2.5 text-amber-500 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      {t('posts.sponsored') || 'Bài viết được tài trợ'}
                    </span>
                  </>
                )}
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
          {post.isViolated && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200/50 flex flex-col gap-3 text-left">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600 flex-shrink-0">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-800">Bài viết của bạn đã bị ẩn/xóa vì vi phạm chính sách cộng đồng</h4>
                  <p className="text-xs text-rose-600 font-semibold mt-1">Lý do: {post.violationReason || "Nội dung không phù hợp"}</p>
                </div>
              </div>
              
              {isPostOwner && (
                <div className="flex items-center justify-between border-t border-rose-200/40 pt-3 mt-1">
                  {localIsAppealed ? (
                    <span className="text-[11px] font-bold text-slate-500 italic flex items-center gap-1.5">
                      <Clock size={12} className="animate-spin text-indigo-500" />
                      Đã gửi kháng nghị, đang chờ ban quản trị duyệt...
                    </span>
                  ) : (
                    <>
                      <span className="text-[11px] font-medium text-rose-700 leading-snug">Bạn tin rằng có sự nhầm lẫn? Giải trình kháng nghị ngay.</span>
                      <button
                        onClick={() => setIsAppealModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-rose-600/10"
                      >
                        Kháng nghị
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-slate-800 text-[15px] leading-relaxed break-words">
            {post.postContent?.length > 250 && !isExpanded
              ? `${post.postContent.substring(0, 250)}...`
              : post.postContent}
            {post.postContent?.length > 250 && (
              <button onClick={() => setIsExpanded(!isExpanded)}
                className="ml-1 font-bold text-sm transition-colors hover:underline"
                style={{ color: '#6366f1' }}>
                {isExpanded ? t('posts.seeLess') : t('posts.seeMore')}
              </button>
            )}
          </p>

          {/* ── Original Post (Shared Content) ────────── */}
          {post.originalPost && (
            <div className="mt-3 rounded-2xl border border-slate-200/60 bg-white/40 overflow-hidden post-card-glass hover:bg-white/60 transition-all duration-300">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Link 
                    to={`/profile/${post.originalPost.userId}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src={getFullAvatarUrl(post.originalPost.avatarUrl, post.originalPost.fullName)} 
                      alt="Author" 
                      className="w-7 h-7 rounded-full ring-1 ring-slate-100"
                    />
                    <span className="font-bold text-sm text-slate-800">{post.originalPost.fullName}</span>
                  </Link>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <span className="text-[11px] text-slate-400">{getTimeAgo(post.originalPost.createdAt)}</span>
                </div>

                {post.originalPost.postContent && (
                  <p className="text-sm text-slate-600 leading-relaxed break-words line-clamp-4">
                    {post.originalPost.postContent}
                  </p>
                )}

                {post.originalPost.imageUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                    <img 
                      src={getFullImageUrl(post.originalPost.imageUrl)} 
                      alt="Original Post Image" 
                      className="w-full h-auto max-h-[300px] object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                      onClick={() => setEnlargedImage(getFullImageUrl(post.originalPost.imageUrl))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Image ──────────────────────────────────── */}
        {post.imageUrl && (
          <div className="w-full max-h-[560px] overflow-hidden flex items-center justify-center relative"
            style={{ borderTop: '1px solid rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
            <img src={getFullImageUrl(post.imageUrl)} alt="post"
              className="w-full h-auto max-h-[560px] object-contain post-img cursor-zoom-in hover:opacity-95 transition-opacity"
              onClick={() => setEnlargedImage(getFullImageUrl(post.imageUrl))}
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
                <span>{t('posts.likesCount')}</span>
              </button>
            )}
            {(post.commentCount || 0) > 0 && (
              <button onClick={() => setIsCommentOpen(true)}
                className="transition-all duration-200 hover:text-indigo-600 hover:scale-105 active:scale-95">
                <span className="font-semibold text-slate-700">{post.commentCount}</span> {t('posts.commentsCount')}
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
            <span className="hidden sm:inline">{isLiked ? t('posts.liked') : t('posts.like')}</span>
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
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="action-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 font-semibold text-sm flex-1 justify-center"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.06)', e.currentTarget.style.color = '#10b981')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#64748b')}
          >
            <Share2 className="h-5 w-5" />
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
          {isCommentOpen && <CommentSection postId={post.postId || post.id} isOpen={isCommentOpen} onClose={() => setIsCommentOpen(false)} getFullAvatarUrl={getFullAvatarUrl} />}
          {isLikesModalOpen && <LikesModal postId={post.postId || post.id} isOpen={isLikesModalOpen} onClose={() => setIsLikesModalOpen(false)} />}
          {isConfirmDeleteOpen && <ConfirmModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} onConfirm={handleDelete}
            title={t('posts.deleteConfirmTitle')} message={t('posts.deleteConfirmMsg')}
            confirmText={t('posts.deleteConfirmBtn')} type="danger" />}
          {isConfirmSponsorOpen && <ConfirmModal isOpen={isConfirmSponsorOpen} onClose={() => setIsConfirmSponsorOpen(false)} onConfirm={executeToggleSponsorOff}
            title="Tắt quảng cáo?" message="Khi bạn tắt quảng cáo, bạn sẽ mất hoàn toàn quyền lợi và không thể hoàn tác thao tác này!"
            confirmText="Tắt quảng cáo" cancelText="Hủy" type="danger" />}
          {isReportModalOpen && <ReportModal 
            isOpen={isReportModalOpen} 
            onClose={() => setIsReportModalOpen(false)} 
            targetId={post.postId || post.id} 
            targetType="Post" 
          />}

          {isShareModalOpen && <ShareModal 
            isOpen={isShareModalOpen} 
            onClose={() => setIsShareModalOpen(false)} 
            post={post}
            onShareSuccess={() => onLikeChange && onLikeChange()} // Re-fetch to show new post
          />}
          {showPremiumModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isProcessingPayment && setShowPremiumModal(false)}></div>
              <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 text-left">
                 {/* Header Modal */}
                 <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <Crown className="w-40 h-40 rotate-12" />
                    </div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-3 mb-4 text-amber-400">
                          <Crown className="w-8 h-8 fill-current" />
                          <span className="font-black tracking-widest uppercase text-sm">Quảng cáo bài viết</span>
                       </div>
                       <h2 className="text-4xl font-black mb-2">Đẩy bài viết lên xu hướng</h2>
                       <p className="text-slate-400 font-medium leading-relaxed">Lựa chọn gói thời gian phù hợp để ghim bài viết này lên đầu bảng tin của tất cả mọi người.</p>
                    </div>
                 </div>

                 <div className="p-10 space-y-8">
                     {/* Tab Selector */}
                     <div className="flex gap-4 p-1.5 bg-slate-100/80 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setIsCustomDuration(false)}
                          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 ${!isCustomDuration ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                           Gói có sẵn
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                             setIsCustomDuration(true);
                             if (dbPackages.length > 0 && !selectedPackageId) {
                                setSelectedPackageId(dbPackages[0].id);
                             }
                          }}
                          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 ${isCustomDuration ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                           Tùy chỉnh số ngày
                        </button>
                     </div>

                     {!isCustomDuration ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {dbPackages.length > 0 ? dbPackages.map((pkg, idx) => (
                             <button 
                               key={pkg.id}
                               type="button"
                               onClick={() => setSelectedPackageId(pkg.id)}
                               disabled={isProcessingPayment}
                               className={`relative p-6 rounded-3xl border-2 transition-all text-left flex flex-col justify-between hover:scale-[1.02] active:scale-95 ${
                                  selectedPackageId === pkg.id 
                                  ? 'border-indigo-600 bg-indigo-50/30' 
                                  : (idx === 1 ? 'border-amber-400/30 bg-amber-50/10' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200')
                               }`}
                             >
                                {(selectedPackageId === pkg.id || (idx === 1 && !selectedPackageId)) && (
                                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase">Đang chọn</span>
                                )}
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase mb-1">{pkg.name}</p>
                                    <p className="text-2xl font-black text-slate-900">
                                       {pkg.price?.toLocaleString('vi-VN')} ₫
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                                       <Clock className="w-2.5 h-2.5" />
                                       {pkg.durationDays || 30} ngày
                                    </div>
                                 </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-tighter">{pkg.description || 'Ưu đãi đặc biệt'}</p>
                             </button>
                           )) : (
                             <div className="col-span-3 py-10 text-center text-slate-400 font-bold italic">
                                Đang tải các gói ưu đãi...
                             </div>
                           )}
                        </div>
                     ) : (
                        <div className="p-8 bg-slate-50/80 rounded-3xl border border-slate-100 space-y-6">
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                 <p className="text-sm font-black text-slate-800">Số ngày muốn quảng cáo</p>
                                 <p className="text-xs font-medium text-slate-400 mt-1">Nhập số ngày (từ 1 ngày trở lên)</p>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button
                                   type="button"
                                   onClick={() => setCustomDays(prev => Math.max(1, prev - 1))}
                                   className="w-10 h-10 bg-white border border-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-slate-100 active:scale-90"
                                 >-</button>
                                 <input
                                   type="number"
                                   min="1"
                                   value={customDays}
                                   onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                                   className="w-16 h-10 text-center bg-white border border-slate-200 rounded-xl font-black text-lg outline-none"
                                 />
                                 <button
                                   type="button"
                                   onClick={() => setCustomDays(prev => prev + 1)}
                                   className="w-10 h-10 bg-white border border-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-slate-100 active:scale-90"
                                 >+</button>
                              </div>
                           </div>
                           
                           {getSelectedPackage() && (
                              <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center text-xs font-bold text-slate-600">
                                 <span>Đơn giá mỗi ngày:</span>
                                 <span className="text-indigo-600 font-black">
                                    {Math.round(getSelectedPackage().price / (getSelectedPackage().durationDays || 1)).toLocaleString('vi-VN')} ₫ / ngày
                                 </span>
                              </div>
                           )}

                           <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center">
                              <span className="text-sm font-black text-slate-800">Tổng tiền tạm tính:</span>
                              <span className="text-3xl font-black text-slate-900">
                                 {getCustomPrice().toLocaleString('vi-VN')} ₫
                              </span>
                           </div>
                        </div>
                     )}

                    {(() => {
                       const selectedPkg = dbPackages.find(p => p.id === selectedPackageId);
                       return selectedPkg?.description ? (
                          <div className="bg-slate-50 p-6 rounded-3xl">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Mô tả gói:</p>
                             <p className="text-sm font-medium text-slate-600 leading-relaxed">{selectedPkg.description}</p>
                          </div>
                       ) : null;
                    })()}

                    <div className="flex flex-col items-center gap-5 pt-4">
                       <button 
                          onClick={handleUpgrade}
                          disabled={isProcessingPayment || !selectedPackageId}
                          className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                       >
                          {isProcessingPayment ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Đang xử lý...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-6 h-6" />
                              <span>Thanh toán ngay</span>
                            </>
                          )}
                       </button>

                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <Shield className="w-3 h-3" />
                         Thanh toán an toàn qua VNPay
                       </div>
                       
                       <button 
                         onClick={() => setShowPremiumModal(false)}
                         disabled={isProcessingPayment}
                         className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                       >
                         Để sau
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          )}
          {enlargedImage && (
            <div className="fixed inset-0 z-[20000] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200" onClick={() => setEnlargedImage(null)}>
              <img src={enlargedImage} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" />
              <button onClick={() => setEnlargedImage(null)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </>,
        document.body
      )
}

      {/* ===== 3-Dot Menu Portal ===== */}
      {isMenuOpen && createPortal(
        <div 
          ref={dropdownRef}
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
                  style={localPrivacy === p.key
                    ? { background: 'rgba(99,102,241,0.06)', color: '#6366f1', fontWeight: 700 }
                    : { color: '#4d5b7c' }}
                >
                  <span className={localPrivacy === p.key ? 'text-indigo-500 scale-110' : 'text-slate-400'}>
                    <PrivacyIcon privacy={p.key} />
                  </span>
                  <span className="flex-1">{p.label}</span>
                  {localPrivacy === p.key && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  )}
                </button>
              ))}
              
              <div className="h-px my-2 mx-3 bg-slate-100/80" />
              
              <button onClick={handleToggleSponsor}
                className={`w-full px-4 py-2.5 text-left text-[14px] flex items-center gap-3 transition-all duration-150 font-bold hover:bg-amber-50 ${
                  localIsSponsored ? 'text-amber-600' : 'text-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  localIsSponsored ? 'bg-amber-100/60' : 'bg-slate-100'
                }`}>
                  <svg className={`h-4 w-4 ${localIsSponsored ? 'text-amber-500 fill-current' : 'text-slate-500'}`} viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
                {localIsSponsored ? 'Tắt quảng cáo' : 'Quảng cáo bài viết'}
              </button>

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
          
          {!isPostOwner && (
            <button onClick={() => { setIsReportModalOpen(true); setIsMenuOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-[14px] flex items-center gap-3 transition-all duration-150 text-red-500 font-bold hover:bg-red-50"
            >
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Flag size={14} className="text-red-500" />
              </div>
              Báo cáo bài viết
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default React.memo(PostCard);