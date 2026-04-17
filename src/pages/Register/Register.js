import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
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

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const fullNameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    const usernameRegex = /^[a-z0-9_]{4,30}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,50}$/;

    if (!formData.fullName || !fullNameRegex.test(formData.fullName)) {
      setIsLoading(false);
      const msg = !formData.fullName ? t('api.FullNameRequired') : (formData.fullName.length < 2 || formData.fullName.length > 100 ? t('api.FullNameLength') : t('api.FullNameInvalid'));
      return toast.warn(msg);
    }
    if (!formData.username || !usernameRegex.test(formData.username)) {
      setIsLoading(false);
      const msg = !formData.username ? t('api.UsernameRequired') : (formData.username.length < 4 || formData.username.length > 30 ? t('api.UsernameLength') : t('api.UsernameInvalid'));
      return toast.warn(msg);
    }
    if (!formData.email || !emailRegex.test(formData.email)) {
      setIsLoading(false);
      const msg = !formData.email ? t('api.EmailRequired') : t('api.EmailInvalid');
      return toast.warn(msg);
    }
    if (!formData.password || !passwordRegex.test(formData.password)) {
      setIsLoading(false);
      const msg = !formData.password ? t('api.PasswordRequired') : (formData.password.length < 6 || formData.password.length > 50 ? t('api.PasswordLength') : t('api.PasswordInvalid'));
      return toast.warn(msg);
    }
    if (formData.password !== formData.confirmPassword) {
      setIsLoading(false);
      const msg = t('register.passwordMismatch') || 'Mật khẩu không khớp.';
      return toast.warn(msg);
    }

    setIsLoading(false);
    setIsTermsModalOpen(true);
  };

  const handleConfirmRegister = async () => {
    setIsTermsModalOpen(false);
    setIsLoading(true);

    try {
      const registerData = {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        avatarUrl: "default_avatar.png",
        isVerified: false,
        isActive: true
      };
      await authService.register(registerData);
      navigate('/login', {
        state: { username: formData.username, password: formData.password, showVerify: true }
      });
    } catch (err) {
      toast.error(t(`api.${err.errorMessage || 'Auth.Register.Fail'}`));
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ label, name, type = 'text', placeholder, showToggle, isShown, onToggle }) => (
    <div>
      <label className="block text-base font-semibold text-slate-700 mb-2">{label}</label>
      <div className="relative">
        <input
          name={name}
          type={showToggle ? (isShown ? 'text' : 'password') : type}
          placeholder={placeholder}
          onChange={handleChange}
          className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
          required
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-blue-500 transition-colors"
          >
            {isShown ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );

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
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-slate-600 text-sm font-semibold tracking-wide">Tạo tài khoản miễn phí</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 text-[3.6rem] font-extrabold text-slate-800 leading-[1.15] mb-4" style={{ letterSpacing: '-0.02em' }}>
            Tham gia<br />
            <span
              className="animate-gradient"
              style={{
                background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% auto',
              }}
            >
              cộng đồng người dùng.
            </span>
          </h1>

          <p className="animate-fade-up delay-200 text-slate-500 text-base leading-relaxed max-w-sm mb-10">
            Chỉ mất vài giây để tạo tài khoản và bắt đầu kết nối với mọi người xung quanh.
          </p>

          {/* Steps with clean icons */}
          <div className="space-y-4">
            {[
              {
                step: '01',
                title: 'Điền thông tin',
                desc: 'Tên, username, email và mật khẩu',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Xác thực email',
                desc: 'Nhập mã 6 số được gửi qua email',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Bắt đầu khám phá!',
                desc: 'Kết bạn, chat và chia sẻ ngay',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div key={f.step} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/70 border border-white/90 shadow-sm flex items-center justify-center text-violet-500 shrink-0 backdrop-blur-sm">
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
              { value: 'Free', label: 'Mãi mãi' },
              { value: '3s', label: 'Đăng ký xong' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-slate-800" style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
                <p className="text-slate-400 text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT: White Card Form ===== */}
        <div className="w-full md:w-[500px] shrink-0">
          <div className="bg-white rounded-[28px] shadow-[0_20px_60px_rgba(100,80,180,0.15)] px-10 py-9">

            {/* Mobile logo */}
            <div className="flex md:hidden items-center gap-2 mb-5">
              <span className="text-2xl font-black text-slate-800">Mini</span>
              <span className="text-xl font-black text-yellow-300 px-2 py-0.5 rounded" style={{ background: '#1a2d6b' }}>Social</span>
            </div>

            <h2 className="text-3xl font-bold text-slate-800 mb-1">Tạo tài khoản</h2>
            <p className="text-slate-400 text-base mb-6">Chỉ mất 1 phút để bắt đầu!</p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Họ và tên */}
              <div>
                <label className="block text-base font-semibold text-slate-700 mb-2">Họ và tên</label>
                <input
                  name="fullName"
                  type="text"
                  placeholder="Trần Quốc B"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
                  required
                />
              </div>

              {/* Username & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-base font-semibold text-slate-700 mb-2">Tên người dùng</label>
                  <input
                    name="username"
                    type="text"
                    placeholder="Tên người dùng"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold text-slate-700 mb-2">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="email@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-base font-semibold text-slate-700 mb-2">Mật khẩu</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-5 py-4 pr-12 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-blue-500 transition-colors">
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-base font-semibold text-slate-700 mb-2">Nhập lại mật khẩu</label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-5 py-4 pr-12 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-blue-500 transition-colors">
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 text-xs">
                Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-full font-bold text-white text-base transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 shadow-lg"
                style={{ background: 'linear-gradient(90deg, #4a7cff 0%, #3b6ef8 100%)' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo tài khoản...
                  </div>
                ) : 'Tạo tài khoản'}
              </button>
            </form>

            {/* Social login */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-slate-300 text-xs font-medium whitespace-nowrap">hoặc tiếp tục với</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button className="w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform" style={{ background: '#EA4335' }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.162-1.9 4.155C17.21 19.56 15.503 20.5 12.48 20.5c-4.87 0-8.5-3.89-8.5-8.5s3.63-8.5 8.5-8.5c2.73 0 4.723 1.06 6.13 2.4l2.35-2.35C18.66 1.35 15.84 0 12.48 0 5.86 0 .3 5.39.3 12s5.56 12 12.18 12c3.56 0 6.25-1.17 8.35-3.35C22.95 18.51 23.6 15.54 23.6 13.19c0-.73-.06-1.41-.18-2.27H12.48z" />
                </svg>
              </button>
              <button className="w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform" style={{ background: '#0A66C2' }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
              <button className="w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform" style={{ background: '#1877F2' }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
              <button className="w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform bg-[#24292e]">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </button>
            </div>

            {/* Login link */}
            <p className="mt-5 text-center text-slate-400 text-sm">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-blue-500 hover:text-blue-600 hover:underline transition-colors">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>

        {/* Terms of Service Modal */}
        {isTermsModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalScaleUp {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
          `}</style>

            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              style={{ animation: 'modalFadeIn 0.3s ease-out forwards' }}
              onClick={() => setIsTermsModalOpen(false)}
            />

            {/* Modal Container */}
            <div
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.25)] flex flex-col max-h-[85vh] overflow-hidden"
              style={{ animation: 'modalScaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">ĐIỀU KHOẢN SỬ DỤNG</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
                <button
                  onClick={() => setIsTermsModalOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p className="font-semibold text-slate-800">
                    Chào mừng bạn đến với MiniSocial – nền tảng mạng xã hội mini cho phép người dùng kết nối, chia sẻ và tương tác.
                  </p>
                  <p className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl text-sm italic">
                    Khi truy cập hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản dưới đây.
                  </p>

                  <section className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">1. Điều kiện sử dụng</h4>
                    <ul className="list-disc ml-5 space-y-1 text-sm">
                      <li>Bạn phải từ 13 tuổi trở lên để sử dụng dịch vụ.</li>
                      <li>Bạn chịu trách nhiệm về tài khoản của mình (email, mật khẩu).</li>
                      <li>Không được mạo danh người khác hoặc cung cấp thông tin sai lệch.</li>
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">2. Tài khoản người dùng</h4>
                    <p className="text-sm">Bạn cần đăng ký tài khoản để sử dụng đầy đủ chức năng. Bạn phải giữ bảo mật thông tin đăng nhập. Chúng tôi có quyền tạm khóa hoặc xóa tài khoản nếu phát hiện vi phạm.</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">3. Nội dung người dùng</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <p className="font-bold text-xs text-slate-400 uppercase tracking-widest">Nghĩa vụ</p>
                      <p className="text-sm">Bạn chịu trách nhiệm với nội dung bạn đăng tải, bao gồm: Bài viết, hình ảnh, video, bình luận.</p>
                      <p className="font-bold text-xs text-red-400 uppercase tracking-widest mt-4">Hành vi bị cấm</p>
                      <ul className="list-disc ml-5 space-y-1 text-sm text-red-500/80">
                        <li>Nội dung vi phạm pháp luật</li>
                        <li>Nội dung xúc phạm, thù địch</li>
                        <li>Spam, quảng cáo trái phép</li>
                        <li>Nội dung xâm phạm quyền riêng tư</li>
                      </ul>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">4. Quyền riêng tư</h4>
                    <p className="text-sm">Chúng tôi thu thập và xử lý dữ liệu theo Chính sách bảo mật. Không chia sẻ dữ liệu cá nhân cho bên thứ ba nếu không có sự đồng ý (trừ khi pháp luật yêu cầu).</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">5. Quyền và nghĩa vụ hệ thống</h4>
                    <p className="text-sm">Chúng tôi có quyền: Thay đổi, nâng cấp hệ thống; Tạm ngưng dịch vụ để bảo trì; Xóa nội dung hoặc tài khoản vi phạm.</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">6. Hành vi bị cấm</h4>
                    <p className="text-sm text-red-600 font-medium">Bạn không được: Tấn công hệ thống (hack, DDOS, exploit); Thu thập dữ liệu trái phép; Sử dụng bot spam; Phát tán mã độc.</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">7. Quyền sở hữu</h4>
                    <p className="text-sm">Bạn giữ quyền sở hữu nội dung của mình. Khi đăng tải, bạn cấp cho chúng tôi quyền sử dụng nội dung đó để vận hành hệ thống.</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">8. Giới hạn trách nhiệm</h4>
                    <p className="text-sm">Chúng tôi không chịu trách nhiệm với nội dung do người dùng đăng. Không đảm bảo dịch vụ luôn hoạt động liên tục, không lỗi.</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">9. Thay đổi điều khoản</h4>
                    <p className="text-sm">Điều khoản có thể được cập nhật bất kỳ lúc nào. Việc tiếp tục sử dụng đồng nghĩa bạn chấp nhận thay đổi.</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">10. Liên hệ</h4>
                    <p className="text-sm">Nếu có thắc mắc, vui lòng liên hệ Email: <span className="font-bold text-indigo-500">support.socialmini@gmail.com</span></p>
                  </section>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(false)}
                  className="flex-1 py-4 px-6 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all active:scale-[0.98]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRegister}
                  className="flex-[2] py-4 px-6 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                >
                  Chấp nhận và Đăng ký
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default Register;