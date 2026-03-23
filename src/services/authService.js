import axiosClient from '../api/axiosClient';

const authService = {
  register: (userData) => {
    // Gửi request đến /api/Auth/register
    return axiosClient.post('api/auth/register', userData);
  },
  login: (credentials) => {
    // Chuyển sang gửi JSON body thay vì Query Params để khớp với LoginRequest DTO
    return axiosClient.post('api/auth/login', {
      username: credentials.username,
      password: credentials.password
    });
  },
  changePassword: (oldPassword, newPassword) => {
    return axiosClient.post('api/auth/change-password', {
      oldPassword,
      newPassword
    });
  },
  verifyPassword: (password) => {
    return axiosClient.post('api/auth/verify-password', {
      password
    });
  },
  verifyEmail: (token) => {
    return axiosClient.post(`api/auth/verify-email?token=${token}`);
  }
};

export default authService;