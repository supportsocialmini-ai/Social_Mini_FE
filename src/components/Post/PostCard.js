import React, { useState } from 'react';
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

const PostCard = ({ post, getFullAvatarUrl, onLikeChange, onPostDelete, user: parentUser }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const currentUser = parentUser || user;
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isPostOwner = currentUser?.userId === post.userId;

  // Get full image URL
  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl; // Already full URL
    const apiBase = process.env.REACT_APP_API_URL || 'https://social-mini-app.onrender.com';
    const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    return `${cleanBase}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  // Format time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return t('posts.time.now');
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('posts.time.m')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t('posts.time.h')}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}${t('posts.time.d')}`;
    return date.toLocaleDateString(t('language') === 'vi' ? 'vi-VN' : 'en-US');
  };

  const handleLike = async () => {
    setIsLiking(true);
    try {
      const response = await likeService.toggleLike(post.postId || post.id);
      // axiosClient đã bóc result nên response chính là { isLiked: ... }
      const newIsLiked = response?.isLiked ?? !isLiked;

      setIsLiked(newIsLiked);
      setLikeCount(newIsLiked ? likeCount + 1 : likeCount - 1);

      if (onLikeChange) {
        onLikeChange();
      }

      toast.success(newIsLiked ? t('posts.liked') : t('posts.unliked'));
    } catch (error) {
      console.error("Lỗi khi like:", error);
      toast.error(t(`api.${error.errorMessage || 'likeError'}`));
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postService.deletePost(post.postId || post.id);
      toast.success(t('posts.deleted'));

      if (onPostDelete) {
        onPostDelete();
      }
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      toast.error(t(`api.${error.errorMessage || 'posts.deleteError'}`));
    } finally {
      setIsDeleting(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 mb-6 overflow-hidden border border-gray-100/50 group">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Link to={isPostOwner ? "/profile" : `/profile/${post.userId}`} className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex-shrink-0 border-2 border-white overflow-hidden shadow-md hover:scale-110 transition-transform">
              <img src={getFullAvatarUrl(post.avatarUrl || post.authorAvatar, post.author)} alt={post.author} className="w-full h-full object-cover" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link to={isPostOwner ? "/profile" : `/profile/${post.userId}`} className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors">{post.author || 'Người dùng'}</Link>
                {isPostOwner && (
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{t('posts.you')}</span>
                )}
                {!isPostOwner && (
                  <button
                    onClick={async () => {
                      try {
                        await friendService.sendRequest(post.userId);
                        toast.success(t('api.Friend.Request.Success'));
                      } catch (err) {
                        toast.error(t(`api.${err.errorMessage || 'Friend.Request.Fail'}`));
                      }
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-600 px-2 py-0.5 rounded-full transition-all"
                  >
                    {t('posts.addFriend')}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{getTimeAgo(post.time || post.createdAt)}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 12a1 1 0 11-2 0 1 1 0 012 0zM12 12a1 1 0 11-2 0 1 1 0 012 0zM19 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </button>

            {/* Menu */}
            {isMenuOpen && isPostOwner && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 min-w-[160px] overflow-hidden animate-in fade-in">
                <button
                  onClick={() => {
                    setIsConfirmDeleteOpen(true);
                    setIsMenuOpen(false);
                  }}
                  disabled={isDeleting}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isDeleting ? t('posts.deleting') : t('posts.delete')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-800 text-[15px] leading-relaxed font-medium break-words">
            {post.postContent.length > 200 && !isExpanded 
              ? `${post.postContent.substring(0, 200)}...` 
              : post.postContent}
            {post.postContent.length > 200 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-1 text-indigo-600 font-bold hover:underline transition-all"
              >
                {isExpanded ? t('common.seeLess') || 'Thu gọn' : t('common.seeMore') || 'Xem thêm'}
              </button>
            )}
          </p>
        </div>

        {/* Image Display */}
        {post.imageUrl && (
          <div className="w-full h-96 overflow-hidden bg-gray-100 border-y border-gray-100">
            <img src={getFullImageUrl(post.imageUrl)} alt="post" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
        )}

        {/* Stats */}
        {(likeCount > 0 || (post.commentCount || 0) > 0) && (
          <div className="flex items-center gap-6 text-xs text-gray-500 font-semibold px-6 py-3 bg-gray-50/50 border-y border-gray-50">
            {likeCount > 0 && (
              <span
                onClick={() => setIsLikesModalOpen(true)}
                className="hover:text-indigo-600 cursor-pointer transition-colors"
              >
                ❤️ <span className="text-gray-700">{likeCount}</span> {t('posts.likes')}
              </span>
            )}
            {(post.commentCount || 0) > 0 && (
              <span
                onClick={() => setIsCommentOpen(true)}
                className="hover:text-indigo-600 cursor-pointer transition-colors"
              >
                💬 <span className="text-gray-700">{post.commentCount}</span> {t('posts.comments')}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 px-3 py-3 bg-gray-50/30 border-t border-gray-100">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all flex-1 justify-center ${isLiked
              ? 'bg-red-50/80 text-red-600 hover:bg-red-100'
              : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isLiked ? 'scale-110' : ''}`} fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="hidden sm:inline">{t('posts.like')}</span>
          </button>

          <button
            onClick={() => setIsCommentOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all flex-1 justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="hidden sm:inline">{t('posts.comment')}</span>
          </button>

          <button
            onClick={() => setIsSaving(!isSaving)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-amber-50 hover:text-amber-600 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isSaving ? 'scale-110' : ''}`} fill={isSaving ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z" />
            </svg>
          </button>
        </div>
      </div>

      <CommentSection
        postId={post.postId || post.id}
        isOpen={isCommentOpen}
        onClose={() => setIsCommentOpen(false)}
        getFullAvatarUrl={getFullAvatarUrl}
      />

      <LikesModal
        postId={post.postId || post.id}
        isOpen={isLikesModalOpen}
        onClose={() => setIsLikesModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('posts.deleteConfirmTitle')}
        message={t('posts.deleteConfirmMsg')}
        confirmText={t('posts.deleteConfirmBtn')}
        type="danger"
      />
    </>
  );
};

export default PostCard;