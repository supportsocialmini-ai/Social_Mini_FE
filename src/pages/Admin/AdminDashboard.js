import React, { useState, useEffect, useRef } from 'react';
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
  Globe,
  Layers,
  Trash2,
  Calendar,
  Download,
  FileText,
  Filter
} from 'lucide-react';
import reportService from '../../services/reportService';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const removeVietnameseTones = (str) => {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return str;
};

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const { isAdmin, getFullAvatarUrl, user, logout } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState(null); // { groupId, name }

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
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
  const [packages, setPackages] = useState([]);
  const [isUpdatingPackage, setIsUpdatingPackage] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({ name: '', price: 0, description: '', features: '', isActive: true });
  // Pagination for users tab
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersTotalCount, setUsersTotalCount] = useState(0);
  const PAGE_SIZE = 10;
  // Detailed Analytics
  const [detailedStats, setDetailedStats] = useState(null);
  const [statsFilterType, setStatsFilterType] = useState('all');
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [statsStartDate, setStatsStartDate] = useState(thirtyDaysAgoStr);
  const [statsEndDate, setStatsEndDate] = useState(todayStr);
  const [statsSearchQuery, setStatsSearchQuery] = useState('');

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'reports') {
        fetchReports();
      } else if (activeTab === 'users') {
        fetchUsers(1);
      } else if (activeTab === 'groups') {
        fetchGroups();
      } else if (activeTab === 'premium') {
        fetchPackages();
      } else if (activeTab === 'analytics') {
        fetchDetailedStats();
      } else {
        fetchData();
      }
      fetchMaintenanceStatus();
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      const delayDebounceFn = setTimeout(() => {
        fetchUsers(1, searchQuery);
      }, 400);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(1, PAGE_SIZE)
      ]);
      setStats(statsRes);
      const usersData = usersRes?.users?.$values || usersRes?.users || (Array.isArray(usersRes) ? usersRes : []);
      setUsers(usersData);
      setUsersTotalCount(usersRes?.totalCount || 0);
      setUsersCurrentPage(1);
    } catch (error) {
      toast.error(t('admin.toasts.errorGetData'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (page = 1, search = searchQuery) => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers(page, PAGE_SIZE, search);
      // API returns { totalCount, page, pageSize, users }
      const usersData = res?.users?.$values || res?.users || (Array.isArray(res) ? res : []);
      setUsers(usersData);
      setUsersTotalCount(res?.totalCount || 0);
      setUsersCurrentPage(page);
    } catch (error) {
      toast.error(t('admin.toasts.errorGetUsers'));
    } finally {
      setIsLoading(false);
    }
  }

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getGroups();
      const data = res?.result?.$values || res?.result || res?.$values || res || [];
      setGroups(data);
    } catch (error) {
      toast.error(t('admin.toasts.errorGetGroups') || 'Lỗi lấy danh sách nhóm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await adminService.deleteGroup(groupId);
      toast.success(t('admin.toasts.successDeleteGroup'));
      setGroups(prev => prev.filter(g => g.groupId !== groupId));
      setDeleteGroupTarget(null);
    } catch (error) {
      toast.error(t('admin.toasts.errorDeleteGroup'));
    }
  };

  const fetchDetailedStats = async (start = statsStartDate, end = statsEndDate) => {
    setIsStatsLoading(true);
    try {
      const res = await adminService.getDetailedStats(start, end);
      const data = res?.result || res;
      setDetailedStats(data);
    } catch (error) {
      toast.error(t('admin.toasts.errorDetailedStats') || 'Lỗi lấy dữ liệu thống kê chi tiết');
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!detailedStats) return;
    setIsStatsLoading(true);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleString('en-US');

    const cleanStr = (str) => {
      if (!str) return '';
      return removeVietnameseTones(str);
    };

    const mapEventTypeToEnglish = (type) => {
      switch (type) {
        case 'Register':
        case 'Đăng ký tài khoản':
          return 'Register';
        case 'Post':
        case 'Đăng bài viết':
          return 'Post';
        case 'Premium':
        case 'Đăng ký Premium':
          return 'Premium';
        case 'Report':
        case 'Bài viết bị báo cáo':
          return 'Report';
        default:
          return type;
      }
    };

    const mapDetailsToEnglish = (details) => {
      if (!details) return '';
      if (details.includes('Đăng ký tài khoản mới')) return 'New account registered';
      if (details.includes('Đăng ký gói')) return details.replace('Đăng ký gói', 'Subscribed to package');
      return details;
    };

    const fontName = 'helvetica';
    doc.setFont(fontName, 'normal');

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(fontName, 'bold');
    const title = 'SYSTEM DETAILED STATISTICS REPORT - MiniSocial';
    doc.text(title, pageW / 2, 13, { align: 'center' });

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.setFont(fontName, 'normal');
    const dateRange = `Period: ${statsStartDate} to ${statsEndDate}   |   Exported: ${now}`;
    doc.text(dateRange, pageW / 2, 26, { align: 'center' });

    // Summary boxes
    const summaryData = [
      { label: 'Joined Users', value: detailedStats.totalJoined ?? 0, color: [99, 102, 241] },
      { label: 'New Posts', value: detailedStats.totalPosts ?? 0, color: [16, 185, 129] },
      { label: 'Premium Subs', value: detailedStats.totalPremiums ?? 0, color: [245, 158, 11] },
      { label: 'Reported Posts', value: detailedStats.totalReports ?? 0, color: [239, 68, 68] }
    ];

    let sx = 14;
    summaryData.forEach(s => {
      doc.setFillColor(...s.color);
      doc.roundedRect(sx, 30, 60, 18, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont(fontName, 'bold');
      doc.text(s.label.toUpperCase(), sx + 30, 37, { align: 'center' });
      doc.setFontSize(14);
      doc.text(String(s.value), sx + 30, 44, { align: 'center' });
      sx += 65;
    });

    // Daily stats table
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont(fontName, 'bold');
    doc.text('Daily Statistics', 14, 56);

    const dailyArr = detailedStats.dailyStats?.$values || detailedStats.dailyStats || [];
    const filteredDaily = dailyArr.filter(d =>
      (d.joinedUsers > 0 || d.createdPosts > 0 || d.premiumRegistrations > 0 || d.reportedPosts > 0)
    );

    autoTable(doc, {
      startY: 59,
      head: [['Date', 'Joined', 'Posts', 'Premium', 'Reports']],
      body: filteredDaily.map(d => [d.date, d.joinedUsers, d.createdPosts, d.premiumRegistrations, d.reportedPosts]),
      styles: { font: fontName, fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto'
    });

    // Events detail table
    doc.addPage();
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageW, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(fontName, 'bold');
    doc.text('DETAILED EVENT LOG', pageW / 2, 10, { align: 'center' });

    const eventsArr = detailedStats.events?.$values || detailedStats.events || [];
    const filteredEvents = statsFilterType === 'all'
      ? eventsArr
      : eventsArr.filter(e => e.type === statsFilterType);

    autoTable(doc, {
      startY: 18,
      head: [['Action', 'Name', 'Username', 'Email', 'Date/Time', 'Details']],
      body: filteredEvents.map(e => [
        cleanStr(mapEventTypeToEnglish(e.typeName)),
        cleanStr(e.fullName),
        '@' + e.username,
        e.email,
        e.time,
        cleanStr(mapDetailsToEnglish(e.details || '').substring(0, 80))
      ]),
      styles: { font: fontName, fontSize: 6, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 32 },
        2: { cellWidth: 24 },
        3: { cellWidth: 44 },
        4: { cellWidth: 30 },
        5: { cellWidth: 'auto' }
      },
      margin: { left: 10, right: 10 }
    });

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(6);
      doc.setTextColor(160, 160, 160);
      doc.setFont(fontName, 'normal');
      doc.text(`MiniSocial Admin Report  |  ${now}  |  Page ${i}/${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
    }

    doc.save(`MiniSocial_Report_${statsStartDate}_${statsEndDate}.pdf`);
    toast.success('PDF report exported successfully!');
    setIsStatsLoading(false);
  };


  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getAllReports();
      setReports(data || []);
    } catch (error) {
      toast.error(t('admin.toasts.errorGetReports'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPackages();
      setPackages(res || []);
    } catch (error) {
      toast.error(t('admin.toasts.errorGetPackages'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePackage = async (id, data) => {
    setIsUpdatingPackage(true);
    try {
      await adminService.updatePackage(id, data);
      toast.success(t('admin.toasts.successUpdatePackage'));
      fetchPackages();
    } catch (error) {
      toast.error(t('admin.toasts.errorUpdatePackage'));
    } finally {
      setIsUpdatingPackage(false);
    }
  };

  const handleCreatePackage = async () => {
    setIsUpdatingPackage(true);
    try {
      await adminService.createPackage(newPackage);
      toast.success(t('admin.toasts.successCreatePackage'));
      setIsCreateModalOpen(false);
      setNewPackage({ name: '', price: 0, description: '', features: '', isActive: true });
      fetchPackages();
    } catch (error) {
      toast.error(t('admin.toasts.errorCreatePackage'));
    } finally {
      setIsUpdatingPackage(false);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      const result = await reportService.resolveReport(reportId, action);
      setReports(reports.map(r => r.reportId === reportId ? { ...r, status: action } : r));
      toast.success(result || t('admin.toasts.successResolveReport'));
    } catch (error) {
      toast.error(t('admin.toasts.errorResolveReport'));
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
      toast.success(newStatus ? t('admin.toasts.successMaintenanceOn') : t('admin.toasts.successMaintenanceOff'));
    } catch (error) {
      toast.error(t('admin.toasts.errorMaintenance'));
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
      toast.info(newStatus ? t('admin.toasts.successUnlockUser') : t('admin.toasts.successLockUser'));
    } catch (error) {
      toast.error(t('admin.toasts.errorToggleStatus'));
    }
  };

  const usersTotalPages = Math.ceil(usersTotalCount / PAGE_SIZE);

  const handleUserPageChange = (newPage) => {
    if (newPage < 1 || newPage > usersTotalPages || isLoading) return;
    fetchUsers(newPage, searchQuery);
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = users;

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    g.creatorName.toLowerCase().includes(searchQuery.toLowerCase())
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
          <SidebarItem icon={<LayoutDashboard size={20} />} label={t('admin.sidebar.dashboard')} active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
          <SidebarItem icon={<Users size={20} />} label={t('admin.sidebar.users')} active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
          <SidebarItem icon={<Layers size={20} />} label={t('admin.sidebar.groups')} active={activeTab === 'groups'} onClick={() => { setActiveTab('groups'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
          <SidebarItem icon={<AlertTriangle size={20} />} label={t('admin.sidebar.reports')} active={activeTab === 'reports'} activeCount={reports.filter(r => r.status === 'Pending').length} onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
          <SidebarItem icon={<Wallet size={20} />} label={t('admin.sidebar.premium')} active={activeTab === 'premium'} onClick={() => { setActiveTab('premium'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
          
          <div className={`py-4 px-4 text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} uppercase tracking-widest mt-4`}>{t('admin.sidebar.analysis')}</div>
          <SidebarItem icon={<BarChart3 size={20} />} label={t('admin.sidebar.analytics')} active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
          <SidebarItem icon={<PieChart size={20} />} label={t('admin.sidebar.stats')} isDarkMode={isDarkMode} disabled />
          
          <div className={`py-4 px-4 text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} uppercase tracking-widest mt-4`}>{t('admin.sidebar.system')}</div>
          <SidebarItem icon={<Settings size={20} />} label={t('admin.sidebar.settings')} isDarkMode={isDarkMode} disabled />
        </nav>

        <div className={`p-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} mt-auto`}>
          <div className="space-y-1">
             <SidebarItem icon={<HelpCircle size={20} />} label={t('admin.sidebar.help')} isDarkMode={isDarkMode} />
          </div>
          
          <div className={`mt-8 flex items-center justify-between ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} p-2 rounded-2xl border ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
             <button 
              onClick={() => setIsDarkMode(false)} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${!isDarkMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
             >
                <Sun size={14} />
                <span className="text-[10px] font-bold uppercase">{t('admin.sidebar.light')}</span>
             </button>
             <button 
              onClick={() => setIsDarkMode(true)} 
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${isDarkMode ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-400'}`}
             >
                <Moon size={14} />
                <span className="text-[10px] font-bold uppercase">{t('admin.sidebar.dark')}</span>
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
            <h1 className={`text-2xl md:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tight`}>{t('admin.header.welcome', { name: user?.fullName?.split(' ')[0] || 'Admin' })}</h1>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} mt-0.5 italic`}>{t('admin.header.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className={`hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-2xl border shadow-sm w-72 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
               <Search size={18} className="text-slate-400" />
               <input 
                type="text" 
                placeholder={
                  activeTab === 'users' ? "Tìm kiếm người dùng..." :
                  activeTab === 'groups' ? "Tìm kiếm nhóm..." :
                  activeTab === 'reports' ? "Tìm kiếm báo cáo..." :
                  "Tìm kiếm..."
                } 
                className="bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>

            <div className="flex items-center gap-2 md:gap-3">
               <button 
                  onClick={() => i18n.changeLanguage(i18n.language.startsWith('vi') ? 'en' : 'vi')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border shadow-sm transition-all active:scale-95 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-700'}`}
                  title={t('admin.header.switchLanguage') || 'Chuyển đổi ngôn ngữ'}
               >
                  <Globe size={16} className="text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                    {i18n.language.startsWith('vi') ? 'VI' : 'EN'}
                  </span>
               </button>

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
                    {isMaintenance ? t('admin.header.maintainOn') : t('admin.header.maintainOff')}
                  </span>
                  {isTogglingMaintenance && <RefreshCw size={12} className="animate-spin ml-1" />}
               </button>

               <div className={`h-10 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} hidden md:block mx-1`}></div>

               <div className="flex items-center gap-3 pl-1 relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setIsUserDropdownOpen(prev => !prev)}
                    className="flex items-center gap-3 cursor-pointer focus:outline-none group"
                  >
                    <div className="hidden sm:block text-right">
                      <p className={`text-sm font-black leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user?.fullName || 'Administrator'}</p>
                      <p className={`text-[10px] font-bold mt-1 uppercase tracking-tighter ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>@{user?.username}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl overflow-hidden border-2 shadow-xl transition-transform group-hover:scale-105 ${isDarkMode ? 'border-slate-800 shadow-indigo-900/20' : 'border-white shadow-indigo-100/40'}`}>
                      <img src={getFullAvatarUrl(user?.avatarUrl, user?.fullName)} alt="Admin" className="w-full h-full object-cover" />
                    </div>
                  </button>

                  {/* Dropdown */}
                  {isUserDropdownOpen && (
                    <div className={`absolute right-0 top-14 w-52 rounded-2xl border shadow-2xl z-[200] overflow-hidden transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                    }`}>
                      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user?.fullName || 'Administrator'}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-tight mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>@{user?.username}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => { setIsUserDropdownOpen(false); logout(); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            isDarkMode
                              ? 'text-rose-400 hover:bg-rose-950/40'
                              : 'text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <LogOut size={16} />
                          {t('admin.sidebar.logout')}
                        </button>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 custom-scrollbar">
          
          {activeTab === 'dashboard' ? (
            /* --- DASHBOARD TAB --- */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* STAT CARDS */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    title={t('admin.dashboard.totalUsers')} 
                    label={t('admin.dashboard.totalRegistered')}
                    value={stats?.totalUsers?.toLocaleString() || '0'} 
                    trend="+12.1%" 
                    isUp={true} 
                    icon={<Users className="text-indigo-500" />}
                    isDarkMode={isDarkMode}
                  />
                  <StatCard 
                    title={t('admin.dashboard.activeUsers')} 
                    label={t('admin.dashboard.activeMembers')}
                    value={stats?.activeUsers?.toLocaleString() || '0'} 
                    trend="+8.3%" 
                    isUp={true} 
                    icon={<UserCheck className="text-emerald-500" />}
                    isDarkMode={isDarkMode}
                  />
                  <StatCard 
                    title={t('admin.dashboard.totalPosts')} 
                    label={t('admin.dashboard.totalPostsLabel')}
                    value={stats?.totalPosts?.toLocaleString() || '0'} 
                    trend="-2.4%" 
                    isUp={false} 
                    icon={<TrendingUp className="text-amber-500" />}
                    isDarkMode={isDarkMode}
                  />
                  <StatCard 
                    title={t('admin.dashboard.activeReports')} 
                    label={t('admin.dashboard.activeReportsLabel')}
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
                          <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.dashboard.systemTraffic')}</h3>
                          <div className="flex items-center gap-6 mt-2">
                             <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.dashboard.growth')}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-300"></span>
                                <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.dashboard.retention')}</span>
                             </div>
                          </div>
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
                       <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.dashboard.health')}</h3>
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
                             <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.dashboard.engagement')}</p>
                             <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>75%</p>
                          </div>
                       </div>
                       
                       <div className="w-full space-y-4">
                          <BudgetRow color="bg-indigo-500" label={t('admin.dashboard.activeUsersLabel')} value="75%" amount="5,950" isDarkMode={isDarkMode} />
                          <BudgetRow color="bg-indigo-300" label={t('admin.dashboard.returning')} value="15%" amount="400" isDarkMode={isDarkMode} />
                          <BudgetRow color={isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} label={t('admin.dashboard.others')} value="10%" amount="120" isDarkMode={isDarkMode} />
                       </div>
                    </div>
                  </div>
               </div>

               {/* BOTTOM ROW (Table equivalent) */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className={`lg:col-span-8 p-8 rounded-[2.5rem] border shadow-sm shadow-indigo-500/5 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                     <div className="flex items-center justify-between mb-8">
                        <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.dashboard.recentReports')}</h3>
                        <button 
                          onClick={() => setActiveTab('reports')}
                          className={`text-[10px] font-black uppercase tracking-widest hover:underline ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
                        >
                          {t('admin.dashboard.seeAll')}
                        </button>
                     </div>
                     
                     <div className="overflow-x-auto overflow-y-hidden">
                        <table className="w-full text-left">
                           <thead>
                              <tr className={`text-[10px] font-black uppercase tracking-[0.2em] border-b ${isDarkMode ? 'text-slate-700 border-slate-800' : 'text-slate-300 border-slate-50'}`}>
                                 <th className="pb-4">{t('admin.dashboard.table.reporter')}</th>
                                 <th className="pb-4">{t('admin.dashboard.table.category')}</th>
                                 <th className="pb-4">{t('admin.dashboard.table.status')}</th>
                                 <th className="pb-4 text-right">{t('admin.dashboard.table.time')}</th>
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
                                         <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.dashboard.table.moderation')}</p>
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
                                        {new Date(report.createdAt).toLocaleDateString(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US')}
                                      </p>
                                   </td>
                                </tr>
                              ))}
                              {reports.length === 0 && (
                                <tr>
                                   <td colSpan="4" className="py-10 text-center text-slate-600 font-bold italic text-sm">{t('admin.dashboard.noRecentReports')}</td>
                                </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  <div className={`lg:col-span-4 p-8 rounded-[2.5rem] border shadow-sm shadow-indigo-500/5 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                     <div className="flex items-center justify-between mb-8">
                        <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.dashboard.securityGoals')}</h3>
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors"><ArrowUpRight size={20} /></button>
                     </div>
                     
                     <div className="space-y-8 mt-4">
                        <GoalProgress label={t('admin.dashboard.communityModeration')} value="1,650" target="2,000" percent={82} color="bg-indigo-500" isDarkMode={isDarkMode} />
                        <GoalProgress label={t('admin.dashboard.systemOptimization')} value="60,000" target="100,000" percent={60} color="bg-indigo-300" isDarkMode={isDarkMode} />
                        <GoalProgress label={t('admin.dashboard.reportResolution')} value="150" target="5,000" percent={3} color="bg-indigo-200" isDarkMode={isDarkMode} />
                     </div>
                  </div>
               </div>
            </div>
          ) : activeTab === 'users' ? (
            /* --- USERS TAB --- */
            <div className={`rounded-[2.5rem] border shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.users.title')}</h2>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t('admin.users.subtitle', { count: usersTotalCount })}</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => fetchUsers(usersCurrentPage)} className={`p-3 rounded-2xl border transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600'}`}>
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                     </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className={`text-[10px] font-black uppercase tracking-[0.2em] border-b ${isDarkMode ? 'text-slate-700 border-slate-800' : 'text-slate-400 border-slate-50'}`}>
                           <th className="pb-6 px-4">{t('admin.users.table.profile')}</th>
                           <th className="pb-6 px-4">{t('admin.users.table.contact')}</th>
                           <th className="pb-6 px-4">{t('admin.users.table.joined')}</th>
                           <th className="pb-6 px-4 text-center">{t('admin.users.table.status')}</th>
                           <th className="pb-6 px-4 text-right">{t('admin.users.table.actions')}</th>
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
                                      <p className={`text-xs font-bold tracking-tight ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>@{userItem.username}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="py-5 px-4">
                                <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{userItem.email}</p>
                             </td>
                             <td className="py-5 px-4">
                                <p className={`text-xs font-black ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{new Date(userItem.createdAt).toLocaleDateString(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US')}</p>
                             </td>
                             <td className="py-5 px-4 text-center">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                  userItem.isActive 
                                  ? (isDarkMode ? 'bg-emerald-900/20 text-emerald-500' : 'bg-emerald-50 text-emerald-600') 
                                  : (isDarkMode ? 'bg-rose-900/20 text-rose-500' : 'bg-rose-50 text-rose-600')
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${userItem.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                  {userItem.isActive ? t('admin.users.status.active') : t('admin.users.status.banned')}
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
                                      title={userItem.isActive ? t('admin.users.actions.restrict') : t('admin.users.actions.restore')}
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

               {/* PAGINATION */}
               {usersTotalPages > 1 && (
                 <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: isDarkMode ? '#1e293b' : '#f1f5f9' }}>
                   <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                     {t('admin.users.pagination.showing', {
                       from: (usersCurrentPage - 1) * PAGE_SIZE + 1,
                       to: Math.min(usersCurrentPage * PAGE_SIZE, usersTotalCount),
                       total: usersTotalCount
                     }) || `Hiển thị ${(usersCurrentPage - 1) * PAGE_SIZE + 1}–${Math.min(usersCurrentPage * PAGE_SIZE, usersTotalCount)} / ${usersTotalCount} người dùng`}
                   </p>
                   <div className="flex items-center gap-2">
                     <button
                       onClick={() => handleUserPageChange(usersCurrentPage - 1)}
                       disabled={usersCurrentPage <= 1 || isLoading}
                       className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                         isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-600 hover:text-indigo-600'
                       }`}
                     >
                       ← {t('admin.users.pagination.prev') || 'Trước'}
                     </button>

                     <div className="flex items-center gap-1">
                       {Array.from({ length: usersTotalPages }, (_, i) => i + 1)
                         .filter(p => p === 1 || p === usersTotalPages || Math.abs(p - usersCurrentPage) <= 1)
                         .reduce((acc, p, idx, arr) => {
                           if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                           acc.push(p);
                           return acc;
                         }, [])
                         .map((item, idx) =>
                           item === '...' ? (
                             <span key={`ellipsis-${idx}`} className={`px-2 text-xs font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>…</span>
                           ) : (
                             <button
                               key={item}
                               onClick={() => handleUserPageChange(item)}
                               disabled={isLoading}
                               className={`w-9 h-9 rounded-xl text-xs font-black border transition-all active:scale-95 ${
                                 item === usersCurrentPage
                                   ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                   : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400' : 'bg-white border-slate-100 text-slate-600 hover:text-indigo-600')
                               }`}
                             >
                               {item}
                             </button>
                           )
                         )
                       }
                     </div>

                     <button
                       onClick={() => handleUserPageChange(usersCurrentPage + 1)}
                       disabled={usersCurrentPage >= usersTotalPages || isLoading}
                       className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                         isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-600 hover:text-indigo-600'
                       }`}
                     >
                       {t('admin.users.pagination.next') || 'Sau'} →
                     </button>
                   </div>
                 </div>
               )}
            </div>
          ) : activeTab === 'groups' ? (
            /* --- GROUPS TAB --- */
            <div className={`rounded-[2.5rem] border shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.groups.title')}</h2>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t('admin.groups.subtitle', { count: filteredGroups.length })}</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={fetchGroups} className={`p-3 rounded-2xl border transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600'}`}>
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                     </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className={`text-[10px] font-black uppercase tracking-[0.2em] border-b ${isDarkMode ? 'text-slate-700 border-slate-800' : 'text-slate-400 border-slate-50'}`}>
                           <th className="pb-6 px-4">{t('admin.groups.table.name')}</th>
                           <th className="pb-6 px-4">{t('admin.groups.table.privacy')}</th>
                           <th className="pb-6 px-4">{t('admin.groups.table.creator')}</th>
                           <th className="pb-6 px-4 text-center">{t('admin.groups.table.members')}</th>
                           <th className="pb-6 px-4">{t('admin.groups.table.joined')}</th>
                           <th className="pb-6 px-4 text-right">{t('admin.groups.table.actions')}</th>
                        </tr>
                     </thead>
                     <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                        {filteredGroups.map(g => (
                          <tr key={g.groupId} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                             <td className="py-5 px-4">
                                <div className="flex items-center gap-4">
                                   <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 shadow-lg shrink-0 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-white'}`}>
                                      <img 
                                        src={getFullAvatarUrl(g.avatarUrl, g.name)} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                        onError={e => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(g.name)}`}
                                      />
                                   </div>
                                   <div>
                                      <p className={`font-black leading-none mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{g.name}</p>
                                      <p className={`text-xs font-bold tracking-tight ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{g.category || t('admin.groups.unclassified')}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="py-5 px-4">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                  g.privacy === 'Public' 
                                  ? (isDarkMode ? 'bg-emerald-900/20 text-emerald-500' : 'bg-emerald-50 text-emerald-600') 
                                  : (isDarkMode ? 'bg-amber-900/20 text-amber-500' : 'bg-amber-50 text-amber-600')
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${g.privacy === 'Public' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                  {g.privacy === 'Public' ? t('admin.groups.status.public') : t('admin.groups.status.private')}
                                </span>
                             </td>
                             <td className="py-5 px-4">
                                <div>
                                   <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>{g.creatorName}</p>
                                   <p className={`text-[10px] text-slate-400`}>@{g.creatorUsername}</p>
                                </div>
                             </td>
                             <td className="py-5 px-4 text-center">
                                <p className={`text-sm font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{g.memberCount} {t('admin.groups.table.members').toLowerCase()}</p>
                             </td>
                             <td className="py-5 px-4">
                                <p className={`text-xs font-black ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{new Date(g.createdAt).toLocaleDateString(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US')}</p>
                             </td>
                             <td className="py-5 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                   <button 
                                      onClick={() => setDeleteGroupTarget(g)}
                                      className={`p-2.5 rounded-xl border transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-rose-500 hover:bg-rose-950/30' : 'bg-white border-slate-100 text-rose-500 hover:bg-rose-50'}`}
                                      title={t('admin.groups.actions.delete')}
                                   >
                                      <Trash2 size={18} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                        ))}
                        {filteredGroups.length === 0 && !isLoading && (
                          <tr>
                             <td colSpan="6" className="py-10 text-center text-slate-400 font-bold italic text-sm">{t('admin.groups.noGroups')}</td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          ) : activeTab === 'premium' ? (
            /* --- PREMIUM TAB --- */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className={`rounded-[2.5rem] border shadow-sm p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.premium.title')}</h2>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t('admin.premium.subtitle')}</p>
                     </div>
                     <div className="flex gap-3">
                        <button 
                           onClick={() => setIsCreateModalOpen(true)}
                           className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 text-[11px] font-black uppercase tracking-widest"
                        >
                           <ShieldCheck size={18} />
                           {t('admin.premium.createBtn')}
                        </button>
                        <button onClick={fetchPackages} className={`p-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600'}`}>
                           <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {packages.map(pkg => (
                        <div key={pkg.id} className={`p-8 rounded-[2rem] border relative overflow-hidden transition-all hover:shadow-xl ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                           <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-4">
                                 <div className={`p-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20`}>
                                    <Wallet size={24} />
                                 </div>
                                 <div>
                                    <input 
                                       type="text" 
                                       defaultValue={pkg.name}
                                       onBlur={(e) => {
                                          if (e.target.value !== pkg.name && e.target.value.trim() !== "") {
                                             handleUpdatePackage(pkg.id, { ...pkg, name: e.target.value });
                                          }
                                       }}
                                       className={`bg-transparent border-none font-black text-lg outline-none w-full focus:ring-0 p-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                                    />
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.plan')}</p>
                                 </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={pkg.isActive}
                                    onChange={(e) => handleUpdatePackage(pkg.id, { ...pkg, isActive: e.target.checked })}
                                 />
                                 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                           </div>

                           <div className="space-y-6">
                              <div>
                                 <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.price')}</label>
                                 <div className="relative">
                                    <input 
                                       type="text" 
                                       defaultValue={pkg.price?.toLocaleString('vi-VN')}
                                       onBlur={(e) => {
                                          const rawVal = e.target.value.replace(/\./g, '').replace(/,/g, '.');
                                          const val = parseFloat(rawVal);
                                          if (!isNaN(val) && val !== pkg.price) {
                                             handleUpdatePackage(pkg.id, { ...pkg, price: val });
                                          }
                                       }}
                                       className={`w-full px-5 py-4 rounded-2xl border font-black text-xl outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                       <Globe size={20} />
                                    </div>
                                 </div>
                              </div>

                              <div>
                                 <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.description')}</label>
                                 <textarea 
                                    defaultValue={pkg.description}
                                    onBlur={(e) => {
                                       if (e.target.value !== pkg.description) {
                                          handleUpdatePackage(pkg.id, { ...pkg, description: e.target.value });
                                       }
                                    }}
                                    rows="3"
                                    className={`w-full px-5 py-4 rounded-2xl border font-bold text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 resize-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-white border-slate-100 text-slate-600'}`}
                                 ></textarea>
                              </div>

                              <div>
                                 <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.features')}</label>
                                 <div className="grid grid-cols-2 gap-3">
                                    {[
                                      { id: 'Filter Age', label: t('admin.premium.featureLabels.filterAge') },
                                      { id: 'No Ads', label: t('admin.premium.featureLabels.noAds') },
                                      { id: 'See Identity', label: t('admin.premium.featureLabels.seeIdentity') },
                                      { id: 'Radar Premium', label: t('admin.premium.featureLabels.radarPremium') }
                                    ].map(feat => {
                                       const currentFeatures = pkg.features ? pkg.features.split(',').map(f => f.trim()) : [];
                                       const isChecked = currentFeatures.includes(feat.id);
                                       
                                       return (
                                          <label key={feat.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                             isChecked 
                                             ? (isDarkMode ? 'bg-indigo-900/20 border-indigo-500 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600')
                                             : (isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-500' : 'bg-white border-slate-100 text-slate-400')
                                          }`}>
                                             <input 
                                                type="checkbox"
                                                className="sr-only"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                   let newFeatures;
                                                   if (e.target.checked) {
                                                      newFeatures = [...currentFeatures, feat.id];
                                                   } else {
                                                      newFeatures = currentFeatures.filter(f => f !== feat.id);
                                                   }
                                                   handleUpdatePackage(pkg.id, { ...pkg, features: newFeatures.join(', ') });
                                                }}
                                             />
                                             <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                                {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                             </div>
                                             <span className="text-[11px] font-bold">{feat.label}</span>
                                          </label>
                                       );
                                    })}
                                 </div>
                              </div>
                           </div>

                           {isUpdatingPackage && (
                              <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] flex items-center justify-center z-10">
                                 <RefreshCw size={24} className="animate-spin text-indigo-600" />
                              </div>
                           )}
                        </div>
                     ))}
                     
                     {packages.length === 0 && !isLoading && (
                        <div className="col-span-full py-20 text-center">
                           <p className="text-slate-400 font-bold italic">{t('admin.premium.noPackages')}</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          ) : activeTab === 'analytics' ? (
            /* --- ANALYTICS TAB --- */
            (() => {
              const eventsArr = detailedStats?.events?.$values || detailedStats?.events || [];
              const dailyArr = detailedStats?.dailyStats?.$values || detailedStats?.dailyStats || [];
              const filteredEvents = eventsArr.filter(e => {
                const typeOk = statsFilterType === 'all' || e.type === statsFilterType;
                const q = statsSearchQuery.toLowerCase();
                const queryOk = !q || e.fullName?.toLowerCase().includes(q) || e.username?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.details?.toLowerCase().includes(q);
                return typeOk && queryOk;
              });

              const maxVal = dailyArr.length > 0 ? Math.max(1, ...dailyArr.map(d => Math.max(d.joinedUsers || 0, d.createdPosts || 0, d.premiumRegistrations || 0, d.reportedPosts || 0))) : 1;
              const eventColors = { Register: '#6366f1', Post: '#10b981', Premium: '#f59e0b', Report: '#ef4444' };
              const typeOptions = [
                { value: 'all', label: t('admin.analyticsPanel.allEvents') },
                { value: 'Register', label: 'Đăng ký tài khoản' },
                { value: 'Post', label: 'Đăng bài viết' },
                { value: 'Premium', label: 'Đăng ký Premium' },
                { value: 'Report', label: 'Bài viết bị báo cáo' }
              ];

              return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Header */}
                  <div className={`rounded-[2.5rem] border shadow-sm p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                      <div>
                        <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.analyticsPanel.title')}</h2>
                        <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t('admin.analyticsPanel.subtitle')}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                          <Calendar size={16} className="text-indigo-500" />
                          <input type="date" value={statsStartDate} onChange={e => setStatsStartDate(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold cursor-pointer" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                          <span className="text-slate-400 font-bold">→</span>
                          <input type="date" value={statsEndDate} onChange={e => setStatsEndDate(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold cursor-pointer" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                        </div>
                        <button onClick={() => fetchDetailedStats(statsStartDate, statsEndDate)} className={`px-5 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 text-indigo-600 hover:bg-indigo-50'}`}>
                          <RefreshCw size={15} className={`inline mr-1.5 ${isStatsLoading ? 'animate-spin' : ''}`} />
                          {isStatsLoading ? 'Đang tải...' : 'Tải dữ liệu'}
                        </button>
                        <button onClick={handleExportPDF} disabled={!detailedStats} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-40">
                          <Download size={15} />
                          {t('admin.analyticsPanel.exportBtn')}
                        </button>
                      </div>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      {[
                        { label: t('admin.analyticsPanel.joinedUsers'), value: detailedStats?.totalJoined ?? 0, color: 'text-indigo-500', bg: isDarkMode ? 'bg-indigo-950/30' : 'bg-indigo-50', border: isDarkMode ? 'border-indigo-900/40' : 'border-indigo-100' },
                        { label: t('admin.analyticsPanel.posts'), value: detailedStats?.totalPosts ?? 0, color: 'text-emerald-500', bg: isDarkMode ? 'bg-emerald-950/30' : 'bg-emerald-50', border: isDarkMode ? 'border-emerald-900/40' : 'border-emerald-100' },
                        { label: t('admin.analyticsPanel.premiumSubs'), value: detailedStats?.totalPremiums ?? 0, color: 'text-amber-500', bg: isDarkMode ? 'bg-amber-950/30' : 'bg-amber-50', border: isDarkMode ? 'border-amber-900/40' : 'border-amber-100' },
                        { label: t('admin.analyticsPanel.reportedPosts'), value: detailedStats?.totalReports ?? 0, color: 'text-rose-500', bg: isDarkMode ? 'bg-rose-950/30' : 'bg-rose-50', border: isDarkMode ? 'border-rose-900/40' : 'border-rose-100' }
                      ].map((card, i) => (
                        <div key={i} className={`p-5 rounded-2xl border ${card.bg} ${card.border}`}>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{card.label}</p>
                          <p className={`text-3xl font-black ${card.color}`}>{isStatsLoading ? '—' : card.value.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>

                    {/* SVG Bar Chart */}
                    {dailyArr.length > 0 && (
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Biểu đồ theo ngày</p>
                        <div className="flex gap-4 mb-3 flex-wrap">
                          {[['#6366f1','Người tham gia'], ['#10b981','Bài viết'], ['#f59e0b','Premium'], ['#ef4444','Báo cáo']].map(([c,l]) => (
                            <div key={l} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ background: c }}></span><span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{l}</span></div>
                          ))}
                        </div>
                        <div className="overflow-x-auto">
                          <svg width={Math.max(dailyArr.length * 44 + 24, 600)} height="160" className="min-w-full">
                            {dailyArr.map((d, i) => {
                              const x = i * 44 + 12;
                              const bars = [
                                { val: d.joinedUsers || 0, color: '#6366f1' },
                                { val: d.createdPosts || 0, color: '#10b981' },
                                { val: d.premiumRegistrations || 0, color: '#f59e0b' },
                                { val: d.reportedPosts || 0, color: '#ef4444' }
                              ];
                              return (
                                <g key={d.date}>
                                  {bars.map((b, bi) => {
                                    const h = maxVal > 0 ? Math.max(2, (b.val / maxVal) * 120) : 2;
                                    return <rect key={bi} x={x + bi * 7} y={130 - h} width={5} height={h} rx={2} fill={b.color} opacity={0.85} />;
                                  })}
                                  <text x={x + 14} y={150} fontSize="6" fill={isDarkMode ? '#475569' : '#94a3b8'} textAnchor="middle">{d.date?.slice(5)}</text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    )}
                    {isStatsLoading && (
                      <div className="flex items-center justify-center py-16 gap-3">
                        <RefreshCw size={20} className="animate-spin text-indigo-500" />
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Đang tải dữ liệu thống kê...</p>
                      </div>
                    )}
                    {!detailedStats && !isStatsLoading && (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <BarChart3 size={48} className="text-slate-300" />
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Chọn khoảng thời gian và nhấn "Tải dữ liệu" để xem thống kê.</p>
                      </div>
                    )}
                  </div>

                  {/* Event detail log */}
                  {detailedStats && (
                    <div className={`rounded-[2.5rem] border shadow-sm p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Chi tiết từng sự kiện</h3>
                          <p className={`text-xs font-medium mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{filteredEvents.length} sự kiện</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {/* Filter type */}
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <Filter size={13} className="text-indigo-500" />
                            <select value={statsFilterType} onChange={e => setStatsFilterType(e.target.value)} className={`bg-transparent border-none outline-none text-xs font-bold cursor-pointer ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                          {/* Search */}
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <Search size={13} className="text-slate-400" />
                            <input type="text" placeholder="Tìm tên, email..." value={statsSearchQuery} onChange={e => setStatsSearchQuery(e.target.value)} className={`bg-transparent border-none outline-none text-xs font-bold w-40 ${isDarkMode ? 'text-slate-300 placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'}`} />
                          </div>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                          <thead>
                            <tr className={`text-[9px] font-black uppercase tracking-[0.2em] border-b ${isDarkMode ? 'text-slate-700 border-slate-800' : 'text-slate-300 border-slate-50'}`}>
                              <th className="pb-4 px-3">{t('admin.analyticsPanel.table.eventType')}</th>
                              <th className="pb-4 px-3">{t('admin.analyticsPanel.table.user')}</th>
                              <th className="pb-4 px-3">Email</th>
                              <th className="pb-4 px-3">{t('admin.analyticsPanel.table.time')}</th>
                              <th className="pb-4 px-3">{t('admin.analyticsPanel.table.details')}</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                            {filteredEvents.slice(0, 200).map((e, idx) => {
                              const color = eventColors[e.type] || '#6366f1';
                              return (
                                <tr key={idx} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                                  <td className="py-3 px-3">
                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block" style={{ background: color + '20', color }}>
                                      {e.typeName}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <p className={`text-xs font-black leading-none mb-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{e.fullName}</p>
                                    <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>@{e.username}</p>
                                  </td>
                                  <td className={`py-3 px-3 text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{e.email}</td>
                                  <td className={`py-3 px-3 text-[10px] font-black ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} whitespace-nowrap`}>{e.time}</td>
                                  <td className={`py-3 px-3 text-[10px] font-medium max-w-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    <p className="line-clamp-2">{e.details}</p>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredEvents.length === 0 && (
                              <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-bold italic text-sm">Không có dữ liệu phù hợp</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {filteredEvents.length > 200 && (
                        <p className={`text-center text-xs font-bold mt-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Hiển thị 200 / {filteredEvents.length} sự kiện. Xuất PDF để xem toàn bộ.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            /* --- REPORTS TAB --- */
            <div className={`rounded-[2.5rem] border shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.dashboard.communityModeration')}</h2>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t('admin.dashboard.totalReports', { count: reports.length })}</p>
                  </div>
                  <button onClick={fetchReports} className={`p-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600'}`}>
                     <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                  </button>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className={`text-[10px] font-black uppercase tracking-[0.2em] border-b ${isDarkMode ? 'text-slate-700 border-slate-800' : 'text-slate-400 border-slate-50'}`}>
                           <th className="pb-6 px-4">{t('admin.dashboard.table.flaggedContent')}</th>
                           <th className="pb-6 px-4 text-center">{t('admin.dashboard.table.identity')}</th>
                           <th className="pb-6 px-4">{t('admin.dashboard.table.status')}</th>
                           <th className="pb-6 px-4 text-right">{t('admin.dashboard.table.actions')}</th>
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
                                <p className={`text-[10px] font-bold tracking-tighter ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{new Date(report.createdAt).toLocaleString(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US')}</p>
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
                                  {t('admin.dashboard.table.details')}
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
                  <p className={`text-sm font-bold mb-6 tracking-tighter ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>@{selectedUser.username}</p>
                  
                  <div className="w-full space-y-4 text-left mb-8">
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>Email</p>
                      <p className={`text-sm font-black break-all ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{selectedUser.email}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>{t('admin.modals.userDetails.globalStatus')}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedUser.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {selectedUser.isActive ? t('admin.users.status.active') : t('admin.modals.userDetails.restricted')}
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
                    {selectedUser.isActive ? t('admin.modals.userDetails.restrictBtn') : t('admin.modals.userDetails.restoreBtn')}
                  </button>
                  <button onClick={() => setSelectedUser(null)} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}>{t('admin.modals.userDetails.closeBtn')}</button>
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
                    <h3 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.modals.reportDetails.title')}</h3>
                 </div>
                 <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
              </div>
              
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                       <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>{t('admin.modals.reportDetails.sourceIdentity')}</p>
                       <p className={`text-sm font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{selectedReport.reporterName}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                       <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>{t('admin.modals.reportDetails.platformType')}</p>
                       <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black rounded uppercase">{selectedReport.targetType}</span>
                    </div>
                 </div>

                 <div className={`p-6 rounded-2xl border italic relative overflow-hidden ${isDarkMode ? 'bg-rose-950/10 border-rose-900/30' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="absolute top-2 right-2 opacity-5"><TrendingDown size={60} /></div>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-rose-900' : 'text-rose-300'}`}>{t('admin.modals.reportDetails.originalContent')}</p>
                    <p className={`text-sm font-bold leading-relaxed italic ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>"{selectedReport.targetContent}"</p>
                 </div>

                 <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>{t('admin.modals.reportDetails.violatedStandard')}</p>
                    <p className="text-base font-black text-rose-600 mb-1">{selectedReport.reason}</p>
                    <p className={`text-xs font-medium leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{selectedReport.description || t('admin.modals.reportDetails.noDescription')}</p>
                 </div>

                 <div className="flex gap-4 pt-4">
                    {selectedReport.status === 'Pending' ? (
                      <>
                        <button 
                          onClick={() => { handleResolveReport(selectedReport.reportId, 'Resolved'); setSelectedReport(null); }}
                          className={`flex-1 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${isDarkMode ? 'shadow-indigo-900/20 hover:bg-indigo-500' : 'shadow-indigo-100 hover:bg-indigo-700'}`}
                        >
                           {t('admin.modals.reportDetails.resolveBtn')}
                        </button>
                        <button 
                          onClick={() => { handleResolveReport(selectedReport.reportId, 'Dismissed'); setSelectedReport(null); }}
                          className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-500 hover:bg-slate-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                           {t('admin.modals.reportDetails.dismissBtn')}
                        </button>
                      </>
                    ) : (
                      <div className={`flex-1 py-4 text-center rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>{t('admin.modals.reportDetails.statusReport')}</p>
                        <p className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{selectedReport.status}</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Create Package Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className={`rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
             <div className="p-8 border-b flex items-center justify-between">
                <h3 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.modals.createPackage.title')}</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
             </div>
             <div className="p-8 space-y-6">
                <div>
                   <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.modals.createPackage.name')}</label>
                   <input 
                      type="text" 
                      placeholder={t('admin.modals.createPackage.namePlaceholder')}
                      value={newPackage.name}
                      onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                      className={`w-full px-5 py-4 rounded-2xl border font-bold outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                   />
                </div>
                <div>
                   <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.price')}</label>
                   <input 
                      type="number" 
                      value={newPackage.price}
                      onChange={(e) => setNewPackage({ ...newPackage, price: parseFloat(e.target.value) })}
                      className={`w-full px-5 py-4 rounded-2xl border font-black text-xl outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                   />
                </div>
                <div>
                   <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.description')}</label>
                   <textarea 
                      rows="3"
                      value={newPackage.description}
                      onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                      className={`w-full px-5 py-4 rounded-2xl border font-bold text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 resize-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                   ></textarea>
                </div>
                <div>
                   <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.features')}</label>
                   <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'Filter Age', label: t('admin.premium.featureLabels.filterAge') },
                        { id: 'No Ads', label: t('admin.premium.featureLabels.noAds') },
                        { id: 'See Identity', label: t('admin.premium.featureLabels.seeIdentity') },
                        { id: 'Radar Premium', label: t('admin.premium.featureLabels.radarPremium') }
                      ].map(feat => {
                         const currentFeatures = newPackage.features ? newPackage.features.split(',').map(f => f.trim()) : [];
                         const isChecked = currentFeatures.includes(feat.id);
                         
                         return (
                            <label key={feat.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                               isChecked 
                               ? (isDarkMode ? 'bg-indigo-900/20 border-indigo-500 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600')
                               : (isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-500' : 'bg-white border-slate-100 text-slate-400')
                            }`}>
                               <input 
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isChecked}
                                  onChange={(e) => {
                                     let newFeatures;
                                     if (e.target.checked) {
                                        newFeatures = [...currentFeatures, feat.id];
                                     } else {
                                        newFeatures = currentFeatures.filter(f => f !== feat.id);
                                     }
                                     setNewPackage({ ...newPackage, features: newFeatures.join(', ') });
                                  }}
                               />
                               <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                  {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                               </div>
                               <span className="text-[11px] font-bold">{feat.label}</span>
                            </label>
                         );
                      })}
                   </div>
                </div>
                <button 
                  onClick={handleCreatePackage}
                  disabled={isUpdatingPackage || !newPackage.name}
                  className={`w-full py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50`}
                >
                  {isUpdatingPackage ? t('admin.modals.createPackage.submitting') : t('admin.modals.createPackage.submit')}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {deleteGroupTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteGroupTarget(null)}></div>
          <div className={`rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${isDarkMode ? 'bg-rose-950/30 text-rose-500' : 'bg-rose-50 text-rose-500'}`}>
                <Trash2 size={32} />
              </div>
              <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.groups.deleteConfirmTitle') || 'Xóa nhóm cộng đồng?'}</h3>
              <p className={`text-sm font-medium mb-8 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('admin.groups.deleteConfirmMessage', { name: deleteGroupTarget.name }) || `Bạn có chắc chắn muốn xóa nhóm "${deleteGroupTarget.name}" không? Hành động này không thể hoàn tác.`}
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => handleDeleteGroup(deleteGroupTarget.groupId)}
                  className="flex-1 py-4 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
                >
                  {t('admin.groups.deleteBtn') || 'Xác nhận xóa'}
                </button>
                <button 
                  onClick={() => setDeleteGroupTarget(null)}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {t('admin.groups.cancelBtn') || 'Hủy bỏ'}
                </button>
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
