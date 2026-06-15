import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import PostCard from '../../components/Post/PostCard';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import postService from '../../services/postService';
import friendService from '../../services/friendService';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';

const Profile = () => {
  const { userId: routeUserId } = useParams();
  const location = useLocation();
  const { user: currentUser, updateUserData, getFullAvatarUrl } = useAuth();
  const { t } = useTranslation();
  const [profileUser, setProfileUser] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState('None');
  const [requestId, setRequestId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [formData, setFormData] = useState({ 
    username: '', 
    fullName: '', 
    email: '', 
    avatarUrl: '', 
    bio: '',
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    interests: '',
    category: ''
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [pastedAvatarUrl, setPastedAvatarUrl] = useState('');
  const [imageUrlMode, setImageUrlMode] = useState(false);
  const [customInterest, setCustomInterest] = useState('');
  const [systemInterests, setSystemInterests] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const SUGGESTED_INTERESTS = ["Công nghệ", "Đánh cầu", "Du lịch", "Ẩm thực", "Âm nhạc", "Phim ảnh", "Kinh doanh", "Thể thao", "Nghệ thuật"];
  const PRESET_CATEGORIES = ["Công nghệ", "Kinh doanh", "Giải trí", "Giáo dục", "Khoa học", "Sức khỏe", "Thể thao", "Nghệ thuật", "Xã hội", "Đời sống", "Văn hóa", "Thiên nhiên", "Chính trị", "Tôn giáo", "Công nghiệp", "Truyền thông", "Mua sắm", "Du lịch", "Ẩm thực", "Thời trang", "Gia đình", "Quan hệ", "Nghề nghiệp", "Tài chính", "Nhà cửa", "Xe cộ", "Cộng đồng", "Sở thích", "Hoạt động ngoài trời", "Phát triển bản thân"];

  const isOwnProfile = !routeUserId || routeUserId === String(currentUser?.userId);

  const fetchProfilePosts = async (targetUser) => {
    try {
      const activeUserId = targetUser?.userId || profileUser?.userId || currentUser?.userId || routeUserId;
      const response = activeUserId 
        ? await postService.getPostsByUserId(activeUserId)
        : await postService.getMyPosts();
      // axiosClient đã bóc result
      let rawPosts = Array.isArray(response) ? response : (response?.$values || []);

      const normalizedPosts = rawPosts.filter(p => p).map(post => {
        const postUser = post.user || post.User || {};
        const activeUser = (postUser.avatarUrl || postUser.AvatarUrl) ? postUser : (targetUser || profileUser || currentUser || {});
        const name = activeUser.fullName || activeUser.FullName || post.fullName || post.FullName || activeUser.username || post.username || 'Người dùng';
        return {
          ...post,
          postId: post.postId || post.id,
          userId: post.userId || post.UserId,
          author: String(name),
          authorAvatar: getFullAvatarUrl(activeUser?.avatarUrl || activeUser?.AvatarUrl, name),
          avatarUrl: getFullAvatarUrl(activeUser?.avatarUrl || activeUser?.AvatarUrl, name),
          time: post.time || post.createdAt || 'Vừa xong',
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
          isLiked: post.isLiked || false
        };
      });
      setPosts(normalizedPosts);
    } catch (error) {
      console.error("Lỗi lấy bài viết:", error);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      let profileOwner = null;
      try {
        if (isOwnProfile) {
          profileOwner = currentUser;
          setProfileUser(currentUser);
          if (currentUser) {
            const userCat = currentUser.category || '';
            const isPreset = PRESET_CATEGORIES.includes(userCat) || userCat === '';
            setFormData({
              username: currentUser.username || '',
              fullName: currentUser.fullName || '',
              email: currentUser.email || '',
              avatarUrl: currentUser.avatarUrl || '',
              bio: currentUser.bio || '',
              gender: currentUser.gender || '',
              dateOfBirth: currentUser.dateOfBirth ? currentUser.dateOfBirth.split('T')[0] : '',
              phoneNumber: currentUser.phoneNumber || '',
              interests: currentUser.interests || '',
              category: isPreset ? userCat : 'Other'
            });
            setCustomCategoryName(isPreset ? '' : userCat);
            setShowCustomCategory(!isPreset);
          }
        } else {
          // Lấy thông tin người dùng từ DB theo ID
          const foundUser = await userService.getUserById(routeUserId);
          profileOwner = foundUser;
          setProfileUser(foundUser);
          const userCat = foundUser?.category || '';
          const isPreset = PRESET_CATEGORIES.includes(userCat) || userCat === '';
          setFormData({
            username: foundUser?.username || '',
            fullName: foundUser?.fullName || '',
            email: foundUser?.email || '',
            avatarUrl: foundUser?.avatarUrl || '',
            bio: foundUser?.bio || '',
            gender: foundUser?.gender || '',
            dateOfBirth: foundUser?.dateOfBirth ? foundUser?.dateOfBirth.split('T')[0] : '',
            phoneNumber: foundUser?.phoneNumber || '',
            interests: foundUser?.interests || '',
            category: isPreset ? userCat : 'Other'
          });
          setCustomCategoryName(isPreset ? '' : userCat);
          setShowCustomCategory(!isPreset);
        }

        if (!isOwnProfile && routeUserId) {
          // Lấy trạng thái bạn bè thực tế từ DB
          const statusRes = await friendService.getFriendshipStatus(routeUserId);
          setFriendshipStatus(statusRes?.status || 'None');
          setRequestId(statusRes?.requestId || null);
        }
        
        if (isOwnProfile) {
          try {
            const res = await userService.getUniqueInterests();
            const data = Array.isArray(res) ? res : (res?.$values || res?.data || []);
            setSystemInterests(data);
          } catch (err) {
            console.error("Failed to load unique interests:", err);
          }
        }

        await fetchProfilePosts(profileOwner);
      } catch (error) {
        console.error("Lỗi fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [routeUserId, currentUser, isOwnProfile]);

  const handleAddFriend = async () => {
    // Optimistic update
    setFriendshipStatus('Sent');
    try { 
      await friendService.sendRequest(routeUserId); 
    } catch (error) { 
      console.error("Error sending request:", error); 
      // We keep 'Sent' status for better UX if the error is 400 (already sent)
    }
  };
  const handleAcceptRequest = async () => {
    try { if (!requestId) return; await friendService.acceptRequest(requestId); setFriendshipStatus('Accepted'); }
    catch (error) { console.error("Error accepting request:", error); }
  };
  const handleCancelRequest = async () => {
    try { if (!requestId) return; await friendService.cancelRequest(requestId); setFriendshipStatus('None'); setRequestId(null); }
    catch (error) { console.error("Error canceling request:", error); }
  };
  const handleUnfriend = async () => {
    try { await friendService.unfriend(profileUser.userId); setFriendshipStatus('None'); setRequestId(null); }
    catch (error) { console.error("Error unfriending:", error); }
  };
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    
    // Split current interests and add the new one if not already present
    const current = formData.interests ? formData.interests.split(',').map(i => i.trim()).filter(Boolean) : [];
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      setFormData({ ...formData, interests: updated.join(', ') });
    }
    setCustomInterest('');
  };

  const handleAddSuggestedInterest = (suggestion) => {
    const current = formData.interests ? formData.interests.split(',').map(i => i.trim()).filter(Boolean) : [];
    if (!current.includes(suggestion)) {
      const updated = [...current, suggestion];
      setFormData(prev => ({ ...prev, interests: updated.join(', ') }));
    }
    setCustomInterest('');
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Regex constants
    const fullNameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    const usernameRegex = /^[a-z0-9_]{4,30}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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

    if (formData.email && (!emailRegex.test(formData.email) || formData.email.length > 255)) {
      return toast.warn(!emailRegex.test(formData.email) ? t('api.EmailInvalid') : t('api.EmailLength') || 'Email too long');
    }

    const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      return toast.warn(t('api.PhoneNumberInvalid'));
    }

    if (formData.category === 'Other' && !customCategoryName.trim()) {
      return toast.warn("Vui lòng nhập lĩnh vực quan tâm chính của bạn!");
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      if (payload.dateOfBirth === '') payload.dateOfBirth = null;
      if (payload.category === 'Other') {
        payload.category = customCategoryName.trim();
      }
      
      const response = await userService.updateUser(payload);
      updateUserData(response || formData);
      setIsEditing(false); 
      toast.success(t('api.User.Profile.UpdateSuccess'));
    } catch (error) { 
      toast.error(t(`api.${error.errorMessage || 'User.Profile.UpdateFail'}`)); 
    }
    finally { setLoading(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const res = await userService.uploadAvatar(file);
      const newAvatarUrl = res?.avatarUrl;
      const updatedUser = res?.user;
      if (updatedUser) {
        updateUserData(updatedUser);
        setProfileUser(updatedUser);
      } else if (newAvatarUrl) {
        const updated = { ...profileUser, avatarUrl: newAvatarUrl };
        updateUserData(updated);
        setProfileUser(updated);
      }
      // Silencing success toast per user request
    } catch (error) {
      toast.error(t(`api.${error.errorMessage || 'User.Avatar.UploadFail'}`));
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveAvatarUrl = async () => {
    if (!pastedAvatarUrl) return;
    setLoading(true);
    try {
      const payload = {
        fullName: profileUser.fullName || profileUser.username,
        username: profileUser.username,
        email: profileUser.email,
        bio: profileUser.bio || '',
        avatarUrl: pastedAvatarUrl,
        gender: profileUser.gender || '',
        dateOfBirth: profileUser.dateOfBirth ? profileUser.dateOfBirth.split('T')[0] : null,
        phoneNumber: profileUser.phoneNumber || '',
        interests: profileUser.interests || '',
        category: profileUser.category || ''
      };
      
      const response = await userService.updateUser(payload);
      const updated = response || { ...profileUser, avatarUrl: pastedAvatarUrl };
      updateUserData(updated);
      setProfileUser(updated);
      setIsAvatarModalOpen(false);
      setPastedAvatarUrl('');
      setImageUrlMode(false);
      toast.success("Đã cập nhật ảnh đại diện thành công!");
    } catch (error) {
      toast.error(t(`api.${error.errorMessage || 'User.Avatar.UploadFail'}`) || "Lỗi cập nhật ảnh đại diện");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    try {
      const payload = {
        fullName: profileUser.fullName || profileUser.username,
        username: profileUser.username,
        email: profileUser.email,
        bio: profileUser.bio || '',
        avatarUrl: "default_avatar.png",
        gender: profileUser.gender || '',
        dateOfBirth: profileUser.dateOfBirth ? profileUser.dateOfBirth.split('T')[0] : null,
        phoneNumber: profileUser.phoneNumber || '',
        interests: profileUser.interests || '',
        category: profileUser.category || ''
      };
      
      const response = await userService.updateUser(payload);
      const updated = response || { ...profileUser, avatarUrl: "default_avatar.png" };
      updateUserData(updated);
      setProfileUser(updated);
      setIsAvatarModalOpen(false);
      toast.success("Đã khôi phục ảnh đại diện mặc định!");
    } catch (error) {
      toast.error(t(`api.${error.errorMessage || 'User.Avatar.UploadFail'}`) || "Lỗi khôi phục ảnh đại diện");
    } finally {
      setLoading(false);
    }
  };

  const renderActionButtons = () => {
    if (isOwnProfile) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-700 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t('profile.editProfile')}
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-all border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      );
    }
    const btnClass = "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all";
    
    return (
      <div className="flex items-center gap-2">
        {friendshipStatus === 'Accepted' && (
          <button onClick={() => setIsConfirmOpen(true)} className={`${btnClass} bg-red-50 text-red-600 hover:bg-red-100`}>
            {t('friends.unfriend')}
          </button>
        )}
        {friendshipStatus === 'Sent' && (
          <button onClick={handleCancelRequest} className={`${btnClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
            {t('profile.cancelRequest') || 'Cancel Request'}
          </button>
        )}
        {friendshipStatus === 'Received' && (
          <button onClick={handleAcceptRequest} className={`${btnClass} bg-gray-900 text-white hover:bg-gray-700`}>
            {t('friends.accept')}
          </button>
        )}
        {friendshipStatus === 'None' && (
          <button onClick={handleAddFriend} className={`${btnClass} bg-gray-900 text-white hover:bg-gray-700`}>
            {t('profile.follow')}
          </button>
        )}
        
        {/* Always show Message button for others */}
        <button 
          onClick={() => window.location.href = `/messaging?userId=${profileUser.userId}`}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {t('messaging.title')}
        </button>
      </div>
    );
  };

  // Posts có ảnh để hiển thị dạng grid
  const postsWithImage = posts.filter(p => p.imageUrl);

  // Lọc gợi ý sở thích động từ hệ thống (kết hợp hardcode + từ DB)
  const allInterestPool = [...new Set([...SUGGESTED_INTERESTS, ...systemInterests])];
  const filteredSuggestions = allInterestPool.filter(interest => {
    const trimmedInput = customInterest.trim().toLowerCase();
    if (!trimmedInput) return false;
    const currentSelected = formData.interests ? formData.interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean) : [];
    return interest.toLowerCase().includes(trimmedInput) && !currentSelected.includes(interest.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleUp {
          from { transform: scale(0.95) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .modal-backdrop {
          animation: modalFadeIn 0.3s ease-out forwards;
        }
        .modal-content {
          animation: modalScaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      <Navbar />

      {/* Cover Banner */}
      <div className="relative w-full h-56 md:h-72 bg-gradient-to-br from-slate-400 via-gray-500 to-slate-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-10">

        {/* Avatar + Actions Row */}
        <div className="flex items-end justify-between -mt-16 mb-4">
          {/* Avatar */}
          <div className="relative">
            {/* Hidden file input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div
              onClick={isOwnProfile ? () => setIsAvatarModalOpen(true) : undefined}
              className={`w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white bg-gradient-to-br from-indigo-400 to-blue-500 overflow-hidden shadow-lg ${isOwnProfile ? 'cursor-pointer' : ''} relative group`}
            >
              <img
                src={getFullAvatarUrl(profileUser?.avatarUrl, profileUser?.fullName || profileUser?.username)}
                alt="avatar"
                className="w-full h-full object-cover"
              />
              {/* Upload overlay (own profile only) */}
              {isOwnProfile && (
                <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-all ${avatarUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                  {avatarUploading ? (
                    <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-white text-[10px] font-bold">{t('profile.changePhoto')}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {isOwnProfile && !avatarUploading && (
              <button
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-1 right-1 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center border-2 border-white hover:bg-gray-700 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pb-2">
            {renderActionButtons()}
          </div>
        </div>


        {/* Name, Username, Bio */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-gray-900">{profileUser?.fullName || profileUser?.username || 'User'}</h1>
            {isOwnProfile && (
              <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-black rounded-full tracking-widest uppercase">PRO</span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-3">@{profileUser?.username || 'username'}</p>
          
          {/* Thông tin gói Premium & Ngày hết hạn */}
          {profileUser?.subscriptions?.some(s => s.isActive) && (
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              {profileUser.subscriptions
                .filter(s => s.isActive)
                .map(sub => {
                  const endDate = sub.endDate || sub.EndDate;
                  const formattedDate = endDate 
                    ? new Date(endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Không thời hạn';
                  return (
                    <span key={sub.id} className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
                      <Crown className="w-3.5 h-3.5 fill-current text-amber-500" />
                      <span>{sub.tier || 'Premium'}: Hạn dùng {formattedDate}</span>
                    </span>
                  );
                })
              }
            </div>
          )}

          <p className="text-gray-700 text-sm leading-relaxed max-w-lg mb-3 flex flex-col gap-1">
            {profileUser?.email && <span>📧 {profileUser.email}</span>}
            {profileUser?.phoneNumber && <span>📱 {profileUser.phoneNumber}</span>}
          </p>
          {profileUser?.bio && (
            <div className="bg-slate-50/50 border-l-4 border-indigo-200 px-4 py-2 rounded-r-xl mb-4 max-w-xl">
              <p className="text-gray-600 text-sm leading-relaxed italic">
                {profileUser.bio}
              </p>
            </div>
          )}
          {(profileUser?.category || profileUser?.interests) && (
            <div className="space-y-2.5 mt-2 mb-4">
              {profileUser?.category && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 font-bold min-w-[110px]">Lĩnh vực chính:</span>
                  <span className="px-2.5 py-1 bg-gray-900 text-white text-[10px] font-black rounded-lg uppercase tracking-wide">
                    {profileUser.category}
                  </span>
                </div>
              )}
              {profileUser?.interests && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-gray-500 font-bold min-w-[110px] mt-1">Sở thích cá nhân:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profileUser.interests.split(',').map((interest, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100/50">
                        #{interest.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('profile.joined')} {profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'MiniSocial'}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-8 mt-6">
          <div className="text-center">
            <p className="font-black text-slate-900 text-xl">{(posts.length)}</p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('profile.posts')}</p>
          </div>
          <div className="text-center">
            <p className="font-black text-slate-900 text-xl">0</p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('profile.followers')}</p>
          </div>
          <div className="text-center">
            <p className="font-black text-slate-900 text-xl">0</p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('profile.following')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${activeTab === 'posts' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-[11px] font-black uppercase tracking-widest">{t('profile.posts')}</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${activeTab === 'saved' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="text-[11px] font-black uppercase tracking-widest">{t('profile.saved')}</span>
          </button>
          <button
            onClick={() => setActiveTab('tagged')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${activeTab === 'tagged' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-[11px] font-black uppercase tracking-widest">{t('profile.tagged')}</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <>
            {/* All Posts Feed */}
            <div className="space-y-4 pb-16">
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard
                    key={post.postId || post.id}
                    post={post}
                    user={currentUser}
                    getFullAvatarUrl={getFullAvatarUrl}
                    onLikeChange={fetchProfilePosts}
                    onPostDelete={fetchProfilePosts}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center py-20 text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="font-semibold text-gray-400">{t('profile.noPosts')}</p>
                </div>
              )}
            </div>
          </>   
        )}

        {activeTab === 'saved' && (
          <div className="flex flex-col items-center py-20 text-gray-300 pb-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="font-semibold text-gray-400">{t('profile.noSaved')}</p>
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="flex flex-col items-center py-20 text-gray-300 pb-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="font-semibold text-gray-400">{t('profile.noTagged')}</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleUnfriend}
        title={t('profile.unfriendConfirmTitle')}
        message={t('profile.unfriendConfirmMsg', { name: profileUser?.fullName || profileUser?.username })}
        confirmText={t('profile.unfriendConfirmBtn')}
        type="danger"
      />

      {/* Edit Profile Modal */}
      {isEditing && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm modal-backdrop"
            onClick={() => setIsEditing(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden modal-content flex flex-col max-h-[85vh]"
            style={{ backgroundColor: '#ffffff', backdropFilter: 'none' }}
          >
            {/* Fixed Header */}
            <div className="px-8 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('profile.editProfile')}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{t('profile.personalInfo')}</p>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 min-h-0">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.fullNamePlaceholder')}</label>
                  <input name="fullName" value={formData.fullName} onChange={handleChange} required minLength={2} maxLength={100}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.usernamePlaceholder')}</label>
                  <input name="username" value={formData.username} onChange={handleChange} required minLength={4} maxLength={30}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.emailLabel')}</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('profile.bioPlaceholder')}</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} maxLength={255} rows="3"
                    placeholder={t('profile.bioPlaceholder')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.phoneNumber')}</label>
                  <input name="phoneNumber" type="text" value={formData.phoneNumber} onChange={handleChange} placeholder="0912345678"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lĩnh vực quan tâm</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all flex items-center justify-between text-slate-700 text-left cursor-pointer"
                    >
                      <span>
                        {formData.category === 'Other' 
                          ? (customCategoryName.trim() ? customCategoryName : "Lĩnh vực khác...") 
                          : (formData.category || "Chọn lĩnh vực quan tâm")}
                      </span>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isCategoryDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[10000]" onClick={() => setIsCategoryDropdownOpen(false)} />
                        <div className="absolute z-[10001] left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-1 duration-150 custom-scrollbar">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: '' });
                              setShowCustomCategory(false);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-400 hover:bg-slate-50 transition-colors"
                          >
                            Chọn lĩnh vực quan tâm
                          </button>
                          {PRESET_CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, category: cat });
                                setShowCustomCategory(false);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                                formData.category === cat ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{cat}</span>
                              {formData.category === cat && (
                                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: 'Other' });
                              setShowCustomCategory(true);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                              formData.category === 'Other' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>Lĩnh vực khác...</span>
                            {formData.category === 'Other' && (
                              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {showCustomCategory && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhập lĩnh vực quan tâm khác</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nhập lĩnh vực quan tâm khác..."
                      value={customCategoryName}
                      onChange={e => setCustomCategoryName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                )}

                {formData.interests && formData.interests.split(',').map(i => i.trim()).filter(Boolean).length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sở thích đã chọn</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl items-center">
                      {formData.interests.split(',').map(i => i.trim()).filter(Boolean).map((interest, idx) => (
                        <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-md shadow-indigo-100">
                          {interest}
                          <button
                            type="button"
                            onClick={() => {
                              const current = formData.interests.split(',').map(i => i.trim()).filter(Boolean);
                              const updated = current.filter(item => item !== interest);
                              setFormData({ ...formData, interests: updated.join(', ') });
                            }}
                            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/20 text-white/80 hover:text-white transition-all font-normal text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thêm sở thích khác</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInterest}
                      onChange={(e) => {
                        setCustomInterest(e.target.value);
                        setShowSuggestions(true);
                        setActiveSuggestionIndex(-1);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        // Trì hoãn ẩn dropdown để người dùng kịp click chuột
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (activeSuggestionIndex >= 0 && activeSuggestionIndex < filteredSuggestions.length) {
                            const selected = filteredSuggestions[activeSuggestionIndex];
                            handleAddSuggestedInterest(selected);
                          } else {
                            handleAddCustomInterest();
                          }
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setActiveSuggestionIndex(prev => 
                            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
                        } else if (e.key === 'Escape') {
                          setShowSuggestions(false);
                        }
                      }}
                      placeholder="Nhập sở thích khác..."
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomInterest}
                      className="px-4 py-3 bg-indigo-600 text-white font-bold text-sm rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-md shadow-indigo-100"
                    >
                      Thêm
                    </button>
                  </div>

                  {/* Dropdown gợi ý động từ hệ thống */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto py-1.5 animate-fadeIn">
                      {filteredSuggestions.map((suggestion, idx) => (
                        <button
                          key={suggestion}
                          type="button"
                          onMouseDown={() => handleAddSuggestedInterest(suggestion)}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all flex items-center justify-between ${
                            idx === activeSuggestionIndex 
                              ? 'bg-indigo-600 text-white' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                          }`}
                        >
                          <span>{suggestion}</span>
                          <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                            idx === activeSuggestionIndex ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-500'
                          }`}>
                            Gợi ý hệ thống
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gợi ý sở thích</label>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_INTERESTS.map(interest => {
                      const isSelected = formData.interests?.split(',').map(i => i.trim()).filter(Boolean).includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => {
                            const currentInterests = formData.interests ? formData.interests.split(',').map(i => i.trim()).filter(Boolean) : [];
                            let newInterests;
                            if (isSelected) {
                              newInterests = currentInterests.filter(i => i !== interest);
                            } else {
                              newInterests = [...currentInterests, interest];
                            }
                            setFormData({ ...formData, interests: newInterests.join(', ') });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            isSelected 
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                              : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-300'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giới tính</label>
                    <select name="gender" value={formData.gender} onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer">
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày sinh</label>
                    <input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                  </div>
                </div>

              </div>

              {/* Fixed Footer */}
              <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  {t('profile.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {loading ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Avatar Option/URL Modal */}
      {isAvatarModalOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm modal-backdrop"
            onClick={() => {
              setIsAvatarModalOpen(false);
              setPastedAvatarUrl('');
              setImageUrlMode(false);
            }}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden modal-content p-8"
            style={{ backgroundColor: '#ffffff', backdropFilter: 'none' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Thay đổi ảnh đại diện</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Chọn phương thức tải ảnh</p>
              </div>
              <button 
                onClick={() => {
                  setIsAvatarModalOpen(false);
                  setPastedAvatarUrl('');
                  setImageUrlMode(false);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!imageUrlMode ? (
              <div className="space-y-4">
                {/* Option 1: Choose from device */}
                <button
                  type="button"
                  onClick={() => {
                    avatarInputRef.current?.click();
                    setIsAvatarModalOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all group text-left bg-white"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-all shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">Chọn ảnh từ thiết bị</p>
                    <p className="text-xs text-slate-400 mt-0.5">Tải lên ảnh từ máy tính hoặc điện thoại của bạn</p>
                  </div>
                </button>

                {/* Option 2: Paste URL */}
                <button
                  type="button"
                  onClick={() => setImageUrlMode(true)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all group text-left bg-white"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-all shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">Sử dụng liên kết ảnh (URL)</p>
                    <p className="text-xs text-slate-400 mt-0.5">Dán đường dẫn ảnh trực tuyến (HTTP/HTTPS)</p>
                  </div>
                </button>

                {/* Option 3: Reset to default */}
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-red-500 hover:bg-red-50/10 transition-all group text-left bg-white"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-all shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">Sử dụng ảnh mặc định</p>
                    <p className="text-xs text-slate-400 mt-0.5">Khôi phục về ảnh đại diện chữ cái mặc định</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đường dẫn ảnh (URL)</label>
                  <input 
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={pastedAvatarUrl}
                    onChange={(e) => setPastedAvatarUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {pastedAvatarUrl && (
                  <div className="space-y-2 flex flex-col items-center py-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-start ml-1">Xem trước ảnh</label>
                    <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-indigo-100 shadow-inner bg-slate-50 relative">
                      <img 
                        src={pastedAvatarUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://placehold.co/150?text=Anh+loi";
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setImageUrlMode(false);
                      setPastedAvatarUrl('');
                    }}
                    className="flex-1 px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    Quay lại
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaveAvatarUrl}
                    disabled={loading || !pastedAvatarUrl}
                    className="flex-1 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    {loading ? "Đang lưu..." : "Lưu ảnh"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Profile;