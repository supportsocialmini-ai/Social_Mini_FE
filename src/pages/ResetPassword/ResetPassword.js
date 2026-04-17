import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import { useTranslation } from 'react-i18next';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error(t('api.Auth.Validation.PasswordsDoNotMatch'));
    }
    if (token.length !== 6) {
      return toast.warn('Mã OTP phải có 6 chữ số.');
    }

    setError('');
    setIsLoading(true);
    try {
      await authService.resetPassword(token, newPassword, confirmPassword);
      // Silencing success toast per user request
      navigate('/login');
    } catch (err) {
      const rawMsg = err.errorMessage || 'Auth.Password.ResetFail';
      const translatedMsg = t(`api.${rawMsg}`);
      toast.error(translatedMsg || 'Cập nhật mật khẩu thất bại. Mã OTP có thể hết hạn.');
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
            <Link to="/forgot-password" size="sm" className="absolute top-0 left-0 p-2 text-slate-300 hover:text-indigo-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] rounded-xl shadow-lg shadow-indigo-100 mb-4">
              <span className="text-white text-2xl font-black italic tracking-tighter">!</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-0.5">Đặt lại mật khẩu</h1>
            <p className="text-slate-400 font-medium text-xs">Nhập mã OTP và mật khẩu mới của bạn.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-[10px] mb-4 border border-red-100/50 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OTP Token */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">MÃ OTP (6 SỐ)</label>
              <div className="relative group text-center">
                <input
                  type="text"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl text-center text-3xl font-black tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white text-slate-700 placeholder:text-slate-100 transition-all"
                  required
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">MẬT KHẨU MỚI</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white text-slate-700 placeholder:text-slate-300 transition-all font-medium text-sm"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-indigo-500 transition-colors"
                    >
                        {showPassword ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">XÁC NHẬN MẬT KHẨU</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Cập nhật mật khẩu 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center px-10">
              <p className="text-[9px] text-slate-300 font-medium leading-relaxed max-w-[300px] mx-auto">
                  Vấn đề gì đó? <Link to="/forgot-password" className="text-indigo-500 font-bold hover:underline">Gửi lại mã</Link>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
