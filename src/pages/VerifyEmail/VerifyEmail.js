import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // idle, verifying, success, error
  const [message, setMessage] = useState('');
  const [inputToken, setInputToken] = useState('');
  const tokenFromUrl = searchParams.get('token');
  const navigate = useNavigate();

  const verifyToken = async (tokenToVerify) => {
    if (!tokenToVerify) {
      setStatus('idle');
      setMessage('Vui lòng nhập mã xác nhận 6 chữ số từ email của bạn.');
      return;
    }

    setStatus('verifying');
    try {
      const response = await axiosClient.post(`api/auth/verify-email?token=${tokenToVerify}`);
      setStatus('success');
      setMessage(response || 'Xác nhận tài khoản thành công! Bây giờ bạn có thể đăng nhập.');
      toast.success(response || 'Xác nhận thành công!');
    } catch (err) {
      setStatus('error');
      const msg = err.errorMessage || 'Xác nhận thất bại. Mã có thể đã hết hạn hoặc không đúng.';
      setMessage(msg);
      toast.error(msg);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    } else {
      setStatus('idle');
    }
  }, [tokenFromUrl]);

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (inputToken.length !== 6) {
      toast.warning('Mã xác nhận phải có đúng 6 chữ số!');
      return;
    }
    verifyToken(inputToken);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center ring-1 ring-black/5">
        
        {/* Header decoration */}
        <div className="mb-6">
            <div className="w-16 h-1 w-12 bg-indigo-600 rounded-full mx-auto mb-4"></div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Kích hoạt tài khoản</h1>
        </div>

        {status === 'verifying' && (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-bold text-gray-800">Đang kiểm tra mã...</h2>
            <p className="text-gray-500 text-sm">Vui lòng chờ trong giây lát.</p>
          </div>
        )}

        {status === 'idle' && (
          <div className="space-y-6 py-4">
            <p className="text-gray-600 font-medium">
                Vui lòng kiểm tra email để nhấn vào link xác nhận hoặc nhập mã 6 chữ số bên dưới.
            </p>
            <form onSubmit={handleManualVerify} className="space-y-4">
              <input
                type="text"
                maxLength="6"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập mã 6 chữ số"
                className="w-full px-6 py-4 text-center text-3xl font-bold tracking-[0.5em] bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-gray-300 placeholder:tracking-normal placeholder:text-base"
              />
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Xác nhận ngay
              </button>
            </form>
            <div className="pt-4 border-t border-gray-50">
                <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors">
                    Hủy và quay lại Đăng nhập
                </Link>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto ring-4 ring-green-100/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-700">Tuyệt vời!</h2>
              <p className="text-gray-600">{message}</p>
            </div>
            <Link
              to="/login"
              className="block w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-200 active:scale-95"
            >
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto ring-4 ring-red-100/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-red-700">Xác nhận thất bại</h2>
              <p className="text-gray-600">{message}</p>
            </div>
            <button
              onClick={() => { setStatus('idle'); setInputToken(''); }}
              className="w-full py-4 bg-gray-800 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
            >
              Thử nhập lại mã khác
            </button>
            <div className="pt-2">
                <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-indigo-600">
                    Quay lại trang Đăng nhập
                </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
