import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success(t('api.Auth.Password.ForgotEmailSent'));
      setIsSuccess(true);
      // Wait a bit and navigate to reset password page
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 2000);
    } catch (err) {
      const rawMsg = err.errorMessage || 'Auth.Password.ForgotFail';
      const translatedMsg = t(`api.${rawMsg}`);
      toast.error(translatedMsg);
      setError(translatedMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#fcfdfe] relative overflow-hidden px-4 font-sans text-slate-900">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-100/40 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[460px] z-10 relative">
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-50 relative">
          
          <div className="text-center mb-6 relative">
            <Link to="/login" className="absolute top-0 left-0 p-2 text-slate-300 hover:text-indigo-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] rounded-xl shadow-lg shadow-indigo-100 mb-4">
              <span className="text-white text-2xl font-black italic tracking-tighter">?</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-0.5">Quên mật khẩu</h1>
            <p className="text-slate-400 font-medium text-xs">Nhập email của bạn để nhận mã khôi phục.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-[10px] mb-4 border border-red-100/50 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          {isSuccess ? (
            <div className="bg-green-50 text-green-600 p-6 rounded-2xl border border-green-100 text-center animate-in fade-in zoom-in duration-300">
               <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
               </div>
               <h4 className="font-bold mb-1">Đã gửi email!</h4>
               <p className="text-xs opacity-80">Vui lòng kiểm tra hòm thư của bạn để lấy mã OTP.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">ĐỊA CHỈ EMAIL</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white text-slate-700 placeholder:text-slate-300 transition-all font-medium text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-xl py-4 font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 mt-2"
              >
                <span className="relative flex items-center justify-center gap-2 text-sm">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Gửi mã xác nhận 
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>
          )}

          <div className="mt-8 text-center px-10">
              <p className="text-[9px] text-slate-300 font-medium leading-relaxed max-w-[300px] mx-auto">
                  Quay lại trang <Link to="/login" className="text-indigo-500 font-bold hover:underline">Đăng nhập</Link>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
