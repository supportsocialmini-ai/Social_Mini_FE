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
    const notificationDropdownRef = useRef(null);
    const [deleteGroupTarget, setDeleteGroupTarget] = useState(null); // { groupId, name }

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
                setIsUserDropdownOpen(false);
            }
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(e.target)) {
                setIsNotificationOpen(false);
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
    const [maintenanceReason, setMaintenanceReason] = useState('');
    const [maintenanceVersion, setMaintenanceVersion] = useState('');
    const [maintenanceEndTime, setMaintenanceEndTime] = useState('');
    const [isSavingMaintenanceInfo, setIsSavingMaintenanceInfo] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [packages, setPackages] = useState([]);
    const [isUpdatingPackage, setIsUpdatingPackage] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [packageType, setPackageType] = useState('chat');
    const [newPackage, setNewPackage] = useState({ name: '', price: 0, description: '', features: '', isActive: true, durationDays: 30 });
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
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [recentEvents, setRecentEvents] = useState([]);
    // Revenue tab
    const [revenueData, setRevenueData] = useState(null);
    const [isRevenueLoading, setIsRevenueLoading] = useState(false);
    const [revenueStartDate, setRevenueStartDate] = useState(thirtyDaysAgoStr);
    const [revenueEndDate, setRevenueEndDate] = useState(todayStr);

    const last7DaysData = React.useMemo(() => {
        if (!detailedStats) return [];
        const rawData =
            detailedStats.dailyData?.$values || detailedStats.dailyData ||
            detailedStats.DailyData?.$values || detailedStats.DailyData ||
            detailedStats.dailyStats?.$values || detailedStats.dailyStats ||
            detailedStats.DailyStats?.$values || detailedStats.DailyStats || [];
        return Array.isArray(rawData) ? rawData.slice(-7) : [];
    }, [detailedStats]);

    const processedChartData = React.useMemo(() => {
        if (!last7DaysData.length) return [];
        const maxVal = Math.max(
            ...last7DaysData.map(d => Math.max(d.JoinedUsers || d.joinedUsers || 0, d.CreatedPosts || d.createdPosts || 0)),
            5
        );
        return last7DaysData.map(d => {
            const rawDate = d.Date || d.date || '';
            const dateParts = rawDate ? rawDate.split('-') : [];
            const label = dateParts.length >= 3 ? `${dateParts[2]}/${dateParts[1]}` : rawDate;
            const joined = d.JoinedUsers || d.joinedUsers || 0;
            const posts = d.CreatedPosts || d.createdPosts || 0;
            return {
                label,
                joinedUsers: joined,
                createdPosts: posts,
                pctUsers: Math.max(5, Math.round((joined / maxVal) * 100)),
                pctPosts: Math.max(5, Math.round((posts / maxVal) * 100))
            };
        });
    }, [last7DaysData]);

    const activePercent = React.useMemo(() => {
        if (!stats || !stats.totalUsers) return 0;
        return Math.round((stats.activeUsers / stats.totalUsers) * 100);
    }, [stats]);

    const reportStats = React.useMemo(() => {
        const total = reports.length;
        const resolved = reports.filter(r => r.status === 'Resolved' || r.status === 'Approved' || r.status === 'Rejected' || r.status === 'Processed').length;
        const percent = total > 0 ? Math.round((resolved / total) * 100) : 100;
        return { total, resolved, percent };
    }, [reports]);

    const cleanPostsRate = React.useMemo(() => {
        const totalPosts = stats?.totalPosts || 0;
        if (totalPosts === 0) return { cleanCount: 0, percent: 100 };
        const uniqueReportedPosts = new Set(reports.map(r => r.targetId || r.postId)).size;
        const cleanCount = Math.max(0, totalPosts - uniqueReportedPosts);
        const percent = Math.round((cleanCount / totalPosts) * 100);
        return { cleanCount, percent };
    }, [stats, reports]);

    useEffect(() => {
        if (isAdmin) {
            if (activeTab === 'reports') {
                fetchReports();
            } else if (activeTab === 'users') {
                fetchUsers(1);
            } else if (activeTab === 'groups') {
                fetchGroups();
            } else if (activeTab === 'premium' || activeTab === 'ads') {
                fetchPackages();
            } else if (activeTab === 'activity') {
                fetchDetailedStats();
            } else if (activeTab === 'revenue') {
                fetchRevenue();
            } else {
                fetchData();
            }
            fetchMaintenanceStatus();
            fetchMaintenanceInfo();
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
            const [statsRes, usersRes, detailedStatsRes, reportsRes] = await Promise.all([
                adminService.getStats(),
                adminService.getUsers(1, PAGE_SIZE),
                adminService.getDetailedStats(thirtyDaysAgoStr, todayStr),
                reportService.getAllReports()
            ]);
            setStats(statsRes);
            const usersData = usersRes?.users?.$values || usersRes?.users || (Array.isArray(usersRes) ? usersRes : []);
            setUsers(usersData);
            setUsersTotalCount(usersRes?.totalCount || 0);
            setUsersCurrentPage(1);

            const detailedData = detailedStatsRes?.result || detailedStatsRes;
            setDetailedStats(detailedData);
            setReports(reportsRes || []);
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

    const fetchRevenue = async (start = revenueStartDate, end = revenueEndDate) => {
        setIsRevenueLoading(true);
        try {
            const res = await adminService.getRevenue(start, end);
            const data = res?.result || res;
            setRevenueData(data);
        } catch (error) {
            toast.error('Lỗi lấy dữ liệu doanh thu');
        } finally {
            setIsRevenueLoading(false);
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
                case 'Ads':
                case 'Đăng ký quảng cáo':
                    return 'Ads Purchase';
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
            { label: 'Ads Purchases', value: detailedStats.totalAds ?? 0, color: [139, 92, 246] },
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
            (d.joinedUsers > 0 || d.createdPosts > 0 || d.premiumRegistrations > 0 || d.adsRegistrations > 0 || d.reportedPosts > 0)
        );

        autoTable(doc, {
            startY: 59,
            head: [['Date', 'Joined', 'Posts', 'Premium', 'Ads', 'Reports']],
            body: filteredDaily.map(d => [d.date, d.joinedUsers, d.createdPosts, d.premiumRegistrations, d.adsRegistrations || 0, d.reportedPosts]),
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
            setNewPackage({ name: '', price: 0, description: '', features: '', isActive: true, durationDays: 30 });
            setPackageType('chat');
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

    const fetchMaintenanceInfo = async () => {
        try {
            const response = await adminService.getMaintenanceInfo();
            if (response) {
                setMaintenanceReason(response.reason || '');
                setMaintenanceVersion(response.version || '');
                setMaintenanceEndTime(response.endTime || '');
            }
        } catch (error) {
            console.error('Lỗi lấy thông tin chi tiết bảo trì', error);
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

    const renderPackageCard = (pkg) => (
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
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{pkg.features?.split(',').map(f => f.trim()).includes('Sponsor Post') ? 'Gói quảng cáo' : t('admin.premium.plan')}</p>
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
                    <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.durationDays') || 'Thời hạn (ngày)'}</label>
                    <input
                        type="number"
                        defaultValue={pkg.durationDays}
                        onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val !== pkg.durationDays) {
                                handleUpdatePackage(pkg.id, { ...pkg, durationDays: val });
                            }
                        }}
                        className={`w-full px-5 py-4 rounded-2xl border font-black text-xl outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                    />
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

                {!pkg.features?.split(',').map(f => f.trim()).includes('Sponsor Post') && (
                    <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.features')}</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'Filter Age', label: t('admin.premium.featureLabels.filterAge') || 'Lọc độ tuổi' },
                                { id: 'Filter Gender', label: t('admin.premium.featureLabels.filterGender') || 'Lọc giới tính' },
                                { id: 'Background Effect', label: t('admin.premium.featureLabels.backgroundEffect') || 'Hiệu ứng radar' },
                                { id: 'See Identity', label: t('admin.premium.featureLabels.seeIdentity') || 'Xem danh tính' }
                            ].map(feat => {
                                const currentFeatures = pkg.features ? pkg.features.split(',').map(f => f.trim()) : [];
                                const isChecked = currentFeatures.includes(feat.id);

                                return (
                                    <label key={feat.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked
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
                )}
            </div>

            {isUpdatingPackage && (
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <RefreshCw size={24} className="animate-spin text-indigo-600" />
                </div>
            )}
        </div>
    );

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
                    <SidebarItem icon={<Target size={20} />} label="Gói quảng cáo" active={activeTab === 'ads'} onClick={() => { setActiveTab('ads'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />

                    <div className={`py-4 px-4 text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} uppercase tracking-widest mt-4`}>{t('admin.sidebar.analysis')}</div>
                    <SidebarItem icon={<BarChart3 size={20} />} label="Lịch sử hoạt động" active={activeTab === 'activity'} onClick={() => { setActiveTab('activity'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
                    <SidebarItem icon={<TrendingUp size={20} />} label="Thống kê doanh thu" active={activeTab === 'revenue'} onClick={() => { setActiveTab('revenue'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />

                    <div className={`py-4 px-4 text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} uppercase tracking-widest mt-4`}>{t('admin.sidebar.system')}</div>
                    <SidebarItem icon={<Settings size={20} />} label={t('admin.sidebar.settings')} active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} isDarkMode={isDarkMode} />
                </nav>

                <div className={`p-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} mt-auto`}>
                    <div className="space-y-1">
                        <SidebarItem icon={<HelpCircle size={20} />} label={t('admin.sidebar.help')} isDarkMode={isDarkMode} />
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
                            <div className="relative" ref={notificationDropdownRef}>
                                <button
                                    onClick={async () => {
                                        if (!isNotificationOpen) {
                                            try {
                                                const res = await adminService.getDetailedStats(
                                                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                                    new Date().toISOString().split('T')[0]
                                                );
                                                const events = res?.result?.events?.$values || res?.result?.events || res?.events?.$values || res?.events || [];
                                                setRecentEvents(events.slice(0, 5));
                                            } catch (error) {
                                                console.error('Lỗi lấy lịch sử hoạt động', error);
                                            }
                                        }
                                        setIsNotificationOpen(!isNotificationOpen);
                                    }}
                                    className={`p-2.5 rounded-2xl border shadow-sm relative transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-100 text-slate-400'}`}
                                >
                                    <Bell size={20} />
                                    <span className={`absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 ${isDarkMode ? 'border-slate-900' : 'border-white'}`}></span>
                                </button>

                                {isNotificationOpen && (
                                    <div className={`absolute right-0 top-14 w-80 rounded-2xl border shadow-2xl z-[200] overflow-hidden transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
                                        <div className={`px-4 py-3 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                            <span className="font-black text-sm uppercase tracking-wider">Lịch sử hoạt động mới nhất</span>
                                            <button onClick={() => setIsNotificationOpen(false)} className="text-slate-400 hover:text-slate-600">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="p-2 space-y-1.5 max-h-[320px] overflow-y-auto custom-scrollbar">
                                            {recentEvents.length > 0 ? (
                                                recentEvents.map((evt, idx) => (
                                                    <div key={idx} className={`p-2.5 rounded-xl border transition-all text-xs ${isDarkMode ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'}`}>
                                                        <div className="flex justify-between items-start gap-2 mb-1.5">
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                                evt.type === 'Register' || evt.Type === 'Register' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                                evt.type === 'Premium' || evt.Type === 'Premium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                                evt.type === 'Ads' || evt.Type === 'Ads' ? 'bg-violet-500/10 text-violet-500 border border-violet-500/20' :
                                                                evt.type === 'Report' || evt.Type === 'Report' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                                'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                                            }`}>
                                                                {evt.typeName || evt.TypeName}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                                                                {(evt.time || evt.Time)?.split(' ')[1] || (evt.time || evt.Time) || ''}
                                                            </span>
                                                        </div>
                                                        <p className={`font-bold leading-relaxed mb-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            {evt.fullName || evt.FullName} (@{evt.username || evt.Username})
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 leading-snug">
                                                            {evt.details || evt.Details}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-6 text-xs text-slate-400 font-bold">Không có hoạt động mới nào</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

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
                                    <div className={`absolute right-0 top-14 w-52 rounded-2xl border shadow-2xl z-[200] overflow-hidden transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                                        }`}>
                                        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                            <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user?.fullName || 'Administrator'}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-tight mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>@{user?.username}</p>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => { setIsUserDropdownOpen(false); logout(); }}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isDarkMode
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
                                                    <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Thành viên mới</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-300"></span>
                                                    <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Bài viết mới</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-64 flex items-end justify-between gap-4 px-2">
                                        {processedChartData.length > 0 ? (
                                            processedChartData.map((d, idx) => (
                                                <BarChartGroup
                                                    key={idx}
                                                    value1={d.pctUsers}
                                                    value2={d.pctPosts}
                                                    label={d.label}
                                                    isDarkMode={isDarkMode}
                                                />
                                            ))
                                        ) : (
                                            <>
                                                <BarChartGroup value1={40} value2={60} label="Jan" isDarkMode={isDarkMode} />
                                                <BarChartGroup value1={70} value2={50} label="Feb" isDarkMode={isDarkMode} />
                                                <BarChartGroup value1={55} value2={85} label="Mar" isDarkMode={isDarkMode} />
                                                <BarChartGroup value1={90} value2={40} label="Apr" isDarkMode={isDarkMode} />
                                                <BarChartGroup value1={75} value2={70} label="May" isDarkMode={isDarkMode} />
                                                <BarChartGroup value1={45} value2={65} label="Jun" isDarkMode={isDarkMode} />
                                                <BarChartGroup value1={60} value2={80} label="Jul" isDarkMode={isDarkMode} />
                                            </>
                                        )}
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
                                                    strokeDasharray="502"
                                                    strokeDashoffset={502 - (502 * activePercent) / 100}
                                                    strokeLinecap="round"
                                                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Hoạt động</p>
                                                <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activePercent}%</p>
                                            </div>
                                        </div>

                                        <div className="w-full space-y-4">
                                            <BudgetRow color="bg-indigo-500" label="Người dùng hoạt động" value={`${activePercent}%`} amount={stats?.activeUsers?.toLocaleString() || '0'} isDarkMode={isDarkMode} />
                                            <BudgetRow color="bg-indigo-300" label="Tổng số bài viết" value="-" amount={stats?.totalPosts?.toLocaleString() || '0'} isDarkMode={isDarkMode} />
                                            <BudgetRow color={isDarkMode ? 'bg-indigo-900/45' : 'bg-indigo-50'} label="Tổng số bình luận" value="-" amount={stats?.totalComments?.toLocaleString() || '0'} isDarkMode={isDarkMode} />
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
                                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${report.status === 'Pending' ? (isDarkMode ? 'bg-amber-900/20 text-amber-500' : 'bg-amber-50 text-amber-600') :
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
                                        <GoalProgress label={t('admin.dashboard.communityModeration')} value={cleanPostsRate.cleanCount?.toLocaleString() || '0'} target={stats?.totalPosts?.toLocaleString() || '0'} percent={cleanPostsRate.percent} color="bg-indigo-500" isDarkMode={isDarkMode} />
                                        <GoalProgress label={t('admin.dashboard.systemOptimization')} value={stats?.activeUsers?.toLocaleString() || '0'} target={stats?.totalUsers?.toLocaleString() || '0'} percent={activePercent} color="bg-indigo-300" isDarkMode={isDarkMode} />
                                        <GoalProgress label={t('admin.dashboard.reportResolution')} value={reports.filter(r => r.status === 'Resolved').length.toLocaleString() || '0'} target={reports.length.toLocaleString() || '0'} percent={Math.round((reports.filter(r => r.status === 'Resolved').length / (reports.length || 1)) * 100)} color="bg-indigo-200" isDarkMode={isDarkMode} />
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
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${userItem.isActive
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
                                                            className={`p-2.5 rounded-xl border transition-all active:scale-95 ${userItem.isActive
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
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-600 hover:text-indigo-600'
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
                                                            className={`w-9 h-9 rounded-xl text-xs font-black border transition-all active:scale-95 ${item === usersCurrentPage
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
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-600 hover:text-indigo-600'
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
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${g.privacy === 'Public'
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
                                            onClick={() => { setPackageType('chat'); setNewPackage({ name: '', price: 0, description: '', features: '', isActive: true, durationDays: 30 }); setIsCreateModalOpen(true); }}
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

                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {packages.filter(pkg => !pkg.features?.split(',').map(f => f.trim()).includes('Sponsor Post')).map(pkg => renderPackageCard(pkg))}
                                        {packages.filter(pkg => !pkg.features?.split(',').map(f => f.trim()).includes('Sponsor Post')).length === 0 && !isLoading && (
                                            <div className="col-span-full py-10 text-center">
                                                <p className="text-slate-400 font-bold italic">Không có gói Chat Random nào</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'ads' ? (
                        /* --- ADS TAB --- */
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className={`rounded-[2.5rem] border shadow-sm p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Quảng cáo bài viết</h2>
                                        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Quản lý cấu hình các gói quảng cáo bài đăng của hệ thống</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setPackageType('ads'); setNewPackage({ name: '', price: 0, description: '', features: 'Sponsor Post', isActive: true, durationDays: 30 }); setIsCreateModalOpen(true); }}
                                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 text-[11px] font-black uppercase tracking-widest"
                                        >
                                            <ShieldCheck size={18} />
                                            Tạo gói Ads mới
                                        </button>
                                        <button onClick={fetchPackages} className={`p-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-indigo-400' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600'}`}>
                                            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {packages.filter(pkg => pkg.features?.split(',').map(f => f.trim()).includes('Sponsor Post')).map(pkg => renderPackageCard(pkg))}
                                        {packages.filter(pkg => pkg.features?.split(',').map(f => f.trim()).includes('Sponsor Post')).length === 0 && !isLoading && (
                                            <div className="col-span-full py-10 text-center">
                                                <p className="text-slate-400 font-bold italic">Không có gói Quảng cáo Ads nào</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'activity' ? (
                        <>{(() => {
                            const eventsArr = detailedStats?.events?.$values || detailedStats?.events || [];
                            const dailyArr = detailedStats?.dailyStats?.$values || detailedStats?.dailyStats || [];
                            const filteredEvents = eventsArr.filter(e => {
                                const typeOk = statsFilterType === 'all' || e.type === statsFilterType;
                                const q = statsSearchQuery.toLowerCase();
                                const queryOk = !q || e.fullName?.toLowerCase().includes(q) || e.username?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.details?.toLowerCase().includes(q);
                                return typeOk && queryOk;
                            });

                            const maxVal = dailyArr.length > 0 ? Math.max(1, ...dailyArr.map(d => Math.max(d.joinedUsers || 0, d.createdPosts || 0, d.premiumRegistrations || 0, d.adsRegistrations || 0, d.reportedPosts || 0))) : 1;
                            const eventColors = { Register: '#6366f1', Post: '#10b981', Premium: '#f59e0b', Ads: '#8b5cf6', Report: '#ef4444' };
                            const typeOptions = [
                                { value: 'all', label: t('admin.analyticsPanel.allEvents') },
                                { value: 'Register', label: 'Đăng ký tài khoản' },
                                { value: 'Post', label: 'Đăng bài viết' },
                                { value: 'Premium', label: 'Đăng ký Premium' },
                                { value: 'Ads', label: 'Đăng ký quảng cáo' },
                                { value: 'Report', label: 'Bài viết bị báo cáo' }
                            ];

                            return (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className={`rounded-[2.5rem] border shadow-sm p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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
                                        </div>
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
                        })()}</>
                    ) : activeTab === 'revenue' ? (
                        /* --- REVENUE TAB --- */
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className={`rounded-[2.5rem] border shadow-sm p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                                    <div>
                                        <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Thống kê doanh thu</h2>
                                        <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Tổng hợp doanh thu từ gói Premium và quảng cáo bài viết</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                            <Calendar size={16} className="text-indigo-500" />
                                            <input type="date" value={revenueStartDate} onChange={e => setRevenueStartDate(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold cursor-pointer" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                                            <span className="text-slate-400 font-bold">→</span>
                                            <input type="date" value={revenueEndDate} onChange={e => setRevenueEndDate(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold cursor-pointer" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                                        </div>
                                        <button onClick={() => fetchRevenue(revenueStartDate, revenueEndDate)} className={`px-5 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 text-indigo-600 hover:bg-indigo-50'}`}>
                                            <RefreshCw size={15} className={`inline mr-1.5 ${isRevenueLoading ? 'animate-spin' : ''}`} />
                                            {isRevenueLoading ? 'Đang tải...' : 'Tải dữ liệu'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                    {[
                                        { label: 'Tổng doanh thu', value: revenueData?.totalRevenue ?? 0, color: 'text-indigo-500', bg: isDarkMode ? 'bg-indigo-950/30' : 'bg-indigo-50', border: isDarkMode ? 'border-indigo-900/40' : 'border-indigo-100', icon: '💰' },
                                        { label: 'Từ gói Premium', value: revenueData?.premiumRevenue ?? 0, color: 'text-amber-500', bg: isDarkMode ? 'bg-amber-950/30' : 'bg-amber-50', border: isDarkMode ? 'border-amber-900/40' : 'border-amber-100', icon: '👑' },
                                        { label: 'Từ quảng cáo', value: revenueData?.adsRevenue ?? 0, color: 'text-violet-500', bg: isDarkMode ? 'bg-violet-950/30' : 'bg-violet-50', border: isDarkMode ? 'border-violet-900/40' : 'border-violet-100', icon: '📣' },
                                    ].map((card, i) => (
                                        <div key={i} className={`p-5 rounded-2xl border ${card.bg} ${card.border}`}>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{card.icon} {card.label}</p>
                                            <p className={`text-2xl font-black ${card.color}`}>{isRevenueLoading ? '—' : `${(card.value || 0).toLocaleString('vi-VN')} ₫`}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {[
                                        { label: 'Tổng giao dịch', value: revenueData?.totalTransactions ?? 0, color: 'text-slate-500' },
                                        { label: 'Giao dịch Premium', value: revenueData?.premiumCount ?? 0, color: 'text-amber-500' },
                                        { label: 'Giao dịch Quảng cáo', value: revenueData?.adsCount ?? 0, color: 'text-violet-500' },
                                    ].map((card, i) => (
                                        <div key={i} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'} text-center`}>
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{card.label}</p>
                                            <p className={`text-xl font-black ${card.color}`}>{isRevenueLoading ? '—' : (card.value || 0).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>

                                {revenueData?.dailyRevenue && (() => {
                                    const dailyArr = revenueData?.dailyRevenue?.$values || revenueData?.dailyRevenue || [];
                                    const maxRev = Math.max(1, ...dailyArr.map(d => Math.max(d.premiumRevenue || 0, d.adsRevenue || 0)));
                                    return (
                                        <div className="mb-4">
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Biểu đồ doanh thu theo ngày</p>
                                            <div className="flex gap-4 mb-3 flex-wrap">
                                                {[['#f59e0b', 'Premium'], ['#8b5cf6', 'Quảng cáo']].map(([c, l]) => (
                                                    <div key={l} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ background: c }}></span><span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{l}</span></div>
                                                ))}
                                            </div>
                                            <div className="overflow-x-auto">
                                                <svg width={Math.max(dailyArr.length * 40 + 24, 600)} height="160" className="min-w-full">
                                                    {dailyArr.map((d, i) => {
                                                        const x = i * 40 + 12;
                                                        const hP = maxRev > 0 ? Math.max(2, ((d.premiumRevenue || 0) / maxRev) * 120) : 2;
                                                        const hA = maxRev > 0 ? Math.max(2, ((d.adsRevenue || 0) / maxRev) * 120) : 2;
                                                        return (
                                                            <g key={d.date}>
                                                                <rect x={x} y={130 - hP} width={8} height={hP} rx={2} fill="#f59e0b" opacity={0.85} />
                                                                <rect x={x + 10} y={130 - hA} width={8} height={hA} rx={2} fill="#8b5cf6" opacity={0.85} />
                                                                <text x={x + 9} y={150} fontSize="5.5" fill={isDarkMode ? '#475569' : '#94a3b8'} textAnchor="middle">{d.date?.slice(5)}</text>
                                                            </g>
                                                        );
                                                    })}
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {!revenueData && !isRevenueLoading && (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                                        <TrendingUp size={48} className="text-slate-300" />
                                        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Chọn khoảng thời gian và nhấn "Tải dữ liệu" để xem thống kê doanh thu.</p>
                                    </div>
                                )}
                                {isRevenueLoading && (
                                    <div className="flex items-center justify-center py-16 gap-3">
                                        <RefreshCw size={20} className="animate-spin text-indigo-500" />
                                        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Đang tải dữ liệu doanh thu...</p>
                                    </div>
                                )}
                            </div>

                            {revenueData?.packageSales && (
                                <div className={`rounded-[2.5rem] border shadow-sm p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <h3 className={`text-lg font-black tracking-tight mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>🏆 Top gói bán chạy</h3>
                                    <div className="space-y-3">
                                        {(revenueData?.packageSales?.$values || revenueData?.packageSales || []).map((pkg, idx) => {
                                            const allSales = revenueData?.packageSales?.$values || revenueData?.packageSales || [];
                                            const maxAmt = Math.max(1, ...allSales.map(p => p.totalAmount || 0));
                                            const pct = Math.round(((pkg.totalAmount || 0) / maxAmt) * 100);
                                            return (
                                                <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-600'}`}>{idx + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${pkg.isAds ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'}`}>{pkg.isAds ? 'ADS' : 'PREMIUM'}</span>
                                                            <p className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{pkg.packageName}</p>
                                                        </div>
                                                        <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pkg.isAds ? '#8b5cf6' : '#f59e0b' }}></div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className={`text-sm font-black ${pkg.isAds ? 'text-violet-500' : 'text-amber-500'}`}>{(pkg.totalAmount || 0).toLocaleString('vi-VN')} ₫</p>
                                                        <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{pkg.count} giao dịch</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(revenueData?.packageSales?.$values || revenueData?.packageSales || []).length === 0 && (
                                            <p className={`text-center py-6 text-sm font-bold italic ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Chưa có giao dịch nào trong khoảng thời gian này</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {revenueData?.transactions && (
                                <div className={`rounded-[2.5rem] border shadow-sm p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>📋 Lịch sử giao dịch</h3>
                                            <p className={`text-xs font-medium mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Hiển thị 100 giao dịch mới nhất</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[700px]">
                                            <thead>
                                                <tr className={`text-[9px] font-black uppercase tracking-[0.2em] border-b ${isDarkMode ? 'text-slate-700 border-slate-800' : 'text-slate-300 border-slate-100'}`}>
                                                    <th className="pb-4 px-3">Loại</th>
                                                    <th className="pb-4 px-3">Người dùng</th>
                                                    <th className="pb-4 px-3">Gói</th>
                                                    <th className="pb-4 px-3">Số tiền</th>
                                                    <th className="pb-4 px-3">Thời gian</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                                                {(revenueData?.transactions?.$values || revenueData?.transactions || []).map((tx, idx) => (
                                                    <tr key={idx} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                                                        <td className="py-3 px-3">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block ${tx.type === 'Ads' ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                {tx.type === 'Ads' ? '📣 Ads' : '👑 Premium'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <p className={`text-xs font-black leading-none mb-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{tx.userFullName}</p>
                                                            <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>@{tx.userUsername}</p>
                                                        </td>
                                                        <td className={`py-3 px-3 text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{tx.packageName}</td>
                                                        <td className="py-3 px-3">
                                                            <span className={`text-sm font-black ${tx.type === 'Ads' ? 'text-violet-500' : 'text-amber-500'}`}>{(tx.amount || 0).toLocaleString('vi-VN')} ₫</span>
                                                        </td>
                                                        <td className={`py-3 px-3 text-[10px] font-black whitespace-nowrap ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{tx.createdAt}</td>
                                                    </tr>
                                                ))}
                                                {(revenueData?.transactions?.$values || revenueData?.transactions || []).length === 0 && (
                                                    <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-bold italic text-sm">Chưa có giao dịch nào</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'settings' ? (
                        /* --- SETTINGS TAB --- */
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className={`rounded-[2.5rem] border shadow-sm p-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                <h2 className={`text-2xl font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.settingsPanel.title')}</h2>
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{t('admin.settingsPanel.subtitle')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Maintenance Mode Card */}
                                <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className={`p-3 rounded-2xl ${isMaintenance ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                <Settings size={24} className={isTogglingMaintenance ? 'animate-spin' : ''} />
                                            </div>
                                            <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.settingsPanel.maintenanceSection')}</h3>
                                        </div>
                                        <p className={`text-sm font-medium leading-relaxed mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {t('admin.settingsPanel.maintenanceDesc')}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Trạng thái</span>
                                        <button
                                            onClick={handleToggleMaintenance}
                                            disabled={isTogglingMaintenance}
                                            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${isMaintenance
                                                ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600'
                                                : 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600'
                                                }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${isMaintenance ? 'bg-white animate-pulse' : 'bg-white'}`}></div>
                                            {isMaintenance ? 'Bảo trì: BẬT' : 'Bảo trì: TẮT'}
                                        </button>
                                    </div>
                                </div>

                                {/* Language Switcher Card */}
                                <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                                                <Globe size={24} />
                                            </div>
                                            <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.settingsPanel.languageSection')}</h3>
                                        </div>
                                        <p className={`text-sm font-medium leading-relaxed mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {t('admin.settingsPanel.languageDesc')}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => i18n.changeLanguage('vi')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${i18n.language.startsWith('vi')
                                                ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            Tiếng Việt (VI)
                                        </button>
                                        <button
                                            onClick={() => i18n.changeLanguage('en')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${!i18n.language.startsWith('vi')
                                                ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            English (EN)
                                        </button>
                                    </div>
                                </div>

                                {/* Theme Mode Card */}
                                <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                                                {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                                            </div>
                                            <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.settingsPanel.themeSection')}</h3>
                                        </div>
                                        <p className={`text-sm font-medium leading-relaxed mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {t('admin.settingsPanel.themeDesc')}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-md">
                                        <button
                                            onClick={() => setIsDarkMode(false)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${!isDarkMode
                                                ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            <Sun size={16} />
                                            {t('admin.settingsPanel.themeLight')}
                                        </button>
                                        <button
                                            onClick={() => setIsDarkMode(true)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isDarkMode
                                                ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            <Moon size={16} />
                                            {t('admin.settingsPanel.themeDark')}
                                        </button>
                                    </div>
                                </div>

                                {/* Maintenance Info Card */}
                                <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Thông tin bảo trì</h3>
                                        </div>
                                        <p className={`text-sm font-medium leading-relaxed mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Điền thông tin hiển thị cho người dùng khi hệ thống vào chế độ bảo trì.
                                        </p>

                                        {/* Maintenance Reason */}
                                        <div className="mb-4">
                                            <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Lý do bảo trì</label>
                                            <textarea
                                                value={maintenanceReason}
                                                onChange={(e) => setMaintenanceReason(e.target.value)}
                                                placeholder="VD: Nâng cấp hệ thống cơ sở dữ liệu và tối ưu hiệu năng..."
                                                rows={3}
                                                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none transition-all focus:ring-2 focus:ring-rose-400 ${isDarkMode
                                                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                                                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                                                    }`}
                                            />
                                        </div>

                                        {/* Version After Maintenance */}
                                        <div className="mb-4">
                                            <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Phiên bản sau bảo trì</label>
                                            <input
                                                type="text"
                                                value={maintenanceVersion}
                                                onChange={(e) => setMaintenanceVersion(e.target.value)}
                                                placeholder="VD: v2.1.0"
                                                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-rose-400 ${isDarkMode
                                                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                                                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                                                    }`}
                                            />
                                        </div>

                                        {/* Maintenance End Time */}
                                        <div className="mb-6">
                                            <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Thời gian ngưng bảo trì</label>
                                            <input
                                                type="datetime-local"
                                                value={maintenanceEndTime}
                                                onChange={(e) => setMaintenanceEndTime(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-rose-400 ${isDarkMode
                                                    ? 'bg-slate-800 border-slate-700 text-white'
                                                    : 'bg-slate-50 border-slate-200 text-slate-800'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            setIsSavingMaintenanceInfo(true);
                                            try {
                                                await adminService.saveMaintenanceInfo({
                                                    reason: maintenanceReason,
                                                    version: maintenanceVersion,
                                                    endTime: maintenanceEndTime,
                                                });
                                                toast.success('Đã lưu thông tin bảo trì!');
                                            } catch {
                                                toast.error('Lưu thông tin thất bại!');
                                            } finally {
                                                setIsSavingMaintenanceInfo(false);
                                            }
                                        }}
                                        disabled={isSavingMaintenanceInfo}
                                        className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600"
                                    >
                                        {isSavingMaintenanceInfo ? (
                                            <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                                        ) : (
                                            <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Lưu thông tin</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
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
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${report.status === 'Pending' ? (isDarkMode ? 'bg-amber-900/20 text-amber-500' : 'bg-amber-50 text-amber-600') :
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
                                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg mb-3 ${selectedUser.isActive
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
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsCreateModalOpen(false); setPackageType('chat'); setNewPackage({ name: '', price: 0, description: '', features: '', isActive: true, durationDays: 30 }); }}></div>
                    <div className={`rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
                        <div className="p-8 border-b flex items-center justify-between">
                            <h3 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t('admin.modals.createPackage.title')}</h3>
                            <button onClick={() => { setIsCreateModalOpen(false); setPackageType('chat'); setNewPackage({ name: '', price: 0, description: '', features: '', isActive: true, durationDays: 30 }); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Loại gói dịch vụ</label>
                                <select
                                    value={packageType}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setPackageType(val);
                                        if (val === 'ads') {
                                            setNewPackage(prev => ({ ...prev, features: 'Sponsor Post' }));
                                        } else {
                                            setNewPackage(prev => ({ ...prev, features: '' }));
                                        }
                                    }}
                                    className={`w-full px-5 py-4 rounded-2xl border font-bold outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                                >
                                    <option value="chat">Gói Chat Random</option>
                                    <option value="ads">Gói Quảng Cáo Bài Viết</option>
                                </select>
                            </div>
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
                                <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.durationDays') || 'Thời hạn (ngày)'}</label>
                                <input
                                    type="number"
                                    value={newPackage.durationDays}
                                    onChange={(e) => setNewPackage({ ...newPackage, durationDays: parseInt(e.target.value) || 0 })}
                                    className={`w-full px-5 py-4 rounded-2xl border font-black text-xl outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                                />
                            </div>
                            {packageType !== 'ads' && (
                                <div>
                                    <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.features')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'Filter Age', label: t('admin.premium.featureLabels.filterAge') || 'Lọc độ tuổi' },
                                            { id: 'Filter Gender', label: t('admin.premium.featureLabels.filterGender') || 'Lọc giới tính' },
                                            { id: 'Background Effect', label: t('admin.premium.featureLabels.backgroundEffect') || 'Hiệu ứng radar' },
                                            { id: 'See Identity', label: t('admin.premium.featureLabels.seeIdentity') || 'Xem danh tính' }
                                        ].map(feat => {
                                            const currentFeatures = newPackage.features ? newPackage.features.split(',').map(f => f.trim()) : [];
                                            const isChecked = currentFeatures.includes(feat.id);

                                            return (
                                                <label key={feat.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked
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
                            )}
                            <div>
                                <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t('admin.premium.description')}</label>
                                <textarea
                                    rows="3"
                                    value={newPackage.description}
                                    onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                                    className={`w-full px-5 py-4 rounded-2xl border font-bold text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 resize-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                ></textarea>
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
            <style dangerouslySetInnerHTML={{
                __html: `
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
        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 relative group ${disabled ? 'opacity-40 cursor-not-allowed' :
            active
                ? (isDarkMode ? 'bg-indigo-950/40 text-indigo-400 shadow-sm shadow-indigo-900/20' : 'bg-indigo-50 text-indigo-600 shadow-sm')
                : (isDarkMode ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-50')
            }`}
    >
        <div className="flex items-center gap-4">
            <div className={active ? (isDarkMode ? 'text-indigo-400' : 'text-indigo-600') : 'group-hover:text-indigo-600 transition-colors'}>{icon}</div>
            <span className={`text-sm font-black uppercase tracking-wide whitespace-nowrap ${active ? (isDarkMode ? 'text-indigo-400' : 'text-indigo-600') : 'opacity-80'}`}>{label}</span>
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
            <span className={`text-[10px] font-bold tracking-tighter ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>({amount})</span>
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
