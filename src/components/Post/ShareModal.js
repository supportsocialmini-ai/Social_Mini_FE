import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import postService from '../../services/postService';
import { Globe, Users, Lock, Share2, X } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, post, onShareSuccess }) => {
  const { user, getFullAvatarUrl } = useAuth();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('Public');
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await postService.sharePost(post.postId, {
        content: content.trim(),
        privacy: privacy
      });
      toast.success('Đã chia sẻ bài viết thành công!');
      onShareSuccess();
      onClose();
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Có lỗi xảy ra khi chia sẻ bài viết.');
    } finally {
      setIsSharing(false);
    }
  };

  const getPrivacyIcon = (p) => {
    switch (p) {
      case 'Public': return <Globe size={12} />;
      case 'Friends': return <Users size={12} />;
      case 'Private': return <Lock size={12} />;
      default: return <Globe size={12} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Share2 className="text-indigo-600" size={20} />
            Chia sẻ bài viết
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all duration-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={getFullAvatarUrl(user?.avatarUrl, user?.fullName)} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border-2 border-indigo-100"
            />
            <div>
              <p className="font-bold text-slate-800">{user?.fullName}</p>
              <div className="relative inline-block mt-1">
                <select 
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="appearance-none bg-slate-100/80 text-[10px] pl-6 pr-6 py-1 rounded-full font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer outline-none border-none"
                >
                  <option value="Public">Công khai</option>
                  <option value="Friends">Bạn bè</option>
                  <option value="Private">Chỉ mình tôi</option>
                </select>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">
                  {getPrivacyIcon(privacy)}
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <textarea
            autoFocus
            placeholder="Bạn đang nghĩ gì về bài viết này?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[100px] bg-transparent text-slate-700 placeholder-slate-400 border-none focus:ring-0 resize-none text-lg mb-4"
          />

          {/* Original Post Preview */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <img 
                src={getFullAvatarUrl(post.avatarUrl, post.fullName)} 
                alt="Author" 
                className="w-6 h-6 rounded-full"
              />
              <span className="font-bold text-sm text-slate-700">{post.fullName}</span>
            </div>
            {post.postContent && (
              <p className="text-sm text-slate-600 line-clamp-3">{post.postContent}</p>
            )}
            {post.imageUrl && (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100">
                <img 
                  src={getFullAvatarUrl(post.imageUrl)} 
                  alt="Post Image" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 flex items-center justify-end gap-3 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-2xl font-bold text-slate-500 hover:bg-white transition-all active:scale-95"
          >
            Hủy
          </button>
          <button 
            disabled={isSharing}
            onClick={handleShare}
            className={`px-8 py-2 rounded-2xl font-bold text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 ${
              isSharing ? 'bg-indigo-400 cursor-wait' : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:shadow-indigo-300'
            }`}
          >
            {isSharing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Đang chia sẻ...
              </>
            ) : (
              <>
                <Share2 size={18} />
                Chia sẻ ngay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
