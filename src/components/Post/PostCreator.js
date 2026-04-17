import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import postService from '../../services/postService';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

/**
 * PostCreator — isolated component so that typing only re-renders THIS component,
 * not the entire Home page (which would trigger re-render of all PostCards, sidebars, etc.)
 */
const PostCreator = ({ user, getFullAvatarUrl, onPostSuccess }) => {
  const { t } = useTranslation();
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting]     = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile]       = useState(null);
  const [privacy, setPrivacy]           = useState('Public');

  const handlePostSubmit = useCallback(async () => {
    if (!postContent.trim()) return;
    setIsPosting(true);
    try {
      if (imageFile) {
        await postService.createPostWithImage(postContent, privacy, imageFile);
      } else {
        await postService.createPost({ Content: postContent, privacy });
      }
      setPostContent('');
      setImagePreview(null);
      setImageFile(null);
      // Silencing success toast per user request
      if (onPostSuccess) onPostSuccess();
    } catch (error) {
      toast.error(error.errorMessage || t('home.postError'));
    } finally {
      setIsPosting(false);
    }
  }, [postContent, privacy, imageFile, onPostSuccess, t]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result);
    reader.readAsDataURL(file);
  };

  const charCount = postContent.length;

  return (
    <div
      className="rounded-2xl overflow-hidden post-creator"
      style={{
        background: 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.55)',
        boxShadow: '0 4px 24px rgba(99,102,241,0.06)',
      }}
    >
      {/* Image preview */}
      {imagePreview && (
        <div className="relative w-full h-52 overflow-hidden">
          <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
          <button
            onClick={() => { setImageFile(null); setImagePreview(null); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(15,15,15,0.6)', backdropFilter: 'blur(8px)' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <Link
          to="/profile"
          className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ring-2 ring-indigo-200/60 mt-1 transition-transform hover:scale-105"
        >
          <img
            src={getFullAvatarUrl(user?.avatarUrl, user?.fullName || user?.username)}
            alt=""
            className="w-full h-full object-cover"
          />
        </Link>
        <div className="flex-1">
          <textarea
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePostSubmit();
              }
            }}
            maxLength={1000}
            placeholder={`${user?.fullName?.split(' ').pop() || 'Bạn'} ơi, bạn đang nghĩ gì vậy?`}
            rows={3}
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none text-slate-700 placeholder:text-slate-400 resize-none"
            style={{
              background: 'rgba(240,240,255,0.6)',
              border: '1.5px solid rgba(99,102,241,0.15)',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(99,102,241,0.15)'; }}
          />
          {charCount > 0 && (
            <p className="text-right text-[10px] font-medium mt-1 pr-1" style={{
              color: charCount > 900 ? '#ef4444' : charCount > 700 ? '#f59e0b' : '#cbd5e1'
            }}>
              {charCount}/1000
            </p>
          )}
        </div>
      </div>

      <div className="h-px mx-4" style={{ background: 'rgba(99,102,241,0.08)' }} />

      {/* Toolbar */}
      <div className="flex items-center px-4 py-2.5 gap-1">
        {[
          { icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Ảnh', color: '#10b981' },
          { icon: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', label: 'Video', color: '#f43f5e' },
          { icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Cảm xúc', color: '#f59e0b' },
        ].map((btn, i) => (
          i === 0 ? (
            <label
              key={i}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 cursor-pointer transition-all hover:scale-105"
              style={{ background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = `${btn.color}18`}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={btn.color} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={btn.icon} />
              </svg>
              <span className="hidden sm:inline text-sm font-semibold" style={{ color: btn.color }}>{btn.label}</span>
            </label>
          ) : (
            <button
              key={i}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 transition-all hover:scale-105"
              style={{ background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = `${btn.color}18`}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={btn.color} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={btn.icon} />
              </svg>
              <span className="hidden sm:inline text-sm font-semibold" style={{ color: btn.color }}>{btn.label}</span>
            </button>
          )
        ))}

        {/* Privacy selector */}
        <div className="ml-auto relative">
          <select
            value={privacy}
            onChange={e => setPrivacy(e.target.value)}
            className="appearance-none pl-7 pr-5 py-1.5 text-xs font-bold text-slate-600 rounded-full outline-none cursor-pointer transition-all"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <option value="Public">Công khai</option>
            <option value="Friends">Bạn bè</option>
            <option value="OnlyMe">Chỉ mình tôi</option>
          </select>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none">
            {privacy === 'Friends' ? '👥' : privacy === 'OnlyMe' ? '🔒' : '🌎'}
          </span>
        </div>

        {/* Submit */}
        <button
          onClick={handlePostSubmit}
          disabled={isPosting || !postContent.trim()}
          className="ml-2 px-5 py-2 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
          }}
        >
          {isPosting ? (
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang đăng...
            </div>
          ) : 'Đăng bài'}
        </button>
      </div>
    </div>
  );
};

export default PostCreator;
