import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Helper toàn cục để chuẩn hóa URL ảnh
  const getFullAvatarUrl = (url, name = 'User') => {
    // Nếu không có url hoặc url là ảnh mặc định hệ thống
    if (!url || url.toLowerCase().includes('default')) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=200`;
    }

    if (url.startsWith('http')) return url;

    // Lấy link gốc của API
    const apiBase = process.env.REACT_APP_API_URL || 'https://social-mini-app.onrender.com';
    const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;

    // Loại bỏ dấu gạch chéo ở đầu nếu có
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    
    // Nếu url đã có sẵn avatars/ hoặc images/ ở đầu thì chỉ cần ghép vào
    if (cleanUrl.startsWith('avatars/') || cleanUrl.startsWith('images/')) {
      return `${cleanBase}/${cleanUrl}`;
    }

    return `${cleanBase}/avatars/${cleanUrl}`;
  };

  // Tự động lấy thông tin chi tiết nếu đã có token nhưng chưa có fullName
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('accessToken');
      if (token && (!user || !user.userId)) {
        try {
          const userData = await userService.getProfile();
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        } catch (error) {
          console.error("Lỗi lấy thông tin profile:", error);
        }
      }
    };
    fetchProfile();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login({ username, password });

      // Với ApiResponse mới, response có thể là chuỗi Token trực tiếp
      let token = typeof response === 'string' ? response : (response.token || response.accessToken || response.tokenString);

      if (token && token.startsWith('Bearer ')) {
        token = token.substring(7);
      }

      if (token) {
        localStorage.setItem('accessToken', token);

        // Lấy lại profile để đảm bảo có đầy đủ thông tin
        const userData = await userService.getProfile();
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return response;
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUserData = (newData) => {
    localStorage.setItem('user', JSON.stringify(newData));
    setUser(newData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserData, getFullAvatarUrl, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;