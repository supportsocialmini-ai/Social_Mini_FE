import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import PostCard from '../../components/Post/PostCard';
import PostCreator from '../../components/Post/PostCreator';
import { useAuth } from '../../context/AuthContext';
import groupService from '../../services/groupService';
import friendService from '../../services/friendService';
import { toast } from 'react-toastify';
import { useChat } from '../../context/ChatContext';
import { useTranslation } from 'react-i18next';

const glass = {
  card: {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: '0 8px 32px rgba(99,102,241,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  }
};

const GroupDetail = () => {
  const { groupId } = useParams();
  const { user, isAdmin: isSystemAdmin, getFullAvatarUrl } = useAuth();
  const { handleOpenChat } = useChat();
  const { t, i18n } = useTranslation();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  // Manage members modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [kickingUserId, setKickingUserId] = useState(null);

  // Invite friends modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [topicUsers, setTopicUsers] = useState([]);
  const [topicUsersSearch, setTopicUsersSearch] = useState('');
  const [loadingTopicUsers, setLoadingTopicUsers] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState(null);
  const [invitedSet, setInvitedSet] = useState(new Set());

  const isGroupAdmin = (group && (group.createdBy || group.CreatedBy) === user?.userId) || isSystemAdmin;
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ cho phép chọn file ảnh');
      return;
    }

    try {
      setUploadingAvatar(true);
      await groupService.uploadGroupAvatar(groupId, file);
      toast.success('Cập nhật ảnh đại diện nhóm thành công');
      await fetchGroupData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const groupData = await groupService.getGroupById(groupId);
      setGroup(groupData);

      const membersData = await groupService.getGroupMembers(groupId);
      const memberList = Array.isArray(membersData) ? membersData : (membersData?.$values || []);
      setMembers(memberList);
      setIsMember(memberList.some(m => m.userId === user?.userId));

      const postsData = await groupService.getGroupPosts(groupId);
      const postList = Array.isArray(postsData) ? postsData : (postsData?.$values || []);
      setPosts(postList.map(post => ({
        ...post,
        postId: post.postId || post.id,
        author: post.fullName || 'User',
        authorAvatar: getFullAvatarUrl(post.avatarUrl, post.fullName || 'User'),
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        isLiked: post.isLiked || false,
      })));
    } catch (error) {
      toast.error(t('groups.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await groupService.joinGroup(groupId);
      toast.success(t('groups.joinSuccess'));
      fetchGroupData();
    } catch (error) {
      toast.error(t('groups.joinError'));
    }
  };

  const handleLeave = async () => {
    if (window.confirm(t('groups.leaveConfirm'))) {
      try {
        await groupService.leaveGroup(groupId);
        toast.info(t('groups.leaveSuccess'));
        fetchGroupData();
      } catch (error) {
        toast.error(t('groups.leaveError'));
      }
    }
  };

  const handleKickMember = async (memberId) => {
    if (window.confirm(t('groups.kickConfirm'))) {
      setKickingUserId(memberId);
      try {
        await groupService.removeMember(groupId, memberId);
        toast.success(t('groups.kickSuccess'));
        setMembers(prev => prev.filter(m => m.userId !== memberId));
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || t('groups.kickError'));
      } finally {
        setKickingUserId(null);
      }
    }
  };

  const openInviteModal = async () => {
    setShowInviteModal(true);
    setActiveTab('friends');
    setFriendSearch('');
    setTopicUsersSearch('');
    setLoadingFriends(true);
    setLoadingTopicUsers(true);
    try {
      const res = await friendService.getFriends();
      const list = Array.isArray(res) ? res : (res?.$values || []);
      setFriends(list);
    } catch {
      toast.error(t('groups.inviteLoadError'));
    } finally {
      setLoadingFriends(false);
    }

    try {
      const res = await groupService.getTopicUsers(groupId);
      const list = Array.isArray(res) ? res : (res?.$values || []);
      setTopicUsers(list);
    } catch {
      toast.error("Không thể tải danh sách người cùng sở thích");
    } finally {
      setLoadingTopicUsers(false);
    }
  };

  const handleInviteFriend = async (friendId) => {
    setInvitingUserId(friendId);
    try {
      await groupService.inviteToGroup(groupId, friendId);
      setInvitedSet(prev => new Set([...prev, friendId]));
      toast.success(t('groups.inviteSuccess'));
      // Update local members list to reflect new member
      fetchGroupData();
    } catch (error) {
      const msg = error?.response?.data?.message;
      toast.error(msg || t('groups.inviteError'));
    } finally {
      setInvitingUserId(null);
    }
  };

  // Friends not already in the group
  const memberIds = new Set(members.map(m => m.userId));
  const filteredFriends = friends.filter(f => {
    const notMember = !memberIds.has(f.userId);
    const matchSearch = !friendSearch ||
      (f.fullName || '').toLowerCase().includes(friendSearch.toLowerCase()) ||
      (f.username || '').toLowerCase().includes(friendSearch.toLowerCase());
    return notMember && matchSearch;
  });

  const filteredTopicUsers = topicUsers.filter(u => {
    const notMember = !memberIds.has(u.userId);
    const matchSearch = !topicUsersSearch ||
      (u.category || '').toLowerCase().includes(topicUsersSearch.toLowerCase()) ||
      (u.fullName || '').toLowerCase().includes(topicUsersSearch.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(topicUsersSearch.toLowerCase());
    return notMember && matchSearch;
  });

  const isInviteLoading = activeTab === 'friends' ? loadingFriends : loadingTopicUsers;
  const inviteList = activeTab === 'friends' ? filteredFriends : filteredTopicUsers;
  const rawInviteLength = activeTab === 'friends' ? friends.length : topicUsers.length;
  const noInviteDataMsg = activeTab === 'friends'
    ? (rawInviteLength === 0 ? t('groups.noFriendsToInvite') : t('groups.allFriendsInGroup'))
    : (rawInviteLength === 0 ? t('groups.noTopicUsersToInvite') : 'Tất cả người cùng sở thích đã ở trong nhóm!');

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center h-[calc(100-64px)]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );

  if (!group) return <div>{t('groups.notFound')}</div>;

  return (
    <div className="min-h-screen" style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: 'linear-gradient(135deg, #f0f0ff 0%, #f5f0ff 30%, #fdf4ff 60%, #f0f6ff 100%)',
    }}>
      <Navbar />

      {/* Header Section */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-100 bg-white relative">
          {/* Cover */}
          <div className="h-64 sm:h-80 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 relative">
            {group.coverUrl && <img src={group.coverUrl} alt="" className="w-full h-full object-cover opacity-60" />}
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          
          {/* Info bar */}
          <div className="px-8 pb-8 pt-6 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Avatar block (Absolute positioning) */}
            <div className="absolute -top-16 left-8 w-32 h-32 rounded-[2rem] bg-white p-2 shadow-xl z-10">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div 
                onClick={isGroupAdmin && !uploadingAvatar ? () => avatarInputRef.current?.click() : undefined}
                className={`w-full h-full rounded-[1.5rem] bg-indigo-50 flex items-center justify-center overflow-hidden relative ${isGroupAdmin ? 'cursor-pointer group' : ''}`}
              >
                {group.avatarUrl ? (
                  <img src={getFullAvatarUrl(group.avatarUrl, group.name)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-indigo-400">{group.name[0].toUpperCase()}</span>
                )}

                {/* Upload overlay for group admin */}
                {isGroupAdmin && (
                  <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-all ${uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {uploadingAvatar ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Thay ảnh</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="pl-0 md:pl-36 pt-16 md:pt-0">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{group.name}</h1>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${group.privacy === 'Public' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                {group.privacy === 'Public' ? t('groups.public') : t('groups.private')} • {members.length} {t('groups.members')}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              {isMember ? (
                <>
                  <button 
                    onClick={async () => {
                      try {
                        const conversationId = await groupService.getConversationId(groupId);
                        handleOpenChat({
                          conversationId,
                          isGroup: true,
                          displayName: group.name,
                          displayAvatar: group.avatarUrl,
                          creatorId: group.createdBy || group.CreatedBy,
                          isAdmin: (group.createdBy || group.CreatedBy) === user?.userId
                        });
                      } catch (err) {
                        toast.error(t('groups.chatError'));
                      }
                    }}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {t('groups.discuss')}
                  </button>

                  {/* Invite Friends button */}
                  <button
                    onClick={openInviteModal}
                    className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold rounded-2xl hover:from-violet-600 hover:to-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    {t('groups.inviteFriends')}
                  </button>

                  <button className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">{t('groups.joined')}</button>
                  <button onClick={handleLeave} className="px-6 py-2.5 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all">{t('groups.leave')}</button>
                </>
              ) : (
                <button 
                  onClick={handleJoin}
                  className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                >
                  {t('groups.join')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Content: Feed */}
        <div className="lg:col-span-2 space-y-6">
          {isMember ? (
            <PostCreator 
              user={user} 
              getFullAvatarUrl={getFullAvatarUrl} 
              onPostSuccess={fetchGroupData}
              groupId={groupId}
            />
          ) : (
            <div className="rounded-3xl p-8 text-center" style={glass.card}>
              <p className="text-slate-500 font-medium italic">{t('groups.membersOnly')}</p>
            </div>
          )}

          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard 
                  key={post.postId} 
                  post={post} 
                  user={user} 
                  getFullAvatarUrl={getFullAvatarUrl} 
                  onLikeChange={fetchGroupData}
                  onPostDelete={fetchGroupData}
                />
              ))
            ) : (
              <div className="rounded-3xl p-16 text-center" style={glass.card}>
                <p className="text-slate-400">{t('groups.noPosts')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Content: Sidebar */}
        <div className="space-y-6">
          {/* About Group */}
          <div className="rounded-[2rem] p-6" style={glass.card}>
            <h3 className="font-black text-slate-800 mb-4 uppercase text-xs tracking-widest">{t('groups.about')}</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {group.description || t('groups.defaultDesc')}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{t('groups.createdAt')} {new Date(group.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span>{t('groups.managedBy')} <span className="font-bold text-indigo-500">{group.creator?.fullName || "Admin"}</span></span>
              </div>
            </div>
          </div>

          {/* Members list */}
          <div className="rounded-[2rem] p-6" style={glass.card}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{t('groups.membersTitle')}</h3>
              <span className="text-xs font-bold text-indigo-600">{members.length}</span>
            </div>
            <div className="space-y-3">
              {members.slice(0, 5).map(member => (
                <Link key={member.userId} to={`/profile/${member.userId}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white ring-1 ring-slate-100">
                    <img src={getFullAvatarUrl(member.avatarUrl, member.fullName)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{member.fullName}</p>
                    <p className="text-[10px] text-slate-400">@{member.username}</p>
                  </div>
                </Link>
              ))}
              
              <button 
                onClick={() => setShowMembersModal(true)} 
                className="w-full mt-2 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-600 text-xs font-black uppercase tracking-wider transition-all"
              >
                {isGroupAdmin ? t('groups.manageMembers') : t('groups.viewAllMembers')}
              </button>

              {/* Quick invite from sidebar */}
              {isMember && (
                <button
                  onClick={openInviteModal}
                  className="w-full py-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-600 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  {t('groups.inviteFriends')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Members Management Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowMembersModal(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-slate-800">
                  {isGroupAdmin ? t('groups.manageMembers') : t('groups.membersList')}
                </h2>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="px-6 pt-4">
              <div className="flex items-center bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t('groups.searchMembers')}
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Members List */}
            <div className="p-6 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {(() => {
                const filtered = members.filter(m => 
                  (m.fullName || '').toLowerCase().includes(memberSearch.toLowerCase()) || 
                  (m.username || '').toLowerCase().includes(memberSearch.toLowerCase())
                );
                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-400 text-sm font-semibold">
                      {t('groups.noMembersFound')}
                    </div>
                  );
                }
                return filtered.map((m) => {
                  const isCreator = m.userId === (group.createdBy || group.CreatedBy);
                  const isMe = m.userId === user?.userId;
                  return (
                    <div key={m.userId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white ring-1 ring-slate-100 flex-shrink-0">
                          <img src={getFullAvatarUrl(m.avatarUrl, m.fullName)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm truncate">{m.fullName}</span>
                            {isCreator && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded shadow-sm">{t('groups.owner')}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">@{m.username}</p>
                        </div>
                      </div>

                      {isGroupAdmin && !isMe && !isCreator && (
                        <button
                          onClick={() => handleKickMember(m.userId)}
                          disabled={kickingUserId === m.userId}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                        >
                          {kickingUserId === m.userId ? t('groups.kicking') : t('groups.kick')}
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setShowMembersModal(false)} className="w-full py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-200 text-violet-700 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">{t('groups.inviteFriends')}</h2>
                  <p className="text-xs text-slate-500 font-medium">{group.name}</p>
                </div>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/70 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 py-3 text-sm font-black border-b-2 transition-all duration-200 ${
                  activeTab === 'friends'
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {t('groups.friendsTab')}
              </button>
              <button
                onClick={() => setActiveTab('topicUsers')}
                className={`flex-1 py-3 text-sm font-black border-b-2 transition-all duration-200 ${
                  activeTab === 'topicUsers'
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {t('groups.topicUsersTab')}
              </button>
            </div>

            {/* Search */}
            <div className="px-6 pt-4">
              <div className="flex items-center bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-400 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={activeTab === 'friends' ? t('groups.searchFriends') : t('groups.searchSameTopic')}
                  value={activeTab === 'friends' ? friendSearch : topicUsersSearch}
                  onChange={e => activeTab === 'friends' ? setFriendSearch(e.target.value) : setTopicUsersSearch(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400 font-medium"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="p-6 space-y-2 max-h-[55vh] overflow-y-auto custom-scrollbar">
              {isInviteLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : inviteList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-violet-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm font-semibold">
                    {noInviteDataMsg}
                  </p>
                  <p className="text-slate-300 text-xs mt-1">{t('groups.inviteHint')}</p>
                </div>
              ) : (
                inviteList.map(user => {
                  const alreadyInvited = invitedSet.has(user.userId);
                  const isInviting = invitingUserId === user.userId;
                  return (
                    <div key={user.userId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white ring-2 ring-violet-100 flex-shrink-0">
                          <img src={getFullAvatarUrl(user.avatarUrl, user.fullName)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm truncate">{user.fullName}</span>
                            {user.category && (
                              <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[8px] font-black uppercase rounded shadow-sm">
                                {user.category}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">@{user.username}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => !alreadyInvited && handleInviteFriend(user.userId)}
                        disabled={isInviting || alreadyInvited}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all 
                          ${alreadyInvited
                            ? 'bg-green-50 text-green-600 cursor-default border border-green-200'
                            : 'bg-violet-600 hover:bg-violet-700 text-white hover:scale-105 active:scale-95 shadow-md shadow-violet-200'
                          }
                          ${isInviting ? 'opacity-70 cursor-wait' : ''}
                        `}
                      >
                        {isInviting ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            {t('groups.inviting')}
                          </span>
                        ) : alreadyInvited ? (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            {t('groups.invited')}
                          </span>
                        ) : (
                          t('groups.invite')
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setShowInviteModal(false)} className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
