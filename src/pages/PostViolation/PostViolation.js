import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Shield, ArrowLeft, AlertTriangle, Clock, Send } from 'lucide-react';
import Navbar from '../../components/Layout/Navbar';
import postService from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

const PostViolation = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getFullAvatarUrl, user } = useAuth();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appealText, setAppealText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        const res = await postService.getPostById(postId);
        // axiosClient đã giải nén result của ApiResponse DTO
        const postData = res?.result || res;
        setPost(postData);
        if (postData?.isAppealed) {
          setAppealSuccess(true);
        }
      } catch (err) {
        toast.error("Không thể lấy chi tiết thông tin bài viết này.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostDetails();
    }
  }, [postId]);

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealText.trim()) {
      toast.warn("Vui lòng nhập lý do giải trình chi tiết!");
      return;
    }

    setSubmitting(true);
    try {
      await postService.appealPost(postId, appealText.trim());
      setAppealSuccess(true);
      toast.success("Kháng nghị của bạn đã được gửi thành công. Ban quản trị sẽ sớm xem xét!");
    } catch (err) {
      toast.error(err.errorMessage || "Gửi kháng nghị thất bại. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Đang tải dữ liệu bài viết...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 max-w-md mx-auto px-6 text-center">
          <div className="p-4 rounded-3xl bg-rose-50 text-rose-500">
            <AlertTriangle size={36} />
          </div>
          <h2 className="text-xl font-black text-slate-800">Không tìm thấy bài viết</h2>
          <p className="text-sm text-slate-500 font-medium">Bài viết không tồn tại hoặc bạn không có quyền truy cập vào nội dung bị khóa này.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 hover:bg-slate-800"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const authorName = post.fullName || post.FullName || "Thành viên";

  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    const apiBase = axiosClient.defaults.baseURL || process.env.REACT_APP_API_URL || '';
    const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    return `${cleanBase}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fe] flex flex-col pb-16">
      <Navbar />
      
      <div className="max-w-xl mx-auto w-full px-4 mt-8 flex flex-col gap-6">
        {/* Back navigation */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 self-start text-xs font-black uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
 
        {/* Violation alert banner */}
        <div className="p-6 rounded-[2.5rem] bg-rose-50 border border-rose-200/50 flex items-start gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 flex-shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-base font-black text-rose-900 leading-snug">Bài viết của bạn đã bị ẩn do vi phạm tiêu chuẩn cộng đồng</h2>
            <p className="text-sm text-rose-700 font-bold mt-2 bg-white/70 px-4 py-2.5 rounded-xl border border-rose-100 inline-block">
              Lý do vi phạm: {post.violationReason || "Nội dung không phù hợp chính sách"}
            </p>
          </div>
        </div>
 
        {/* Post preview details */}
        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col gap-5 text-left">
          {/* Author header */}
          <div className="flex items-center gap-3">
            <img 
              src={getFullAvatarUrl(post.avatarUrl || post.authorAvatar, authorName)}
              alt={authorName} 
              className="w-10 h-10 rounded-full border border-slate-100 object-cover"
            />
            <div>
              <h4 className="text-sm font-black text-slate-800 leading-none mb-1">{authorName}</h4>
              <p className="text-[10px] text-slate-400 font-bold">
                {new Date(post.createdAt || post.time).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
 
          {/* Post content */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
              {post.postContent}
            </p>
            {post.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-80 bg-slate-50">
                <img 
                  src={getFullImageUrl(post.imageUrl)} 
                  alt="" 
                  className="w-full h-full object-cover max-h-80"
                />
              </div>
            )}
          </div>
        </div>

        {/* Appeal Form Section */}
        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-left">
          {appealSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center animate-pulse">
                <Clock size={24} />
              </div>
              <h3 className="text-base font-black text-slate-800">Đã gửi yêu cầu kháng nghị</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm">
                Bạn đã gửi giải trình kháng nghị cho bài viết này. Yêu cầu đang nằm trong danh sách xét duyệt của ban quản trị.
              </p>
              {post.appealReason && (
                <div className="mt-2 w-full p-4 rounded-2xl bg-slate-50 border border-slate-100/50 text-xs italic text-slate-600 font-medium">
                  " {post.appealReason} "
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleAppealSubmit} className="space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Gửi kháng nghị gỡ ẩn bài viết</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Giải trình lý do bạn cho rằng có sự nhầm lẫn</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nội dung giải trình chi tiết</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Vui lòng nhập lý do chi tiết tại sao bài viết này không vi phạm tiêu chuẩn cộng đồng (ví dụ: đây là thông tin học thuật, chia sẻ hữu ích, không có mục đích xấu...)"
                  value={appealText}
                  onChange={(e) => setAppealText(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-medium text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none placeholder-slate-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                >
                  <Send size={14} />
                  {submitting ? "Đang gửi..." : "Gửi yêu cầu kháng nghị"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                  Trang chủ
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostViolation;
