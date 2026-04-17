import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import postService from '../../services/postService';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const PrivacyIcon = ({ privacy, className = "h-3.5 w-3.5" }) => {
  if (privacy === 'Friends') return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  if (privacy === 'OnlyMe') return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

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
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const privacyRef = useRef(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (privacyRef.current && !privacyRef.current.contains(event.target)) {
        setIsPrivacyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      className="rounded-2xl overflow-visible post-creator relative"
      style={{
        background: 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.55)',
        boxShadow: '0 4px 24px rgba(99,102,241,0.06)',
        zIndex: isPrivacyOpen ? 1000 : 1,
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
        <div className="ml-auto relative" ref={privacyRef}>
          <button
            onClick={() => setIsPrivacyOpen(!isPrivacyOpen)}
            className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 text-xs font-bold text-slate-600 rounded-full outline-none cursor-pointer transition-all hover:bg-slate-100 active:scale-95"
            style={{ 
              background: 'rgba(99,102,241,0.08)', 
              border: `1.5px solid ${isPrivacyOpen ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.15)'}` 
            }}
          >
            <span className="text-indigo-500">
              <PrivacyIcon privacy={privacy} className="w-3.5 h-3.5" />
            </span>
            <span>{privacy === 'Friends' ? 'Bạn bè' : privacy === 'OnlyMe' ? 'Chỉ mình tôi' : 'Công khai'}</span>
            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isPrivacyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Custom Dropdown Menu */}
          <div 
            className="absolute top-full right-0 mt-1 z-50 rounded-2xl overflow-hidden min-w-[160px] py-1.5 transition-all duration-200 shadow-[0_15px_35px_-5px_rgba(99,102,241,0.3)] border border-slate-100"
            style={{
              backgroundColor: '#ffffff',
              backdropFilter: 'none',
              opacity: isPrivacyOpen ? 1 : 0,
              transform: isPrivacyOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
              pointerEvents: isPrivacyOpen ? 'auto' : 'none',
              transformOrigin: 'top right',
            }}
          >
            {[
              { key: 'Public', label: 'Công khai' },
              { key: 'Friends', label: 'Bạn bè' },
              { key: 'OnlyMe', label: 'Chỉ mình tôi' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => { setPrivacy(p.key); setIsPrivacyOpen(false); }}
                className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 transition-all hover:bg-slate-50"
                style={{ color: privacy === p.key ? '#6366f1' : '#64748b' }}
              >
                <div className={privacy === p.key ? 'text-indigo-500' : 'text-slate-400'}>
                  <PrivacyIcon privacy={p.key} className="w-4 h-4" />
                </div>
                <span className="flex-1">{p.label}</span>
                {privacy === p.key && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                )}
              </button>
            ))}
          </div>
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
