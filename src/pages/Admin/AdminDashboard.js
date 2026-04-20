import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { isAdmin, getFullAvatarUrl, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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
      if (selectedUser && selectedUser.userId === userId) {
        setSelectedUser({ ...selectedUser, isActive: newStatus });
      }
      toast.info(newStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
    } catch (error) {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#f4f7fe] font-sans selection:bg-indigo-100 relative">
      
      {/* --- MODAL CHI TIẾT NGƯỜI DÙNG (MOBILE) --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedUser(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm relative z-10 shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-200">
            <div className="h-24 bg-gradient-to-r from-[#4318FF] to-[#707EAE]"></div>
            <div className="px-8 pb-8 -mt-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white mb-4">
                  <img src={getFullAvatarUrl(selectedUser.avatarUrl, selectedUser.fullName)} alt="" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-black text-[#1B2559]">{selectedUser.fullName}</h3>
                <p className="text-sm font-bold text-slate-400 mb-6">@{selectedUser.username}</p>
                
                <div className="w-full space-y-4 text-left mb-8">
                  <div className="bg-[#f4f7fe] p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-sm font-bold text-slate-700 break-all">{selectedUser.email}</p>
                  </div>
                  <div className="bg-[#f4f7fe] p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined Date</p>
                    <p className="text-sm font-bold text-slate-700">{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="bg-[#f4f7fe] p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedUser.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {selectedUser.isActive ? 'Active' : 'Banned'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => handleToggleStatus(selectedUser.userId)}
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                      selectedUser.isActive 
                      ? 'bg-rose-500 text-white shadow-rose-200 hover:bg-rose-600' 
                      : 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600'
                    }`}
                  >
                    {selectedUser.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                  </button>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`w-72 bg-gradient-to-b from-[#4318FF] to-[#707EAE] fixed h-full left-0 top-0 text-white z-[60] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-[#4318FF] font-black text-xl italic mt-[-2px]">S</span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest">SocialMini</h2>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white transition-colors">
             <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          <NavItem icon="dashboard" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
          <NavItem icon="messages" label="Messages" count={3} active={activeTab === 'messages'} />
          <NavItem icon="users" label="Users" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} />
          <NavItem icon="chart" label="Chart" active={activeTab === 'chart'} />
          
          <div className="pt-4 mt-4 border-t border-white/10">
             <Link to="/" className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/10 transition-all group">
                <svg className="h-5 w-5 text-white/70 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-black uppercase tracking-widest text-white/70 group-hover:text-white">Về trang chủ</span>
             </Link>
          </div>
        </nav>

        <div className="p-8">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Pro Version</p>
            <p className="text-xs font-bold leading-relaxed mb-3">Upgrade to unlock more charts!</p>
            <button className="w-full bg-white text-[#4318FF] text-[10px] font-black uppercase py-2.5 rounded-xl hover:bg-slate-100 transition-colors">Upgrade Now</button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-72 p-4 md:p-10 pt-32 min-h-screen relative overflow-y-auto w-full">
        
        {/* TOPBAR */}
        <header className="fixed top-4 md:top-6 right-4 md:right-10 left-4 md:left-[calc(18rem+2.5rem)] h-16 bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl flex items-center justify-between px-3 md:px-6 z-40 shadow-xl shadow-slate-200/40 gap-2 md:gap-0">
          <div className="flex items-center gap-2 md:gap-3 flex-1 md:flex-initial">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 bg-[#f4f7fe] rounded-xl border border-slate-100 active:scale-95 transition-transform"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <div className="flex items-center gap-2 md:gap-4 bg-[#f4f7fe] px-3 md:px-4 py-2 rounded-xl border border-slate-100 flex-1 md:flex-none max-w-[150px] sm:max-w-xs md:max-w-none">
              <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs md:text-sm font-medium text-slate-600 placeholder:text-slate-400 w-full md:w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6 shrink-0">
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-2 md:gap-3 md:pl-6 md:border-l md:border-slate-100">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-black text-slate-900 leading-none mb-1">Hi, {user?.fullName || 'Admin'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Super Administrator</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl overflow-hidden border-2 border-indigo-100 shadow-md flex-shrink-0">
                <img src={getFullAvatarUrl(user?.avatarUrl, user?.fullName)} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-[#1B2559] tracking-tight capitalize">{activeTab}</h1>
            <div className="flex items-center gap-3">
               <button 
                onClick={fetchData}
                className={`bg-white p-3 rounded-xl shadow-sm border border-white hover:bg-slate-50 transition-all ${isLoading ? 'animate-spin-slow' : 'active:scale-90'}`}
               >
                 <svg className="h-5 w-5 text-[#4318FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
               </button>
               <span className="bg-[#4318FF] text-white text-[10px] md:text-[11px] font-black px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-200 uppercase tracking-widest">Live Updates</span>
            </div>
          </div>

          {activeTab === 'dashboard' ? (
            /* --- OVERVIEW TAB --- */
            /* ... (keep existing overview logic) ... */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* LEFT COLUMN: CHARTS & MAPS */}
              <div className="col-span-12 md:col-span-8 space-y-6 md:space-y-8">
                {/* CHARTS CARD */}
                <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                      <h3 className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Interactive Data</h3>
                      <h2 className="text-xl md:text-2xl font-black text-[#1B2559]">Average Charts</h2>
                    </div>
                    <div className="flex items-center gap-2 bg-[#f4f7fe] p-1 rounded-xl self-start sm:self-auto">
                      <button className="px-4 py-1.5 rounded-lg bg-white shadow-sm text-[10px] font-black text-[#4318FF] uppercase">Weekly</button>
                      <button className="px-4 py-1.5 rounded-lg text-[10px] font-black text-slate-400 uppercase">Monthly</button>
                    </div>
                  </div>

                  <div className="h-60 md:h-72 flex items-end justify-between gap-2 md:gap-4 px-2 relative overflow-x-auto pb-4 sm:pb-0">
                    <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-0 pointer-events-none opacity-[0.03]">
                      {[...Array(5)].map((_, i) => <div key={i} className="border-t border-slate-900 w-full" />)}
                    </div>
                    <BarChart value={stats?.totalUsers * 10 || 0} maxValue={100} label="01" color="#4318FF" />
                    <BarChart value={stats?.activeUsers * 10 || 0} maxValue={100} label="02" color="#6AD2FF" />
                    <BarChart value={stats?.totalPosts || 0} maxValue={100} label="03" color="#4318FF" />
                    <BarChart value={35} maxValue={100} label="04" color="#6AD2FF" />
                    <BarChart value={stats?.totalComments || 0} maxValue={100} label="05" color="#4318FF" />
                    <BarChart value={75} maxValue={100} label="06" color="#6AD2FF" />
                    <BarChart value={45} maxValue={100} label="07" color="#4318FF" />
                    <BarChart value={90} maxValue={100} label="08" color="#6AD2FF" />
                  </div>
                </div>

                {/* MAPS SECTION */}
                <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
                   <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl md:text-2xl font-black text-[#1B2559]">User Distribution</h2>
                      <span className="text-[10px] md:text-xs font-bold text-slate-400">Global Reach</span>
                   </div>
                   <div className="h-64 md:h-80 bg-slate-50 flex items-center justify-center rounded-[1.5rem] md:rounded-[2rem] border border-dashed border-slate-200 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-[#f4f7fe] opacity-50 bg-[radial-gradient(#4318FF_0.5px,transparent_0.5px)] [background-size:16px_16px]"></div>
                      <svg className="w-4/5 h-2/3 text-slate-200" fill="currentColor" viewBox="0 0 800 400">
                        <path d="M150,150 Q180,100 220,130 T280,150 T350,120 T450,180 T550,140 T650,200 T750,150" fill="none" stroke="#4318FF" strokeWidth="3" strokeDasharray="8 4" className="opacity-40" />
                        <circle cx="200" cy="180" r="8" className="text-[#4318FF] animate-pulse" />
                        <circle cx="450" cy="150" r="6" className="text-[#6AD2FF] animate-bounce" />
                        <circle cx="600" cy="220" r="10" className="text-[#4318FF]" />
                      </svg>
                      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex gap-4">
                         <Legend color="#4318FF" label="New Users" />
                         <Legend color="#6AD2FF" label="Returns" />
                      </div>
                   </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="col-span-12 md:col-span-4 space-y-6 md:space-y-8">
                {/* CALCULATION CARD */}
                <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
                   <h2 className="text-xl md:text-2xl font-black text-[#1B2559] mb-8">Calculation</h2>
                   <div className="space-y-6">
                      <CalcRow icon="dollar" label="System Health" value="Active" color="#4318FF" highlight />
                      <CalcRow icon="download" label="Total Images" value="1,240" color="#6AD2FF" />
                      <CalcRow icon="star" label="Engagement" value="98%" color="#4318FF" />
                   </div>
                </div>

                {/* ANALYTICAL CARD */}
                <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
                   <h2 className="text-xl md:text-2xl font-black text-[#1B2559] mb-8">Analytical</h2>
                   <div className="space-y-8">
                      <ProgressBar label="Interaction Rate" percent={75} color="#4318FF" />
                      <ProgressBar label="Member Growth" percent={45} color="#6AD2FF" />
                      <ProgressBar label="Retention Rate" percent={92} color="#05CD99" />
                   </div>
                   
                   <div className="mt-10 grid grid-cols-2 gap-4">
                      <RoundChart percent={75} label="Chart 01" color="#4318FF" />
                      <RoundChart percent={50} label="Chart 02" color="#6AD2FF" />
                   </div>
                </div>

                <div className="bg-gradient-to-br from-[#4318FF] to-[#707EAE] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-indigo-200 text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Notice</h3>
                   <h2 className="text-xl font-black mb-4">Migration Successful</h2>
                   <p className="text-xs font-medium leading-relaxed opacity-80">Database provider synced with PostgreSQL Production. Admin account ready.</p>
                   <div className="mt-6 flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg">20.04.2026</span>
                      <Link to="/" className="text-[10px] font-black uppercase tracking-widest hover:underline">View Site &rarr;</Link>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- USERS TAB --- */
            <div className="bg-white/90 backdrop-blur-md rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-6 md:px-10 py-8 md:py-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                   <h2 className="text-2xl md:text-3xl font-black text-[#1B2559] tracking-tight mb-1">User Management</h2>
                   <p className="text-sm font-bold text-slate-400">Manage community standards and account status.</p>
                </div>
                <div className="bg-[#4318FF] text-white px-6 py-2.5 rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-2">
                   <span className="text-lg font-black">{filteredUsers.length}</span>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Users</span>
                </div>
              </div>

              <div className="px-4 overflow-hidden pb-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                      <th className="px-4 md:px-8 py-6">Member Identity</th>
                      <th className="px-8 py-6 hidden md:table-cell">Contact Info</th>
                      <th className="px-8 py-6 hidden md:table-cell">Joined Date</th>
                      <th className="px-8 py-6 text-center hidden md:table-cell">Security Status</th>
                      <th className="px-4 md:px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(userItem => (
                      <tr key={userItem.userId} className="hover:bg-[#f4f7fe]/50 transition-all group">
                        <td className="px-4 md:px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border-4 border-white shadow-lg group-hover:scale-105 transition-transform bg-[#f4f7fe] shrink-0">
                              <img src={getFullAvatarUrl(userItem.avatarUrl, userItem.fullName)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-black text-[#1B2559] text-base leading-none mb-1.5">{userItem.fullName}</p>
                              <p className="text-xs text-slate-400 font-bold tracking-tight">@{userItem.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 hidden md:table-cell">
                          <p className="text-sm text-slate-600 font-bold">{userItem.email}</p>
                        </td>
                        <td className="px-8 py-6 hidden md:table-cell">
                          <p className="text-xs text-slate-500 font-black">
                            {new Date(userItem.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-center hidden md:table-cell">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                            userItem.isActive 
                            ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100' 
                            : 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${userItem.isActive ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                            {userItem.isActive ? 'Active' : 'Banned'}
                          </span>
                        </td>
                        <td className="px-4 md:px-8 py-6 text-right">
                          <div className="flex justify-end gap-2 text-right">
                            <button 
                              onClick={() => setSelectedUser(userItem)}
                              className="md:hidden p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                               </svg>
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(userItem.userId)}
                              className={`hidden md:block text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95 shadow-md ${
                                userItem.isActive 
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:shadow-rose-200' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-emerald-200'
                              }`}
                            >
                              {userItem.isActive ? 'Restrict Access' : 'Restore Access'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

/* --- SUBCOMPONENTS --- */

const NavItem = ({ icon, label, count, active, onClick }) => {
  const icons = {
    dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    messages: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    reports: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-white text-[#4318FF] shadow-lg scale-105' : 'hover:bg-white/10'}`}
    >
      <div className="flex items-center gap-4">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d={icons[icon]} />
        </svg>
        <span className={`text-sm font-black uppercase tracking-widest ${active ? '' : 'opacity-80'}`}>{label}</span>
      </div>
      {count && (
        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{count}</span>
      )}
      {active && (
        <div className="absolute right-0 w-1 h-6 bg-[#4318FF] rounded-l-full"></div>
      )}
    </button>
  );
};

const BarChart = ({ value, maxValue, label, color }) => {
  const height = (value / maxValue) * 100;
  return (
    <div className="flex flex-col items-center gap-4 h-full flex-1">
      <div className="w-full bg-[#f4f7fe] rounded-full flex-1 flex items-end relative overflow-hidden group">
        <div 
          className="w-full rounded-full transition-all duration-1000 ease-out" 
          style={{ height: `${height}%`, backgroundColor: color }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
        </div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
           {value}%
        </div>
      </div>
      <span className="text-[10px] font-black text-slate-400">{label}</span>
    </div>
  );
};

const CalcRow = ({ icon, label, value, color, highlight }) => {
  const iconD = {
    dollar: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
  };

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: color }}>
           <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconD[icon]} />
           </svg>
        </div>
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className={`text-lg font-black ${highlight ? 'text-[#4318FF]' : 'text-[#1B2559]'}`}>{value}</p>
        </div>
      </div>
      <button className="text-slate-200 group-hover:text-slate-400 transition-colors">
         <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
         </svg>
      </button>
    </div>
  );
};

const ProgressBar = ({ label, percent, color }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-end">
       <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</span>
       <span className="text-lg font-black text-[#1B2559] leading-none">{percent}%</span>
    </div>
    <div className="h-3 w-full bg-[#f4f7fe] rounded-full overflow-hidden">
       <div 
        className="h-full rounded-full transition-all duration-1000" 
        style={{ width: `${percent}%`, backgroundColor: color }}
       ></div>
    </div>
  </div>
);

const RoundChart = ({ percent, label, color }) => (
  <div className="flex flex-col items-center gap-3">
     <div className="relative w-20 h-20">
        <svg className="w-full h-full" viewBox="0 0 36 36">
           <path className="text-slate-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
           <path style={{ color }} strokeDasharray={`${percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
           <text x="18" y="20.5" className="text-[8px] font-black fill-slate-900" textAnchor="middle">{percent}%</text>
        </svg>
     </div>
     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

const Legend = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

export default AdminDashboard;
