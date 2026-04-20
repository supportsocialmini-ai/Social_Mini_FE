import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { isAdmin, getFullAvatarUrl } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers()
      ]);
      setStats(statsRes);
      setUsers(usersRes);
    } catch (error) {
      toast.error('Lỗi lấy dữ liệu Admin');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const newStatus = await adminService.toggleUserStatus(userId);
      setUsers(users.map(u => u.userId === userId ? { ...u, isActive: newStatus } : u));
      toast.info(newStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
    } catch (error) {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1 font-medium">Hệ thống quản trị mạng xã hội SocialMini</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all font-bold text-slate-700 active:scale-95"
          >
            <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới dữ liệu
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Tổng thành viên" 
            value={stats?.totalUsers || 0} 
            icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            color="indigo"
          />
          <StatCard 
            title="Đang hoạt động" 
            value={stats?.activeUsers || 0} 
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            color="emerald"
          />
          <StatCard 
            title="Tổng bài viết" 
            value={stats?.totalPosts || 0} 
            icon="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            color="amber"
          />
          <StatCard 
            title="Bình luận & Phản hồi" 
            value={stats?.totalComments || 0} 
            icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            color="rose"
          />
        </div>

        {/* User Management Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Quản lý người dùng</h2>
            <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-indigo-200">
              {users.length} Users
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                  <th className="px-8 py-4">Thành viên</th>
                  <th className="px-8 py-4">Liên hệ</th>
                  <th className="px-8 py-4">Ngày tham gia</th>
                  <th className="px-8 py-4">Trạng thái</th>
                  <th className="px-8 py-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.userId} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 bg-white group-hover:scale-105 transition-transform">
                          <img src={getFullAvatarUrl(user.avatarUrl, user.fullName)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm truncate max-w-[120px]">{user.fullName}</p>
                          <p className="text-xs text-slate-400 font-medium tracking-tight">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-sm text-slate-600 font-medium">{user.email}</p>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-xs text-slate-500 font-medium">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        user.isActive 
                        ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' 
                        : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                      }`}>
                        {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <button 
                        onClick={() => handleToggleStatus(user.userId)}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-90 ${
                          user.isActive 
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600' 
                          : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600'
                        }`}
                      >
                        {user.isActive ? 'Khóa' : 'Mở khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorMap = {
    indigo: 'from-indigo-500 to-violet-600 shadow-indigo-100 ring-indigo-100',
    emerald: 'from-emerald-400 to-teal-600 shadow-emerald-100 ring-emerald-100',
    amber: 'from-amber-400 to-orange-500 shadow-amber-100 ring-amber-100',
    rose: 'from-rose-400 to-pink-600 shadow-rose-100 ring-rose-100',
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 shadow-xl overflow-hidden relative group hover:-translate-y-1 transition-all duration-300">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorMap[color]} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`} />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white shadow-lg`}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
          <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
