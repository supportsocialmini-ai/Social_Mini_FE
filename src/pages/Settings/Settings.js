import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/Layout/Navbar';
import { toast } from 'react-toastify';
import userService from '../../services/userService';
import authService from '../../services/authService';

const Settings = () => {
  const { user, logout, getFullAvatarUrl, updateUserData } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const sidebarItems = [
    { id: 'security', label: t('settings.security'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )},
    { id: 'privacy', label: t('settings.privacy'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )},
    { id: 'appearance', label: t('settings.appearance'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    )},
    { id: 'help', label: t('settings.helpSupport'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
  ];

  const handleSaveProfile = async () => {
    const fullNameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    const usernameRegex = /^[a-z0-9_]{4,30}$/;

    if (!formData.fullName) return toast.warn(t('api.FullNameRequired'));
    if (!fullNameRegex.test(formData.fullName)) {
        return toast.warn(formData.fullName.length < 2 || formData.fullName.length > 100 
            ? t('api.FullNameLength') 
            : t('api.FullNameInvalid'));
    }

    if (!formData.username) return toast.warn(t('api.UsernameRequired'));
    if (!usernameRegex.test(formData.username)) {
        return toast.warn(formData.username.length < 4 || formData.username.length > 30
            ? t('api.UsernameLength')
            : t('api.UsernameInvalid'));
    }

    if (formData.bio && formData.bio.length > 255) {
        return toast.warn(t('api.BioTooLong'));
    }

    setLoading(true);
    try {
      await userService.updateUser(formData);
      updateUserData({ ...user, ...formData });
      // Silencing success toast per user request
    } catch (error) {
      toast.error(t(`api.${error.errorMessage || 'User.Profile.UpdateFail'}`));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOldPassword = async () => {
    if (!passwordData.oldPassword) return;
    setLoading(true);
    try {
      setIsPasswordVerified(true);
      // Silencing success toast per user request
    } catch (error) {
      toast.error(t(`api.${error.errorMessage || 'Auth.VerifyPassword.Fail'}`));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,50}$/;

    if (!passwordData.newPassword) return toast.warn('Mật khẩu không được để trống');
    if (!passwordRegex.test(passwordData.newPassword)) {
        return toast.warn(passwordData.newPassword.length < 6 || passwordData.newPassword.length > 50
            ? 'Mật khẩu phải từ 6 đến 50 ký tự'
            : 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số');
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('auth.passwordMismatch') || "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword(passwordData.oldPassword, passwordData.newPassword);
      // Silencing success toast per user request
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordVerified(false);
    } catch (error) {
      toast.error(t(`api.${error.errorMessage || 'Auth.ChangePassword.Fail'}`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <div className="max-w-6xl mx-auto sm:pt-8 sm:px-4 pb-16">
        <div className="bg-white sm:rounded-3xl shadow-xl sm:border border-gray-100 overflow-hidden flex flex-col sm:flex-row min-h-[600px]">
          
          {/* Sidebar */}
          <aside className="w-full sm:w-72 border-b sm:border-b-0 sm:border-r border-gray-100 flex flex-col p-4 sm:p-6">
            <div className="hidden sm:flex items-center gap-2 mb-8 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => navigate(-1)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">{t('settings.title')}</h1>
            </div>

            <nav className="flex sm:flex-col overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 gap-2 sm:space-y-1 scrollbar-hide">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex-shrink-0 sm:w-full flex items-center justify-between px-4 py-2 sm:py-3 rounded-xl transition-all ${
                    activeTab === item.id 
                    ? 'bg-[#1a1a1a] text-white shadow-lg' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${activeTab === item.id ? 'text-white' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">{item.label}</span>
                  </div>
                  {activeTab !== item.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </nav>

            <button 
              onClick={logout}
              className="hidden sm:flex mt-8 items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('navbar.logout')}
            </button>
          </aside>

          {/* Content Area */}
          <main className="flex-1 p-6 sm:p-10 bg-white">
            {activeTab === 'edit-profile' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('settings.editProfile')}</h2>
                <p className="text-gray-400 text-sm mb-8">Manage your public profile information.</p>

                {/* Profile Photo Section */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-blue-500 border-4 border-white shadow-sm flex-shrink-0">
                      {user?.avatarUrl ? (
                        <img src={getFullAvatarUrl(user.avatarUrl)} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                          {user?.fullName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{t('settings.profilePhoto')}</h3>
                      <div className="flex gap-2 mt-3">
                        <input 
                          type="file" 
                          ref={avatarInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setAvatarUploading(true);
                            try {
                              const res = await userService.uploadAvatar(file);
                              // axiosClient đã bóc result nên res là { avatarUrl, user }
                              const newAvatarUrl = res?.avatarUrl;
                              updateUserData({ ...user, avatarUrl: newAvatarUrl });
                              // Silencing success toast per user request
                            } catch (err) {
                              toast.error(err.errorMessage || "Upload failed");
                            } finally {
                              setAvatarUploading(false);
                            }
                          }}
                        />
                        <button 
                          onClick={() => avatarInputRef.current.click()}
                          disabled={avatarUploading}
                          className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          {avatarUploading ? "..." : t('settings.changePhoto')}
                        </button>
                        <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
                          {t('settings.remove')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('settings.fullName')}</label>
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('settings.username')}</label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                      minLength={4}
                      maxLength={30}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('settings.bio')}</label>
                  <textarea 
                    rows="4"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell something about yourself..."
                    maxLength={255}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="bg-[#1a1a1a] text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {loading ? t('common.loading') : t('settings.saveChanges')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('settings.appearance')}</h2>
                <p className="text-gray-400 text-sm mb-8">Customize how the app looks and feels for you.</p>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4">{t('settings.language')}</h3>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => i18n.changeLanguage('vi')}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          i18n.language.startsWith('vi') 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-white bg-white hover:border-gray-100 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🇻🇳</span>
                          <span className="font-semibold text-gray-800">Tiếng Việt</span>
                        </div>
                        {i18n.language.startsWith('vi') && (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>

                      <button 
                        onClick={() => i18n.changeLanguage('en')}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          i18n.language.startsWith('en') 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-white bg-white hover:border-gray-100 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🇺🇸</span>
                          <span className="font-semibold text-gray-800">English (US)</span>
                        </div>
                        {i18n.language.startsWith('en') && (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="font-bold text-gray-900">Dark Mode</h3>
                       <div className="w-12 h-6 bg-gray-200 rounded-full relative">
                         <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                       </div>
                    </div>
                    <p className="text-xs text-gray-400 italic">Coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('settings.securityTitle')}</h2>
                <p className="text-gray-400 text-sm mb-8">{t('settings.securityDesc')}</p>

                <div className="space-y-6">
                  {/* Hidden field to trap browser's auto-fill (prevents it from filling the Navbar search) */}
                  <input type="text" name="username" style={{ display: 'none' }} autoComplete="username" />
                  
                  <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                    <div className="space-y-5">
                      {!isPasswordVerified ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('settings.oldPassword')}</label>
                            <input 
                              type="password" 
                              value={passwordData.oldPassword}
                              onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                              placeholder="••••••••"
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                          <button 
                            onClick={handleVerifyOldPassword}
                            disabled={loading || !passwordData.oldPassword}
                            className="w-full bg-[#1a1a1a] text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                          >
                            {loading ? t('common.loading') : t('common.next') || "Next"}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-xs font-bold mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Mật khẩu cũ đã xác nhận
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('settings.newPassword')}</label>
                              <input 
                                type="password" 
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('settings.confirmPassword')}</label>
                              <input 
                                type="password" 
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                placeholder="••••••••"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div className="pt-4">
                            <button 
                              onClick={handleChangePassword}
                              disabled={loading || !passwordData.newPassword}
                              className="w-full bg-[#1a1a1a] text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                            >
                              {loading ? t('common.loading') : t('settings.changePassword')}
                            </button>
                            <button 
                              onClick={() => {
                                setIsPasswordVerified(false);
                                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                              }}
                              className="w-full mt-3 text-gray-400 text-xs font-bold hover:text-gray-600 transition-colors"
                            >
                              {t('common.cancel') || "Cancel"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-blue-900 font-bold text-sm mb-1">Two-Factor Authentication</h4>
                      <p className="text-blue-700 text-xs">Add an extra layer of security to your account by enabling 2FA. (Coming soon)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {['privacy', 'notifications', 'help'].includes(activeTab) && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  {sidebarItems.find(i => i.id === activeTab)?.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{sidebarItems.find(i => i.id === activeTab)?.label}</h2>
                <p className="text-gray-400 max-w-sm">This section is currently under development. Stay tuned for updates!</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;
