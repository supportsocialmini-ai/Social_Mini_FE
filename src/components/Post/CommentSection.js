import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import commentService from '../../services/commentService';
import { useAuth } from '../../context/AuthContext';

const CommentItem = ({ comment, user, getFullAvatarUrl, onDelete, onReply, depth = 0 }) => {
  const isOwner = user?.userId === comment.userId;
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col ${depth > 0 ? 'ml-8 mt-3' : 'mt-5'}`}>
      <div className="flex gap-3 group">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100">
          <img
            src={getFullAvatarUrl(comment.avatarUrl, comment.fullName)}
            alt={comment.fullName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-slate-50/80 rounded-2xl px-4 py-2.5">
            <p className="font-bold text-[13px] text-slate-900 truncate">{comment.fullName || 'Người dùng'}</p>
            <p className="text-[13px] text-slate-700 mt-1 leading-relaxed break-words">{comment.commentContent}</p>
          </div>
          <div className="flex items-center gap-3 mt-1.5 px-1 flex-wrap">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
              {new Date(comment.createdAt).toLocaleDateString(t('language') === 'vi' ? 'vi-VN' : 'en-US')}
            </p>
            <button
              onClick={() => onReply(comment)}
              className="text-[9px] text-indigo-500 font-bold uppercase tracking-tighter hover:text-indigo-700 transition-colors"
            >
              {t('posts.reply')}
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(comment.commentId)}
                className="text-[9px] text-red-400 font-bold uppercase tracking-tighter hover:text-red-600 transition-colors"
              >
                {t('posts.deleteComment')}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Recursively render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-slate-100">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.commentId} 
              comment={reply} 
              user={user} 
              getFullAvatarUrl={getFullAvatarUrl} 
              onDelete={onDelete} 
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentSection = ({ postId, isOpen, onClose, getFullAvatarUrl }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      setReplyTo(null);
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await commentService.getComments(postId);
      // axiosClient đã bóc result, nên response chính là List<Comment>
      const data = Array.isArray(response) ? response : (response?.$values || []);
      setComments(data);
    } catch (error) {
      console.error("Lỗi lấy comments:", error);
      toast.error(t('posts.fetchCommentsError'));
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      await commentService.createComment({
        postId,
        commentContent: newComment,
        parentCommentId: replyTo?.commentId || null
      });
      setNewComment('');
      setReplyTo(null);
      await fetchComments();
      toast.success(t('posts.commentSuccess'));
    } catch (error) {
      toast.error(error.errorMessage || t('posts.commentError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      await fetchComments();
      toast.success(t('posts.deleteCommentSuccess'));
    } catch (error) {
      toast.error(error.errorMessage || t('posts.deleteCommentError'));
    }
  };

  const handleReplyTo = (comment) => {
    setReplyTo(comment);
    // Focus input if you have a ref, or just let user click
    document.getElementById('comment-input')?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('posts.commentHeader')}</h3>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
              {postId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* Comments list */}
          <div className="mb-8">
            {isLoadingComments ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-6 animate-pulse">{t('posts.loading')}</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="font-bold text-sm">{t('posts.noComments')}</p>
              </div>
            ) : (
              comments.map(comment => (
                <CommentItem 
                  key={comment.commentId} 
                  comment={comment} 
                  user={user} 
                  getFullAvatarUrl={getFullAvatarUrl} 
                  onDelete={handleDeleteComment}
                  onReply={handleReplyTo}
                />
              ))
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 pt-6 border-t border-slate-100">
          {replyTo && (
            <div className="flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-t-2xl mb-px">
              <p className="text-[11px] font-bold text-indigo-600">
                {t('posts.replyingTo', { name: replyTo.fullName })}
              </p>
              <button 
                onClick={() => setReplyTo(null)}
                className="text-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex-shrink-0 overflow-hidden border border-slate-200">
              <img
                src={getFullAvatarUrl(user?.avatarUrl, user?.fullName || user?.username)}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                id="comment-input"
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder={replyTo ? t('posts.replyPlaceholder', { name: replyTo.fullName.split(' ')[0] }) : t('posts.commentPlaceholder')}
                className="w-full bg-white rounded-2xl px-4 py-2.5 outline-none border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-sm"
              />
              <button
                onClick={handleAddComment}
                disabled={isLoading || !newComment.trim()}
                className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-50 disabled:scale-100 flex-shrink-0"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
