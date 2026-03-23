import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      toast.success('Chào mừng bạn quay trở lại!');
      navigate('/'); // Chuyển hướng về trang chủ sau khi đăng nhập thành công
    } catch (err) {
      const msg = err.errorMessage || 'Đăng nhập thất bại. Vui lòng thử lại.';
      if (msg === 'USER_NOT_VERIFIED' || msg.includes('chưa được kích hoạt')) {
        setIsVerifyModalOpen(true);
        toast.info('Tài khoản của bạn chưa được xác nhận. Vui lòng nhập mã 6 chữ số để kích hoạt.');
      } else {
        toast.error(msg);
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!verifyToken || verifyToken.length !== 6) {
      return toast.warn('Vui lòng nhập mã xác nhận 6 chữ số.');
    }

    setIsVerifying(true);
    try {
      await authService.verifyEmail(verifyToken);
      toast.success('Xác nhận thành công! Bây giờ bạn có thể đăng nhập.');
      setIsVerifyModalOpen(false);
      setVerifyToken('');
      setError('');
    } catch (err) {
      toast.error(err.errorMessage || 'Mã xác nhận không đúng hoặc đã hết hạn.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden px-4">
      {/* Các khối màu trang trí nền (Decorations) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/50 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/50 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-[450px] z-10">
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200 mb-4 transform -rotate-6">
              <span className="text-white text-3xl font-bold">M</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Chào mừng trở lại</h2>
            <p className="text-slate-500 mt-2 font-medium">Vui lòng đăng nhập vào tài khoản của bạn</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-6 border border-red-100 flex items-center gap-3 animate-shake">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Ghi nhớ tôi</span>
              </label>
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Quên mật khẩu?</a>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <span>{isLoading ? 'Đang xử lý...' : 'Đăng nhập'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-600 font-medium">
              Chưa có tài khoản? 
              <Link to="/register" className="ml-2 text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all">
                Tạo tài khoản mới
              </Link>
            </p>
          </div>
        </div>
        
        {/* Footer links */}
        <div className="mt-8 flex justify-center gap-6 text-slate-400 text-xs font-medium uppercase tracking-widest">
          <a href="#" className="hover:text-slate-600 transition-colors">Chính sách</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Điều khoản</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Hỗ trợ</a>
        </div>
      </div>

      {/* Verification Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-200/50 border border-white animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Xác nhận tài khoản</h3>
              <p className="text-slate-500 font-medium px-4">Chúng tôi đã gửi mã 6 chữ số đến email của bạn.</p>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-6">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Nhập mã 6 chữ số"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  maxLength={6}
                  required
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300 placeholder:text-sm placeholder:tracking-normal placeholder:font-medium"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="flex-1 px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-[0.98]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-[2] px-4 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                >
                  {isVerifying ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Xác nhận ngay'
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-slate-400 mt-4">
                Không nhận được mã? <button type="button" className="text-indigo-600 font-bold hover:underline">Gửi lại (Soon)</button>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;