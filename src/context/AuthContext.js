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
      if (token) {
        try {
          const userData = await userService.getProfile();
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

  const loginWithToken = async (token) => {
    if (token) {
      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
      localStorage.setItem('accessToken', token);
      try {
        const userData = await userService.getProfile();
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      } catch (error) {
        console.error("Lỗi lấy thông tin profile sau khi verify:", error);
        throw error;
      }
    }
  };

  // Helper to extract role from JWT token
  const getRoleFromToken = (token) => {
    try {
      if (!token) return null;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      // ClaimTypes.Role in C# defaults to "role" in camelCase JSON
      return payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    } catch (e) {
      return null;
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

  const userRoles = user?.userRoles?.map(ur => ur.role?.name) || [];
  const tokenRole = getRoleFromToken(localStorage.getItem('accessToken'));
  const isAdmin = userRoles.includes('Admin') || tokenRole === 'Admin' || (Array.isArray(tokenRole) && tokenRole.includes('Admin'));
  
  // Kiểm tra trạng thái Premium: Chỉ cần có ÍT NHẤT MỘT subscription đang active là được
  const isPremium = user?.subscriptions?.some(s => s.isActive) || false;
  
  // Kiểm tra xem user có tính năng cụ thể nào không (Dựa trên Feature của các gói đang active)
  const hasFeature = (featureName) => {
    if (isAdmin) return true; // Admin có mọi quyền
    if (!user?.subscriptions) return false;
    
    const featureList = user.activeFeatures || [];
    return featureList.some(f => f.toLowerCase() === featureName.toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loginWithToken, 
      updateUserData, 
      getFullAvatarUrl, 
      isAuthenticated: !!user,
      isAdmin,
      isPremium,
      hasFeature
    }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);

export default AuthProvider;