import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  LogOut, 
  HelpCircle,
  Sun,
  Moon,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Target,
  PieChart,
  UserCheck,
  UserX,
  X,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Globe
} from 'lucide-react';
import reportService from '../../services/reportService';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { isAdmin, getFullAvatarUrl, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'reports') {
        fetchReports();
      } else if (activeTab === 'users') {
        fetchUsers();
      } else {
        fetchData();
      }
      fetchMaintenanceStatus();
    }
  }, [isAdmin, activeTab]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const usersRes = await adminService.getUsers();
      setUsers(usersRes);
    } catch (error) {
      toast.error('Lỗi lấy danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  }

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getAllReports();
      setReports(data || []);
    } catch (error) {
      toast.error('Lỗi lấy danh sách báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      const result = await reportService.resolveReport(reportId, action);
      setReports(reports.map(r => r.reportId === reportId ? { ...r, status: action } : r));
      toast.success(result || 'Đã xử lý báo cáo');
    } catch (error) {
      toast.error('Lỗi xử lý báo cáo');
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await adminService.getMaintenanceStatus();
      setIsMaintenance(response.isMaintenance);
    } catch (error) {
      console.error('Lỗi lấy trạng thái bảo trì', error);
    }
  };

  const handleToggleMaintenance = async () => {
    setIsTogglingMaintenance(true);
    try {
      const response = await adminService.toggleMaintenance();
      const newStatus = response.isMaintenance;
      setIsMaintenance(newStatus);
      toast.success(newStatus ? 'Đã BẬT chế độ bảo trì hệ thống' : 'Đã TẮT chế độ bảo trì hệ thống');
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái bảo trì');
    } finally {
      setIsTogglingMaintenance(false);
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
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#f8f9fe] text-slate-900'} font-sans antialiased overflow-hidden transition-colors duration-500`}>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`w-72 fixed h-full left-0 top-0 z-[70] flex flex-col shadow-2xl transition-all duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDarkMode ? 'bg-slate-900 border-r border-slate-800' : 'bg-white border-r border-slate-100'}`}>
        <div className="p-8 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-xl italic mt-[-2px]">M</span>
            </div>
            <h2 className="text-xl font-black bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-600 bg-clip-text text-transparent tracking-tighter">
              MiniSocial
            </h2>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
          <SidebarItem icon={<Users size={20} />} label="Users" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
          <SidebarItem icon={<AlertTriangle size={20} />} label="Reports" active={activeTab === 'reports'} activeCount={reports.filter(r => r.status === 'Pending').length} onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
          
          <div className={`py-4 px-4 text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} uppercase tracking-widest mt-4`}>Analysis</div>
          <SidebarItem icon={<BarChart3 size={20} />} label="Analytics" isDarkMode={isDarkMode} disabled />
          <SidebarItem icon={<PieChart size={20} />} label="Stats" isDarkMode={isDarkMode} disabled />
          
          <div className={`py-4 px-4 text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} uppercase tracking-widest mt-4`}>System</div>
          <SidebarItem icon={<Settings size={20} />} label="Settings" isDarkMode={isDarkMode} disabled />
        </nav>

        <div className={`p-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} mt-auto`}>
          <div className="space-y-1">
             <SidebarItem icon={<HelpCircle size={20} />} label="Help" isDarkMode={isDarkMode} />
             <SidebarAction icon={<LogOut size={20} />} label="Log out" isDarkMode={isDarkMode} />
          </div>
          
          <div className={`mt-8 flex items-center justify-between ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} p-2 rounded-2xl border ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
             <button 
              onClick={() => setIsDarkMode(false)} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${!isDarkMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
             >
                <Sun size={14} />
                <span className="text-[10px] font-bold uppercase">Light</span>
             </button>
             <button 
              onClick={() => setIsDarkMode(true)} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${isDarkMode ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-400'}`}
             >
                <Moon size={14} />
                <span className="text-[10px] font-bold uppercase">Dark</span>
             </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-72 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="px-6 md:px-10 py-6 flex items-center justify-between shrink-0">
          <div>
            <div className="md:hidden mb-4">
              <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-xl shadow-sm border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <LayoutDashboard size={20} className="text-indigo-600" />
              </button>
            </div>
            <h1 className={`text-2xl md:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tight`}>Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}!</h1>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} mt-0.5 italic`}>It is the best time to manage your community</p>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className={`hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-2xl border shadow-sm w-72 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
               <Search size={18} className="text-slate-400" />
               <input 
                type="text" 
                placeholder="Search metrics..." 
                className="bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>

            <div className="flex items-center gap-2 md:gap-3">
               <button className={`p-2.5 rounded-2xl border shadow-sm relative transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-100 text-slate-400'}`}>
                  <Bell size={20} />
                  <span className={`absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 ${isDarkMode ? 'border-slate-900' : 'border-white'}`}></span>
               </button>
               
               <button 
                  onClick={handleToggleMaintenance}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all active:scale-95 ${
                    isMaintenance 
                    ? (isDarkMode ? 'bg-rose-950/30 border-rose-900 text-rose-500' : 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm shadow-rose-100')
                    : (isDarkMode ? 'bg-emerald-950/30 border-emerald-900 text-emerald-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600')
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isMaintenance ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                    {isMaintenance ? 'Maintain On' : 'Maintain Off'}
                  </span>
                  {isTogglingMaintenance && <RefreshCw size={12} className="animate-spin ml-1" />}
               </button>

               <div className={`h-10 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} hidden md:block mx-1`}></div>

               <div className="flex items-center gap-3 pl-1">
                  <div className="hidden sm:block text-right">
                    <p className={`text-sm font-black leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user?.fullName || 'Administrator'}</p>
                    <p className={`text-[10px] font-bold mt-1 uppercase tracking-tighter ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>@{user?.username}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl overflow-hidden border-2 shadow-xl cursor-pointer ${isDarkMode ? 'border-slate-800 shadow-indigo-900/20' : 'border-white shadow-indigo-100/40'}`}>
                    <img src={getFullAvatarUrl(user?.avatarUrl, user?.fullName)} alt="Admin" className="w-full h-full object-cover" />
                  </div>
               </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 custom-scrollbar">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
             <div className={`flex items-center gap-2 p-1 rounded-2xl shadow-sm border self-start ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <button className={`px-5 py-2 rounded-xl text-[10px] font-black shadow-sm border uppercase tracking-widest ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>Global View</button>
                <button 
                  onClick={() => fetchData()}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
             </div>
             
             <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 text-[11px] font-black uppercase tracking-widest">
                <ShieldCheck size={18} />
                Security Report
             </button>
          </div>

          {activeTab === 'dashboard' ? (
            /* --- DASHBOARD TAB --- */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* STAT CARDS */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    title="Total balance" 
                    label="Total Registered"
                    value={stats?.totalUsers?.toLocaleString() || '0'} 
                    trend="+12.1%" 
                    isUp={true} 
                    icon={<Users className="text-indigo-500" />}
                    isDarkMode={isDarkMode}
                  />
                  <StatCard 
                    title="Income" 
                    label="Active Members"
                    value={stats?.activeUsers?.toLocaleString() || '0'} 
                    trend="+8.3%" 
                    isUp={true} 
                    icon={<UserCheck className="text-emerald-500" />}
                    isDarkMode={isDarkMode}
                  />
                  <StatCard 
                    title="Expense" 
                    label="Total Posts"
                    value={stats?.totalPosts?.toLocaleString() || '0'} 
                    trend="-2.4%" 
                    isUp={false} 
                    icon={<TrendingUp className="text-amber-500" />}
                    isDarkMode={isDarkMode}
                  />
                  <StatCard 
                    title="Total savings" 
                    label="Active Reports"
                    value={reports.filter(r => r.status === 'Pending').length || '0'} 
                    trend="+12.1%" 
                    isUp={true} 
                    icon={<AlertTriangle className="text-rose-500" />}
                    isDarkMode={isDarkMode}
                  />
               </div>

               {/* CHARTS ROW */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Chart */}
                  <div className={`lg:col-span-8 p-8 rounded-[2.5rem] border shadow-sm shadow-indigo-500/5 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                     <div className="flex items-center justify-between mb-10">
                        <div>
                          <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>System Traffic</h3>
                          <div className="flex items-center gap-6 mt-2">
                             <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Growth</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-300"></span>
                                <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Retention</span>
                             </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <select className={`text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-2 outline-none border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                              <option>All accounts</option>
                           </select>
                           <select className={`text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-2 outline-none border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                              <option>This year</option>
                           </select>
                        </div>
                     </div>

                     <div className="h-64 flex items-end justify-between gap-4 px-2">
                        <BarChartGroup value1={40} value2={60} label="Jan" isDarkMode={isDarkMode} />
                        <BarChartGroup value1={70} value2={50} label="Feb" isDarkMode={isDarkMode} />
                        <BarChartGroup value1={55} value2={85} label="Mar" isDarkMode={isDarkMode} />
                        <BarChartGroup value1={90} value2={40} label="Apr" isDarkMode={isDarkMode} />
                        <BarChartGroup value1={75} value2={70} label="May" isDarkMode={isDarkMode} />
                        <BarChartGroup value1={45} value2={65} label="Jun" isDarkMode={isDarkMode} />
                        <BarChartGroup value1={60} value2={80} label="Jul" isDarkMode={isDarkMode} />
                     </div>
                  </div>

                  {/* Right Chart (Donut) */}
                  <div className={`lg:col-span-4 p-8 rounded-[2.5rem] border shadow-sm shadow-indigo-500/5 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-8">
                       <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Health</h3>
                       <button className="text-slate-400 hover:text-indigo-600 transition-colors"><ArrowUpRight size={20} /></button>
                    </div>
                    
                    <div className="flex flex-col items-center">
                       <div className="relative w-48 h-48 mb-8">
                          <svg className="w-full h-full transform -rotate-90">
                             <circle cx="96" cy="96" r="80" className={isDarkMode ? 'stroke-slate-800' : 'stroke-slate-50'} strokeWidth="16" fill="none" />
                             <circle 
                              cx="96" cy="96" r="80" 
                              className="stroke-indigo-500" strokeWidth="16" fill="none" 
                              strokeDasharray="502" strokeDashoffset="125"
                              strokeLinecap="round"
                             />
                             <circle 
                              cx="96" cy="96" r="80" 
                              className="stroke-indigo-300" strokeWidth="16" fill="none" 
                              strokeDasharray="502" strokeDashoffset="420"
                              strokeLinecap="round"
                             />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Engagement</p>
                             <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>75%</p>
                          </div>
                       </div>
                       
                       <div className="w-full space-y-4">
                          <BudgetRow color="bg-indigo-500" label="Active Users" value="75%" amount="5,950" isDarkMode={isDarkMode} />
                          <BudgetRow color="bg-indigo-300" label="Returning" value="15%" amount="400" isDarkMode={isDarkMode} />
                          <BudgetRow color={isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} label="Others" value="10%" amount="120" isDarkMode={isDarkMode} />
                       </div>
                    </div>
                  </div>
               </div>

               {/* BOTTOM ROW (Table equivalent) */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className={`lg:col-span-8 p-8 rounded-[2.5rem] border shadow-sm shadow-indigo-500/5 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                     <div className="flex items-center justify-between mb-8">
                        <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent reports</h3>
                        <button 
                          onClick={() => setActiveTab('reports')}
                          className={`text-[10px] font-black uppercase tracking-widest hover:underline ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
                        >
                          See all
                        </button>
                     </div>
                     
                     <div className="overflow-x-auto overflow-y-hidden">
                        <table className="w-full text-left">
                           <thead>
                              <tr className={`text-[10px] font-black uppercase tracking-[0.2em] border-b ${isDarkMode ? 'text-slate-700 border-slate-800' : 'text-slate-300 border-slate-50'}`}>
                                 <th className="pb-4">Reporter</th>
                                 <th className="pb-4">Category</th>
                                 <th className="pb-4">Status</th>
                                 <th className="pb-4 text-right">Time</th>
                              </tr>
                           </thead>
                           <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                              {reports.slice(0, 5).map((report, idx) => (
                                <tr key={report.reportId || idx} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                                   <td className="py-4 flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
                                        {report.reporterName?.substring(0, 2)}
                                      </div>
                                      <div>
                                         <p className={`text-sm font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{report.reporterName}</p>
                                         <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Moderation</p>
                                      </div>
                                   </td>
                                   <td className="py-4">
                                      <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{report.reason}</span>
                                   </td>
                                   <td className="py-4">
                                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                        report.status === 'Pending' ? (isDarkMode ? 'bg-amber-900/20 text-amber-500' : 'bg-amber-50 text-amber-600') :
                                        report.status === 'Resolved' ? (isDarkMode ? 'bg-emerald-900/20 text-emerald-500' : 'bg-emerald-50 text-emerald-600') :
                                        (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-400')
                                      }`}>
                                        {report.status}
                                      </span>
                                   </td>
                                   <td className="py-4 text-right">
                                      <p className="text-xs font-bold text-slate-400 tracking-tight">
                                        {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                                      </p>
                                   </td>
                                </tr>
                              ))}
                              {reports.length === 0 && (
                                <tr>
                                   <td colSpan="4" className="py-10 text-center text-slate-600 font-bold italic text-sm">No recent reports</td>
                                </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  <div className={`lg:col-span-4 p-8 rounded-[2.5rem] border shadow-sm shadow-indigo-500/5 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                     <div className="flex items-center justify-between mb-8">
                        <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Security goals</h3>
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors"><ArrowUpRight size={20} /></button>
                     </div>
                     
                     <div className="space-y-8 mt-4">
                        <GoalProgress label="Community Moderation" value="1,650" target="2,000" percent={82} color="bg-indigo-500" isDarkMode={isDarkMode} />
                        <GoalProgress label="System Optimization" value="60,000" target="100,000" percent={60} color="bg-indigo-300" isDarkMode={isDarkMode} />
                        <GoalProgress label="Report Resolution" value="150" target="5,000" percent={3} color="bg-indigo-200" isDarkMode={isDarkMode} />
                     </div>
                  </div>
               </div>
            </div>
          ) : activeTab === 'users' ? (
            /* --- USERS TAB --- */
            <div className={`rounded-[2.5rem] border shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>User Management</h2>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total {filteredUsers.length} members in community</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={fetchUsers} className={`p-3 rounded-2xl border transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600'}`}>
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                     </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className={`text-[10px] font-black uppercase tracking-[0.2em] border-b ${isDarkMode ? 'text-slate-700 border-slate-800' : 'text-slate-400 border-slate-50'}`}>
                           <th className="pb-6 px-4">Profile</th>
                           <th className="pb-6 px-4">Contact</th>
                           <th className="pb-6 px-4">Joined</th>
                           <th className="pb-6 px-4 text-center">Status</th>
                           <th className="pb-6 px-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                        {filteredUsers.map(userItem => (
                          <tr key={userItem.userId} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                             <td className="py-5 px-4">
                                <div className="flex items-center gap-4">
                                   <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 shadow-lg shrink-0 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-white'}`}>
                                      <img src={getFullAvatarUrl(userItem.avatarUrl, userItem.fullName)} alt="" className="w-full h-full object-cover" />
                                   </div>
                                   <div>
                                      <p className={`font-black leading-none mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{userItem.fullName}</p>
                                      <p className={`text-xs font-bold uppercase tracking-tight ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>@{userItem.username}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="py-5 px-4">
                                <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{userItem.email}</p>
                             </td>
                             <td className="py-5 px-4">
                                <p className={`text-xs font-black ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{new Date(userItem.createdAt).toLocaleDateString('vi-VN')}</p>
                             </td>
                             <td className="py-5 px-4 text-center">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                  userItem.isActive 
                                  ? (isDarkMode ? 'bg-emerald-900/20 text-emerald-500' : 'bg-emerald-50 text-emerald-600') 
                                  : (isDarkMode ? 'bg-rose-900/20 text-rose-500' : 'bg-rose-50 text-rose-600')
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${userItem.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                  {userItem.isActive ? 'Active' : 'Banned'}
                                </span>
                             </td>
                             <td className="py-5 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                   <button 
                                      onClick={() => setSelectedUser(userItem)}
                                      className={`p-2.5 rounded-xl border shadow-sm transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-indigo-400' : 'bg-white border-slate-100 text-slate-400 hover:text-indigo-600'}`}
                                   >
                                      <ArrowUpRight size={18} />
                                   </button>
                                   <button 
                                      onClick={() => handleToggleStatus(userItem.userId)}
                                      className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                                        userItem.isActive 
                                        ? (isDarkMode ? 'bg-slate-800 border-slate-700 text-rose-500 hover:bg-rose-950/30' : 'bg-white border-slate-100 text-rose-500 hover:bg-rose-50') 
                                        : (isDarkMode ? 'bg-slate-800 border-slate-700 text-emerald-500 hover:bg-emerald-950/30' : 'bg-white border-slate-100 text-emerald-500 hover:bg-emerald-50')
                                      }`}
                                      title={userItem.isActive ? "Restrict Account" : "Access Restore"}
                                   >
                                      {userItem.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                                   </button>
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          ) : (
            /* --- REPORTS TAB --- */
            <div className={`rounded-[2.5rem] border shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Security Moderation</h2>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total {reports.length} reports flagged by community</p>
                  </div>
                  <button onClick={fetchReports} className={`p-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600'}`}>
                     <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                  </button>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className={`text-[10px] font-black uppercase tracking-[0.2em] border-b ${isDarkMode ? 'text-slate-700 border-slate-800' : 'text-slate-400 border-slate-50'}`}>
                           <th className="pb-6 px-4">Flagged Content</th>
                           <th className="pb-6 px-4 text-center">Identity</th>
                           <th className="pb-6 px-4">Status</th>
                           <th className="pb-6 px-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                        {reports.map(report => (
                          <tr key={report.reportId} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                             <td className="py-6 px-4 max-w-md">
                                <div className="flex items-start gap-4">
                                   <div className={`p-3 rounded-2xl shrink-0 ${isDarkMode ? 'bg-rose-950/30 text-rose-500' : 'bg-rose-50 text-rose-500'}`}>
                                      <AlertTriangle size={20} />
                                   </div>
                                   <div>
                                      <p className={`text-sm font-black mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{report.reason}</p>
                                      <p className={`text-xs font-medium line-clamp-1 italic ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>"{report.targetContent}"</p>
                                      <div className="flex items-center gap-2 mt-2">
                                         <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-500'}`}>{report.targetType}</span>
                                         <span className={`text-[10px] font-bold tracking-tighter ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>ID: {report.reportId.split('-')[0]}</span>
                                      </div>
                                   </div>
                                </div>
                             </td>
                             <td className="py-6 px-4 text-center">
                                <p className={`text-sm font-black leading-none mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{report.reporterName}</p>
                                <p className={`text-[10px] font-bold tracking-tighter ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{new Date(report.createdAt).toLocaleString('vi-VN')}</p>
                             </td>
                             <td className="py-6 px-4">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                  report.status === 'Pending' ? (isDarkMode ? 'bg-amber-900/20 text-amber-500' : 'bg-amber-50 text-amber-600') :
                                  report.status === 'Resolved' ? (isDarkMode ? 'bg-emerald-900/20 text-emerald-500' : 'bg-emerald-50 text-emerald-600') :
                                  (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-400')
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${report.status === 'Pending' ? 'bg-amber-500 animate-pulse' : report.status === 'Resolved' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                  {report.status}
                                </span>
                             </td>
                             <td className="py-6 px-4 text-right">
                                <button 
                                  onClick={() => setSelectedReport(report)}
                                  className={`bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 ${isDarkMode ? 'shadow-indigo-900/20 hover:bg-indigo-500' : 'shadow-indigo-100 hover:bg-indigo-700'}`}
                                >
                                  Details
                                </button>
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

      {/* --- MODALS --- */}
      
      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedUser(null)}></div>
          <div className={`rounded-[2.5rem] w-full max-w-sm relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
             <div className="h-24 bg-gradient-to-r from-indigo-500 to-indigo-300"></div>
             <div className="px-8 pb-8 -mt-12">
               <div className="flex flex-col items-center text-center">
                  <div className={`w-24 h-24 rounded-3xl overflow-hidden border-4 shadow-xl mb-4 ${isDarkMode ? 'bg-slate-900 border-slate-900' : 'bg-white border-white'}`}>
                    <img src={getFullAvatarUrl(selectedUser.avatarUrl, selectedUser.fullName)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedUser.fullName}</h3>
                  <p className={`text-sm font-bold mb-6 uppercase tracking-tighter ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>@{selectedUser.username}</p>
                  
                  <div className="w-full space-y-4 text-left mb-8">
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>Email</p>
                      <p className={`text-sm font-black break-all ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{selectedUser.email}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>Global Status</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedUser.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {selectedUser.isActive ? 'Active' : 'Restricted'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleToggleStatus(selectedUser.userId)}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg mb-3 ${
                      selectedUser.isActive 
                      ? 'bg-rose-500 text-white shadow-rose-900/20' 
                      : 'bg-emerald-500 text-white shadow-emerald-900/20'
                    }`}
                  >
                    {selectedUser.isActive ? 'Restrict Access' : 'Restore Access'}
                  </button>
                  <button onClick={() => setSelectedUser(null)} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}>Close Profile</button>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Report Resolution Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedReport(null)}></div>
           <div className={`rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
              <div className={`p-8 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-50'}`}>
                 <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-rose-950/30 text-rose-500' : 'bg-rose-50 text-rose-500'}`}>
                       <ShieldAlert size={24} />
                    </div>
                    <h3 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Security Case Details</h3>
                 </div>
                 <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
              </div>
              
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                       <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>Source identity</p>
                       <p className={`text-sm font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{selectedReport.reporterName}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                       <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>Platform Type</p>
                       <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black rounded uppercase">{selectedReport.targetType}</span>
                    </div>
                 </div>

                 <div className={`p-6 rounded-2xl border italic relative overflow-hidden ${isDarkMode ? 'bg-rose-950/10 border-rose-900/30' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="absolute top-2 right-2 opacity-5"><TrendingDown size={60} /></div>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-rose-900' : 'text-rose-300'}`}>Original Content</p>
                    <p className={`text-sm font-bold leading-relaxed italic ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>"{selectedReport.targetContent}"</p>
                 </div>

                 <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>Violated Standard</p>
                    <p className="text-base font-black text-rose-600 mb-1">{selectedReport.reason}</p>
                    <p className={`text-xs font-medium leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{selectedReport.description || 'No additional technical description provided.'}</p>
                 </div>

                 <div className="flex gap-4 pt-4">
                    {selectedReport.status === 'Pending' ? (
                      <>
                        <button 
                          onClick={() => { handleResolveReport(selectedReport.reportId, 'Resolved'); setSelectedReport(null); }}
                          className={`flex-1 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${isDarkMode ? 'shadow-indigo-900/20 hover:bg-indigo-500' : 'shadow-indigo-100 hover:bg-indigo-700'}`}
                        >
                           Resolve Case
                        </button>
                        <button 
                          onClick={() => { handleResolveReport(selectedReport.reportId, 'Dismissed'); setSelectedReport(null); }}
                          className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-500 hover:bg-slate-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                           Dismiss
                        </button>
                      </>
                    ) : (
                      <div className={`flex-1 py-4 text-center rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>Status Report</p>
                        <p className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{selectedReport.status}</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Styles for scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#334155' : '#e2e8f0'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#475569' : '#cbd5e1'}; }
      `}} />
    </div>
  );
};

/* --- MINI SUBCOMPONENTS --- */

const SidebarItem = ({ icon, label, active, onClick, activeCount, disabled, isDarkMode }) => (
  <button 
    onClick={!disabled ? onClick : null}
    disabled={disabled}
    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 relative group ${
      disabled ? 'opacity-40 cursor-not-allowed' :
      active 
      ? (isDarkMode ? 'bg-indigo-950/40 text-indigo-400 shadow-sm shadow-indigo-900/20' : 'bg-indigo-50 text-indigo-600 shadow-sm') 
      : (isDarkMode ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-50')
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={active ? (isDarkMode ? 'text-indigo-400' : 'text-indigo-600') : 'group-hover:text-indigo-600 transition-colors'}>{icon}</div>
      <span className={`text-sm font-black uppercase tracking-widest ${active ? (isDarkMode ? 'text-indigo-400' : 'text-indigo-600') : 'opacity-80'}`}>{label}</span>
    </div>
    {activeCount > 0 && (
      <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">{activeCount}</span>
    )}
    {active && (
      <div className={`absolute right-0 w-1.5 h-6 rounded-l-full ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600'}`}></div>
    )}
  </button>
);

const SidebarAction = ({ icon, label, isDarkMode }) => (
  <button className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${isDarkMode ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'}`}>
    <div className="group-hover:scale-110 transition-transform">{icon}</div>
    <span className="text-sm font-black uppercase tracking-widest opacity-80">{label}</span>
  </button>
);

const StatCard = ({ title, label, value, trend, isUp, icon, isDarkMode }) => (
  <div className={`p-6 rounded-[2rem] border shadow-sm relative group hover:translate-y-[-2px] transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-indigo-950/10' : 'bg-white border-slate-100 shadow-indigo-50/20'}`}>
     <div className="flex items-center justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
           {icon}
        </div>
        <button className="text-slate-500 hover:text-indigo-600 transition-colors"><ChevronRight size={18} /></button>
     </div>
     <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>{title}</p>
     <div className="flex items-center justify-between gap-2 overflow-hidden">
        <h4 className={`text-2xl font-black tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</h4>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${isUp ? (isDarkMode ? 'bg-emerald-900/20 text-emerald-500' : 'bg-emerald-50 text-emerald-600') : (isDarkMode ? 'bg-rose-900/20 text-rose-500' : 'bg-rose-50 text-rose-600')}`}>
           {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
           {trend}
        </div>
     </div>
     <p className={`text-[11px] font-medium mt-4 border-t pt-3 ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-50 text-slate-400'}`}>{label}</p>
  </div>
);

const BarChartGroup = ({ value1, value2, label, isDarkMode }) => (
  <div className="flex flex-col items-center gap-3 h-full flex-1 min-w-[20px]">
     <div className="flex-1 flex items-end gap-1.5 h-full">
        <div className="w-2.5 bg-indigo-500 rounded-full transition-all duration-1000 ease-out hover:brightness-110" style={{ height: `${value1}%` }}></div>
        <div className={`w-2.5 rounded-full transition-all duration-1000 ease-out hover:brightness-110 shadow-inner ${isDarkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'}`} style={{ height: `${value2}%` }}></div>
     </div>
     <span className={`text-[9px] font-black uppercase tracking-tighter ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>{label}</span>
  </div>
);

const BudgetRow = ({ color, label, value, amount, isDarkMode }) => (
  <div className="flex items-center justify-between group">
     <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className={`text-xs font-bold lowercase italic ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{label}</span>
     </div>
     <div className="flex items-center gap-2">
        <span className={`text-sm font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{value}</span>
        <span className={`text-[10px] font-bold tracking-tighter ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>(${amount})</span>
     </div>
  </div>
);

const GoalProgress = ({ label, value, target, percent, color, isDarkMode }) => (
  <div className="space-y-4">
     <div className="flex items-center justify-between">
        <div>
           <p className={`text-xs font-black tracking-tight ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{label}</p>
           <p className={`text-[10px] font-bold mt-0.5 tracking-tighter ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{value} / {target}</p>
        </div>
        <span className="text-sm font-black text-indigo-600">{percent}%</span>
     </div>
     <div className={`h-3 w-full rounded-full border p-0.5 overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
        <div className={`h-full rounded-full transition-all duration-1000 shadow-sm ${color}`} style={{ width: `${percent}%` }}></div>
     </div>
  </div>
);

export default AdminDashboard;
