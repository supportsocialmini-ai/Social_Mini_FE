import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/` : 'https://social-mini-app.onrender.com/',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request for debugging 400 errors
    if (config.url?.includes('auth/login')) {
      console.log("LOGGING LOGIN REQUEST:", config.url, config.data);
    }

    // Handle FormData - don't set Content-Type so axios can set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => {
    // Nếu response có cấu trúc ApiResponse (có field success)
    if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'success')) {
      return response.data.result;
    }
    return response.data;
  },
  (error) => {
    // Lấy message lỗi từ ApiResponse nếu có
    const errorMessage = error.response?.data?.error || error.message;

    // Đính kèm message vào error object để các service dễ lấy
    error.errorMessage = errorMessage;

    if (error.response && error.response.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
