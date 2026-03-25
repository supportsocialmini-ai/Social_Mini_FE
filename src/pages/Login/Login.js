import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (location.state?.username) setUsername(location.state.username);
    if (location.state?.password) setPassword(location.state.password);
    if (location.state?.showVerify) setIsVerifyModalOpen(true);
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      toast.success(t('api.Auth.Login.Success'));
      navigate('/');
    } catch (err) {
      const rawMsg = err.errorMessage || 'Auth.Login.Fail';
      if (rawMsg === 'Auth.Login.UserNotVerified' || rawMsg === 'USER_NOT_VERIFIED') {
        setIsVerifyModalOpen(true);
        toast.info(t('api.Auth.Login.UserNotVerified'));
        setError(t('api.Auth.Login.UserNotVerified'));
      } else {
        const translatedMsg = t(`api.${rawMsg}`);
        toast.error(translatedMsg);
        setError(translatedMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!verifyToken || verifyToken.length !== 6) return toast.warn('Vui lòng nhập mã 6 số.');
    setIsVerifying(true);
    try {
      await authService.verifyEmail(verifyToken);
      toast.success(t('api.Auth.Verify.Success'));
      setIsVerifyModalOpen(false);
      try {
        await login(username, password);
        navigate('/');
      } catch (lErr) { console.error(lErr); }
    } catch (err) {
      toast.error(t(`api.${err.errorMessage || 'Auth.Verify.Fail'}`));
    } finally { setIsVerifying(false); }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#fcfdfe] relative overflow-hidden px-4 font-sans text-slate-900">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-100/40 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[460px] z-10 relative">
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-50 relative">
          
          <div className="text-center mb-6 relative">
            <div className="absolute -top-1 -right-1">
                <span className="px-2 py-0.5 bg-slate-50 text-[10px] font-bold text-slate-400 rounded-full border border-slate-100/50">v1.0</span>
            </div>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] rounded-xl shadow-lg shadow-indigo-100 mb-4">
              <span className="text-white text-2xl font-black italic tracking-tighter">S</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-0.5">MiniSocial</h1>
            <p className="text-slate-400 font-medium text-xs">Chào mừng bạn quay trở lại!</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-[10px] mb-4 border border-red-100/50 flex items-center gap-2 animate-shake">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username only */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">TÊN ĐĂNG NHẬP</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white text-slate-700 placeholder:text-slate-300 transition-all font-medium text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">MẬT KHẨU</label>
                <Link to="/forgot-password" size="sm" className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-[0.1em] transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    Đăng nhập 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">Hoặc tiếp tục với</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <button className="flex items-center justify-center p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.162-1.9 4.155C17.21 19.56 15.503 20.5 12.48 20.5c-4.87 0-8.5-3.89-8.5-8.5s3.63-8.5 8.5-8.5c2.73 0 4.723 1.06 6.13 2.4l2.35-2.35C18.66 1.35 15.84 0 12.48 0 5.86 0 .3 5.39.3 12s5.56 12 12.18 12c3.56 0 6.25-1.17 8.35-3.35C22.95 18.51 23.6 15.54 23.6 13.19c0-.73-.06-1.41-.18-2.27H12.48z"/>
              </svg>
            </button>
            <button className="flex items-center justify-center p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </button>
            <button className="flex items-center justify-center p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
            <p className="text-slate-400 text-xs font-medium">
              Chưa có tài khoản? 
              <Link to="/register" className="ml-1 text-indigo-600 font-bold hover:underline transition-all">
                Đăng ký ngay
              </Link>
            </p>
        </div>

        <div className="mt-8 text-center px-10">
            <p className="text-[9px] text-slate-300 font-medium leading-relaxed max-w-[300px] mx-auto">
                Bằng cách tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của MiniSocial.
            </p>
        </div>
      </div>

      {/* Verification Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-3xl border border-slate-50 animate-in zoom-in-95 duration-500 relative overflow-hidden">
            <div className="text-center mb-6 relative">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Xác thực tài khoản</h3>
              <p className="text-slate-500 text-xs font-medium px-4">Đã gửi mã kích hoạt 6 số đến email của bạn.</p>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-6 relative">
              <input
                type="text"
                placeholder="000000"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                maxLength={6}
                required
                className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl text-center text-3xl font-black tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white text-slate-700 placeholder:text-slate-200"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-sm rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-[2] bg-indigo-600 text-white font-bold text-sm rounded-xl transition-all hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isVerifying ? 'Đang xử lý...' : 'Xác nhận ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;