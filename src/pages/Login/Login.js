import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import { useTranslation } from 'react-i18next';

const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
);

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
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #ede8fb 0%, #f3dff2 25%, #dde8f8 60%, #e8e0f8 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-fade-up {
          animation: fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradientFlow 5s ease infinite;
        }
      `}</style>

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-purple-300/30 blur-[80px]" style={{ transform: 'translate(-40%, -40%)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-pink-300/25 blur-[100px]" style={{ transform: 'translate(30%, 30%)' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-blue-300/20 blur-[80px]" style={{ transform: 'translate(-80%, -30%)' }} />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-violet-300/20 blur-[60px]" />

      {/* Main layout */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-10 flex items-center justify-between gap-10">

        {/* ===== LEFT: Branding ===== */}
        <div className="hidden md:flex flex-col justify-center flex-1 pr-8">
          {/* Tag */}
          <div className="animate-fade-up inline-flex items-center gap-2 bg-white/50 border border-white/80 rounded-full px-4 py-1.5 mb-6 w-fit backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-600 text-sm font-semibold tracking-wide">MiniSocial Network</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 text-[3.6rem] font-extrabold text-slate-800 leading-[1.15] mb-4" style={{ letterSpacing: '-0.02em' }}>
            Kết nối bạn bè,<br />
            <span
              className="animate-gradient"
              style={{
                background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% auto',
              }}
            >
              chia sẻ khoảnh khắc.
            </span>
          </h1>

          <p className="animate-fade-up delay-200 text-slate-500 text-base leading-relaxed max-w-sm mb-10">
            Nền tảng mạng xã hội nhỏ gọn — nơi bạn có thể chat, đăng bài và kết nối với mọi người trong tích tắc.
          </p>

          {/* Feature list with SVG icons */}
          <div className="space-y-4">
            {[
              {
                title: 'Chat thời gian thực',
                desc: 'Nhắn tin, gửi ảnh tức thì qua SignalR',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
              },
              {
                title: 'Kết bạn dễ dàng',
                desc: 'Gửi, chấp nhận lời mời trong một nốt nhạc',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                title: 'Đăng bài & tương tác',
                desc: 'Like, bình luận, reply thoải mái',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/70 border border-white/90 shadow-sm flex items-center justify-center text-indigo-500 shrink-0 backdrop-blur-sm">
                  {f.icon}
                </div>
                <div>
                  <p className="text-slate-800 font-semibold text-sm">{f.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-10 flex gap-8">
            {[
              { value: '10K+', label: 'Người dùng' },
              { value: '50K+', label: 'Bài đăng' },
              { value: '99%', label: 'Uptime' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-slate-800" style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
                <p className="text-slate-400 text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT: White Card Form ===== */}
        <div className="w-full md:w-[480px] shrink-0">
          <div className="bg-white rounded-[28px] shadow-[0_20px_60px_rgba(100,80,180,0.15)] px-10 py-12">

            {/* Mobile logo */}
            <div className="flex md:hidden items-center gap-2 mb-6">
              <span className="text-2xl font-black text-slate-800">Mini</span>
              <span className="text-xl font-black text-yellow-300 px-2 py-0.5 rounded" style={{ background: '#1a2d6b' }}>Social</span>
            </div>

            <h2 className="text-3xl font-bold text-slate-800 mb-1">Chào mừng trở lại!</h2>
            <p className="text-slate-400 text-base mb-8">Đăng nhập để tiếp tục hành trình của bạn.</p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-5 border border-red-100">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">Tên đăng nhập</label>
                <input
                  type="text"
                  placeholder="Tên người dùng"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 pr-14 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-blue-500 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link to="/forgot-password" className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline transition-colors">
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-full font-bold text-white text-base transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 shadow-lg"
                style={{ background: 'linear-gradient(90deg, #4a7cff 0%, #3b6ef8 100%)' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đăng nhập...
                  </div>
                ) : 'Đăng nhập'}
              </button>
            </form>

            {/* Social login */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-slate-300 text-xs font-medium whitespace-nowrap">hoặc tiếp tục với</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              {/* Google */}
              <button className="w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform" style={{ background: '#EA4335' }}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.162-1.9 4.155C17.21 19.56 15.503 20.5 12.48 20.5c-4.87 0-8.5-3.89-8.5-8.5s3.63-8.5 8.5-8.5c2.73 0 4.723 1.06 6.13 2.4l2.35-2.35C18.66 1.35 15.84 0 12.48 0 5.86 0 .3 5.39.3 12s5.56 12 12.18 12c3.56 0 6.25-1.17 8.35-3.35C22.95 18.51 23.6 15.54 23.6 13.19c0-.73-.06-1.41-.18-2.27H12.48z" />
                </svg>
              </button>
              {/* LinkedIn */}
              <button className="w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform" style={{ background: '#0A66C2' }}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
              {/* Facebook */}
              <button className="w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform" style={{ background: '#1877F2' }}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
              {/* GitHub */}
              <button className="w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform bg-[#24292e]">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </button>
            </div>

            {/* Register link */}
            <p className="mt-6 text-center text-slate-400 text-sm">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold text-blue-500 hover:text-blue-600 hover:underline transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ===== Verification Modal ===== */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl mb-4">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Xác thực tài khoản</h3>
              <p className="text-slate-400 text-sm">Nhập mã 6 số đã được gửi đến email của bạn.</p>
            </div>
            <form onSubmit={handleVerifyEmail} className="space-y-5">
              <input
                type="text"
                placeholder="000000"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                maxLength={6}
                required
                className="w-full px-4 py-4 rounded-xl border border-slate-200 text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 text-slate-700 placeholder:text-slate-200 transition-all"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-[2] py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(90deg, #4a7cff 0%, #3b6ef8 100%)' }}
                >
                  {isVerifying ? 'Đang xử lý...' : 'Xác nhận'}
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