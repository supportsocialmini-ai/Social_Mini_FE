import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

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
      toast.success(t('api.Auth.Register.Success'));
      navigate('/login', {
        state: { username: formData.username, password: formData.password, showVerify: true }
      });
    } catch (err) {
      toast.error(t(`api.${err.errorMessage || 'Auth.Register.Fail'}`));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#fcfdfe] relative overflow-hidden px-4 font-sans text-slate-900">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-100/30 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[520px] z-10 relative">
        <div className="bg-white p-5 md:p-7 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-50 relative">
          
          <div className="text-center mb-5 relative">
            <div className="absolute -top-1 -right-1">
                <span className="px-2 py-0.5 bg-slate-50 text-[9px] font-bold text-slate-400 rounded-full border border-slate-100/50">v1.0</span>
            </div>
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] rounded-xl shadow-lg shadow-indigo-100 mb-2">
              <span className="text-white text-xl font-black italic tracking-tighter">S</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">MiniSocial</h1>
            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-widest mt-0.5">Bắt đầu hành trình của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Họ và tên */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">HỌ VÀ TÊN</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  name="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white text-slate-700 placeholder:text-slate-300 transition-all font-medium text-xs"
                  required
                />
              </div>
            </div>

            {/* Username & Email Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">USERNAME</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                  <input
                    name="username"
                    type="text"
                    placeholder="username"
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white text-slate-700 placeholder:text-slate-300 transition-all font-medium text-xs"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">EMAIL</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white text-slate-700 placeholder:text-slate-300 transition-all font-medium text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Passwords Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">MẬT KHẨU</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white text-slate-700 placeholder:text-slate-300 transition-all font-medium text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-indigo-500 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 whitespace-nowrap">NHẬP LẠI</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••"
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white text-slate-700 placeholder:text-slate-300 transition-all font-medium text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-indigo-500 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-xl py-3 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 mt-1"
            >
              <span className="relative flex items-center justify-center gap-2 text-xs">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Tạo tài khoản 
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-[8px] font-black text-slate-200 uppercase tracking-[0.2em] whitespace-nowrap">Tiếp tục với</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <button className="flex items-center justify-center p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.162-1.9 4.155C17.21 19.56 15.503 20.5 12.48 20.5c-4.87 0-8.5-3.89-8.5-8.5s3.63-8.5 8.5-8.5c2.73 0 4.723 1.06 6.13 2.4l2.35-2.35C18.66 1.35 15.84 0 12.48 0 5.86 0 .3 5.39.3 12s5.56 12 12.18 12c3.56 0 6.25-1.17 8.35-3.35C22.95 18.51 23.6 15.54 23.6 13.19c0-.73-.06-1.41-.18-2.27H12.48z"/>
              </svg>
            </button>
            <button className="flex items-center justify-center p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </button>
            <button className="flex items-center justify-center p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
            <p className="text-slate-400 text-[10px] font-medium">
              Đã có tài khoản? 
              <Link to="/login" className="ml-1 text-indigo-600 font-bold hover:underline">
                Đăng nhập
              </Link>
            </p>
        </div>

        <div className="mt-4 text-center px-10">
            <p className="text-[8px] text-slate-300 font-medium leading-relaxed">
                Tiếp tục đồng nghĩa với việc bạn chấp nhận Điều khoản và Chính sách của MiniSocial.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;