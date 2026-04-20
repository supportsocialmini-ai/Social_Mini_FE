import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Flag,
  MessageSquare,
  EyeOff,
  UserX,
  Send
} from 'lucide-react';
import reportService from '../../services/reportService';
import { toast } from 'react-toastify';

const ReportModal = ({ isOpen, onClose, targetId, targetType }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reportReasons = [
    { id: 'spam', label: 'Spam / Nội dung rác', icon: <MessageSquare size={18} /> },
    { id: 'harassment', label: 'Quấy rối / Đe dọa', icon: <UserX size={18} /> },
    { id: 'inappropriate', label: 'Nội dung không phù hợp', icon: <EyeOff size={18} /> },
    { id: 'violence', label: 'Bạo lực / Nguy hiểm', icon: <ShieldAlert size={18} /> },
    { id: 'other', label: 'Lý do khác', icon: <AlertTriangle size={18} /> }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Vui lòng chọn một lý do báo cáo');
      return;
    }

    setLoading(true);
    try {
      const result = await reportService.createReport({
        targetId,
        targetType,
        reason,
        description
      });
      
      // Vì axiosClient đã trả về response.data.result, nên nếu có kết quả nghĩa là thành công
      toast.success(result || 'Báo cáo của bạn đã được gửi thành công!');
      onClose();
      setReason('');
      setDescription('');
    } catch (error) {
      toast.error(error.errorMessage || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-red-500/10 to-orange-500/10">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Flag size={20} className="animate-pulse" />
            <h3 className="text-lg font-bold">Báo cáo vi phạm</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Tại sao bạn báo cáo {targetType === 'Post' ? 'bài viết' : 'người dùng'} này?
            </label>
            <div className="grid gap-2">
              {reportReasons.map((item) => (
                <label 
                  key={item.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${reason === item.label 
                      ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 shadow-md' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 bg-slate-50 dark:bg-slate-800/50'}
                  `}
                >
                  <input 
                    type="radio" 
                    name="reportReason" 
                    className="hidden"
                    onChange={() => setReason(item.label)}
                    checked={reason === item.label}
                  />
                  <div className={`${reason === item.label ? 'text-red-500' : 'text-slate-400'}`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Mô tả chi tiết (không bắt buộc)
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vui lòng cung cấp thêm thông tin để chúng tôi xử lý nhanh hơn..."
              className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:border-red-400 dark:focus:border-red-500 outline-none transition-all resize-none min-h-[100px] text-sm"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !reason}
              className={`
                flex-2 py-3 px-8 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20
                ${loading || !reason 
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:scale-[1.02] active:scale-95'}
              `}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  Gửi báo cáo
                </>
              )}
            </button>
          </div>
        </form>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 text-[11px] text-slate-500 dark:text-slate-500 text-center italic">
          Báo cáo này sẽ được quản trị viên xử lý trong thời gian sớm nhất. 
          Cảm ơn bạn đã bảo vệ cộng đồng.
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
