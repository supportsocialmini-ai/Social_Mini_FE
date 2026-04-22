import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Home, Zap, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUserData } = useAuth();
  const status = searchParams.get('status');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshProfile = async () => {
      if (status === 'success') {
        try {
          // Lấy lại thông tin profile mới nhất (đã có Subscription)
          const newUserData = await userService.getProfile();
          updateUserData(newUserData);
        } catch (err) {
          console.error("Lỗi cập nhật profile sau thanh toán:", err);
        }
      }
      setLoading(false);
    };

    refreshProfile();
  }, [status, updateUserData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           <p className="font-bold text-slate-600 animate-pulse">Đang xác thực giao dịch...</p>
        </div>
      </div>
    );
  }

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500">
        <div className={`p-12 text-center ${isSuccess ? 'bg-indigo-600' : 'bg-rose-600'} text-white`}>
           <div className="flex justify-center mb-6">
              {isSuccess ? (
                <div className="relative">
                   <CheckCircle className="w-24 h-24" />
                   <Crown className="absolute -top-4 -right-4 w-12 h-12 text-amber-400 rotate-12 fill-current animate-bounce" />
                </div>
              ) : (
                <XCircle className="w-24 h-24" />
              )}
           </div>
           <h1 className="text-4xl font-black mb-2">
             {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
           </h1>
           <p className="text-white/70 font-medium italic">
             {isSuccess 
               ? 'Chúc mừng bạn đã chính thức trở thành hội viên Premium.' 
               : 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại sau.'}
           </p>
        </div>

        <div className="p-12 space-y-8">
           {isSuccess ? (
             <div className="space-y-6">
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 italic text-indigo-700 font-medium">
                   "Hữu Duyên thiên lý năng tương ngộ." - Mọi tính năng cao cấp cho Random Chat hiện đã được mở khóa dành riêng cho bạn!
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Thời hạn</p>
                      <p className="font-black text-slate-900">+30 Ngày VIP</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cấp độ</p>
                      <p className="font-black text-amber-500">PREMIUM</p>
                   </div>
                </div>
             </div>
           ) : (
             <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 text-rose-700 font-medium text-center">
                Mã lỗi: {searchParams.get('code') || 'Hủy bỏ'} <br/>
                Nếu bạn đã bị trừ tiền, hãy liên hệ hỗ trợ để được kiểm tra.
             </div>
           )}

           <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/chat-random')}
                className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                  isSuccess ? 'bg-slate-900 hover:bg-slate-800' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSuccess ? <Zap className="w-5 h-5 fill-current text-indigo-400" /> : <Home className="w-5 h-5" />}
                {isSuccess ? 'Trải nghiệm Premium ngay' : 'Quay lại trang chủ'}
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Về trang chủ
              </button>
           </div>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 font-bold text-sm tracking-widest uppercase">
        © 2026 MINISOCIAL SECURITY PAYMENT
      </p>
    </div>
  );
};

export default PaymentResult;
