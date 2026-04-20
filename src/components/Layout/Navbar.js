/** No-op to fix casing **/
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import { useChat } from '../../context/ChatContext';
import { ChatBubbleManager, MessengerDropdown } from '../Chat/ChatBubble';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { user, logout, getFullAvatarUrl, isAdmin } = useAuth();
  const { unreadMessageCount, onlineUsers, unreadCountsPerUser, connection } = useChat();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [openChats, setOpenChats] = useState([]);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsSuggestOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) setIsMobileSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close all dropdowns on route change
  useEffect(() => {
    setIsSuggestOpen(false);
    setIsNotifOpen(false);
    setIsMenuOpen(false);
    setIsMobileSearchOpen(false);
    setSearchInput(''); // Clear search on navigation
  }, [location.pathname]);

  useEffect(() => {
    if (searchInput.trim().length < 2) { setSuggestions([]); setIsSuggestOpen(false); return; }
    setSuggestLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { default: searchService } = await import('../../services/searchService');
        const res = await searchService.search(searchInput.trim());
        const users = res?.users || res?.$values || res || [];
        setSuggestions(Array.isArray(users) ? users.slice(0, 6) : []);
        setIsSuggestOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchInput.trim().length >= 2) {
      setIsSuggestOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
    if (e.key === 'Escape') setIsSuggestOpen(false);
  };

  const handleSuggestionClick = (userId) => {
    setIsSuggestOpen(false);
    setSearchInput('');
    navigate(`/profile/${userId}`);
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (connection && connection.state === 'Connected') {
      connection.on('ReceiveNotification', (rawMsg) => {
        const [key, senderName] = rawMsg.split('|');
        setUnreadCount(prev => prev + 1);
        fetchNotifications();
        const translated = t(`api.${key}`, { name: senderName || t('navbar.user') });
        toast.info(translated);
      });
      return () => connection.off('ReceiveNotification');
    }
  }, [connection]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      let data = Array.isArray(response) ? response : (response?.$values || []);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Lỗi fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (chatUser) => {
    setOpenChats(prev => {
      if (prev.find(c => c.userId === chatUser.userId)) return prev;
      return [...prev, chatUser];
    });
  };

  const handleCloseChat = (userId) => {
    setOpenChats(prev => prev.filter(c => c.userId !== userId));
  };

  return (
    <>
      <nav className="sticky top-0 z-[2000] px-4 py-2 sm:py-3"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(99,102,241,0.1)',
          boxShadow: '0 4px 24px rgba(99,102,241,0.06)',
        }}>
        <div className="max-w-full mx-auto flex justify-between items-center px-4 sm:px-8">
          <Link to="/" className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-600 bg-clip-text text-transparent tracking-tighter hover:opacity-80 transition-opacity">
            MiniSocial
          </Link>

          {/* Search bar */}
          <div ref={searchRef} className="hidden sm:block relative mx-4 flex-1 max-w-md">
            <div className="flex items-center bg-gray-100 border border-gray-200 px-4 py-2 rounded-full focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                name="navbar-search-desktop"
                autoComplete="off"
                placeholder={t('navbar.search')}
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); }}
                onFocus={() => suggestions.length > 0 && setIsSuggestOpen(true)}
                onKeyDown={handleSearchKeyDown}
                className="bg-transparent outline-none text-sm w-full placeholder:text-gray-400 font-medium"
              />
              {suggestLoading && (
                <div className="ml-2 w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </div>

            {isSuggestOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('navbar.people')}</p>
                </div>
                {suggestions.map((u) => (
                  <button
                    key={u.userId}
                    onMouseDown={() => handleSuggestionClick(u.userId)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors group text-left"
                  >
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 overflow-hidden">
                        <img src={getFullAvatarUrl(u.avatarUrl, u.fullName || u.username)} alt={u.fullName} className="w-full h-full object-cover" />
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${onlineUsers.has(u.userId) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 truncate transition-colors">{u.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            {/* Mobile search toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="sm:hidden p-2 rounded-full hover:bg-gray-100 transition-all text-gray-700 hover:text-indigo-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={async () => {
                  const newStatus = !isNotifOpen;
                  setIsNotifOpen(newStatus);
                  if (newStatus && unreadCount > 0) {
                    try {
                      await notificationService.markAllAsRead();
                      setUnreadCount(0);
                      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    } catch (err) { console.error('Lỗi mark all as read:', err); }
                  }
                }}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-all group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full text-white text-[9px] sm:text-xs font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {/* Notification Dropdown — always rendered to prevent jitter */}
              <div
                className="absolute right-0 top-full mt-3 bg-white rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(99,102,241,0.3),0_10px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100 z-50 w-80 max-h-96 overflow-hidden flex flex-col"
                style={{
                  backgroundColor: '#ffffff',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                  opacity: isNotifOpen ? 1 : 0,
                  transform: isNotifOpen ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
                  pointerEvents: isNotifOpen ? 'auto' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
                  willChange: 'transform, opacity',
                }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
                  <h3 className="font-extrabold text-slate-900 text-base tracking-tight">{t('navbar.notifications')}</h3>
                </div>
                <div className="overflow-y-auto flex-1 px-1 py-1">
                  {notifications.length > 0 ? (
                    <div className="space-y-0.5">
                      {notifications.slice(0, 10).map((notif) => {
                        const senderName = notif.sender?.fullName || notif.sender?.username || t('navbar.user');
                        const translatedMsg = t(`api.${notif.message}`, { name: senderName });
                        return (
                          <div key={notif.notificationId} className="px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-all border-b border-transparent last:border-0 group">
                            <p className="text-sm text-slate-800 leading-snug">
                              <span className="font-bold text-slate-900">{senderName}</span>
                              {" "}
                              {translatedMsg.replace(senderName, "").trim()}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-wider">Vừa xong</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      </div>
                      <p className="text-slate-400 text-sm font-semibold">{t('navbar.noNotifs')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop: Messenger Dropdown */}
            <div className="hidden sm:flex items-center gap-4">
              {/* Messenger Dropdown — click opens bubble, "Xem tất cả" goes to /messaging */}
              <MessengerDropdown
                onOpenChat={handleOpenChat}
                getFullAvatarUrl={getFullAvatarUrl}
                onlineUsers={onlineUsers}
                unreadCountsPerUser={unreadCountsPerUser}
              />
            </div>

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 sm:gap-3 p-1 sm:px-3 sm:py-2 rounded-full hover:bg-gray-100 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                  <img src={getFullAvatarUrl(user?.avatarUrl, user?.fullName || user?.username)} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <span className="text-gray-800 font-semibold text-sm hidden lg:block">{user?.fullName || t('navbar.user')}</span>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 min-w-[200px] overflow-hidden">
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-all border-b border-gray-100">
                    <span className="font-semibold">{t('navbar.profile')}</span>
                  </Link>

                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-indigo-600 hover:bg-indigo-50 transition-all border-b border-gray-100">
                      <span className="font-bold">Dashboard Admin</span>
                    </Link>
                  )}
                  <button onClick={logout} className="w-full text-left flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-all font-semibold">
                    {t('navbar.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile search slide-down */}
       {isMobileSearchOpen && (
        <div ref={mobileSearchRef} className="sm:hidden fixed inset-x-0 top-[64px] z-40 bg-white border-b border-gray-100 p-3 shadow-md">
          <div className="relative">
            <div className="flex items-center bg-gray-100 border border-gray-200 px-4 py-2 rounded-full focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                name="navbar-search-mobile"
                autoComplete="off"
                autoFocus
                placeholder={t('navbar.search')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchInput.trim().length >= 2) {
                    setIsMobileSearchOpen(false);
                    handleSearchKeyDown(e);
                  }
                }}
                className="bg-transparent outline-none text-sm w-full placeholder:text-gray-400 font-medium"
              />
              <button onClick={() => setIsMobileSearchOpen(false)} className="ml-2 text-gray-400 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {searchInput.trim().length >= 2 && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-60 overflow-y-auto">
                {suggestions.map((u) => (
                  <button
                    key={u.userId}
                    onClick={() => { setIsMobileSearchOpen(false); handleSuggestionClick(u.userId); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors group text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 overflow-hidden flex-shrink-0">
                      <img src={getFullAvatarUrl(u.avatarUrl, u.fullName || u.username)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">@{u.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="sm:hidden fixed bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-2 z-50 flex justify-around items-center">
        {[
          { to: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: t('navbar.feed') },
          { to: '/friends', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: t('navbar.friends') },
          { to: '/messaging', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: t('navbar.chat'), count: unreadMessageCount },
          { to: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z', label: t('navbar.settings') },
        ].map(item => (
          <Link key={item.to} to={item.to} className="relative p-3 rounded-2xl transition-all text-gray-400 hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            {item.count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {item.count > 9 ? '9+' : item.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Floating Chat Bubbles */}
      <ChatBubbleManager
        openChats={openChats}
        onClose={handleCloseChat}
        connection={connection}
        getFullAvatarUrl={getFullAvatarUrl}
        currentUser={user}
        onlineUsers={onlineUsers}
      />
    </>
  );
};

export default Navbar;