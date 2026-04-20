import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import messageService from '../../services/messageService';
import userService from '../../services/userService';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import CreateGroupModal from '../../components/Chat/CreateGroupModal';
import GroupSettingsModal from '../../components/Chat/GroupSettingsModal';

const Messaging = () => {
  const { user, getFullAvatarUrl } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const {
    connection, onlineUsers,
    unreadCountsPerUser, setUnreadCountsPerUser, fetchUnreadCount,
    startCall
  } = useChat();
  const [users, setUsers] = useState([]); // Each user: { ...userData, lastMessage, lastMessageTime }
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const imageInputRef = useRef(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const usersRef = useRef([]);

  // Group chat state
  const [activeTab, setActiveTab] = useState('dm'); // 'dm' | 'group'
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [unreadGroupCounts, setUnreadGroupCounts] = useState({}); // { groupId: count }
  const groupsRef = useRef([]);

  // Helper: move a user to top of the list and update their last message preview
  const bubbleUserToTop = (userId, previewText, messageTime) => {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.userId?.toString() === userId?.toString());
      if (idx === -1) return prev;
      const updated = {
        ...prev[idx],
        lastMessage: previewText,
        lastMessageTime: messageTime || new Date().toISOString()
      };
      const rest = prev.filter((_, i) => i !== idx);
      const newList = [updated, ...rest];
      usersRef.current = newList;
      return newList;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [groupMessages]);

  // 1. Lấy danh sách người dùng để chat
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getUsersToChat();
        const res = response?.data || response;
        let rawData = res?.result || res?.Result || res?.$values || (Array.isArray(res) ? res : []);

        let normalizedData = (Array.isArray(rawData) ? rawData : [])
          .filter(u => u && u.userId !== user?.userId)
          .map(u => ({
            ...u,
            displayName: u.fullName || u.FullName || u.userName || u.username || 'Người dùng',
            displayAvatar: getFullAvatarUrl(u.avatarUrl || u.AvatarUrl) || '',
            lastMessage: u.lastMessage || '',
            lastMessageTime: u.lastMessageTime || null
          }))
          .sort((a, b) => {
            // Sort by most recent message first
            if (!a.lastMessageTime && !b.lastMessageTime) return 0;
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
          });

        // Xử lý nếu được điều hướng từ Profile
        if (targetUserId) {
          const existingUser = normalizedData.find(u => u.userId?.toString() === targetUserId);
          if (existingUser) {
            setSelectedUser(existingUser);
          } else {
            // Nếu chưa từng chat, lấy info để hiện tạm
            try {
              const newUser = await userService.getUserById(targetUserId);
              if (newUser) {
                const preparedUser = {
                  ...newUser,
                  displayName: newUser.fullName || newUser.username || 'Người dùng',
                  displayAvatar: getFullAvatarUrl(newUser.avatarUrl) || ''
                };
                normalizedData = [preparedUser, ...normalizedData];
                setSelectedUser(preparedUser);
              }
            } catch (err) {
              console.error("Lỗi lấy thông tin người dùng mục tiêu:", err);
            }
          }
        }

        usersRef.current = normalizedData;
        setUsers(normalizedData);
      } catch (error) {
        console.error("Lỗi lấy danh sách người dùng:", error);
      }
    };
    if (user) fetchUsers();
  }, [user, getFullAvatarUrl, targetUserId]);

  // 1b. Lấy danh sách nhóm
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await messageService.getGroups();
        const data = res?.result?.$values || res?.result || res?.$values || res || [];
        const normalized = (Array.isArray(data) ? data : []).map(g => ({
          ...g,
          conversationId: g.conversationId || g.ConversationId,
          isGroup: true,
          displayName: g.title || g.Title || 'Nhóm không tên',
          displayAvatar: (g.avatarUrl || g.AvatarUrl) ? getFullAvatarUrl(g.avatarUrl || g.AvatarUrl) : null,
          lastMessage: g.lastMessage || g.LastMessage || '',
          lastMessageTime: g.lastMessageTime || g.LastMessageTime || null,
        }));
        groupsRef.current = normalized;
        setGroups(normalized);
        // Set unread counts per group
        const counts = {};
        normalized.forEach(g => { if (g.unreadCount > 0) counts[g.conversationId] = g.unreadCount; });
        setUnreadGroupCounts(counts);
      } catch (e) {
        console.error('Lỗi lấy danh sách nhóm:', e);
      }
    };
    if (user) fetchGroups();
  }, [user]);

  // 2. Lấy lịch sử tin nhắn và báo Seen khi chọn người dùng
  useEffect(() => {
    if (!selectedUser) return;

    const fetchHistory = async () => {
      try {
        const response = await messageService.getMessages(selectedUser.userId);
        const history = response.data || response?.$values || response || [];
        // Chuẩn hóa props
        setMessages(history
          .filter(m => {
            const content = m.messageContent || m.MessageContent || "";
            return !content.startsWith('[RTC_SIGNAL]');
          })
          .map(m => ({
            senderId: m.senderId || m.SenderId,
            messageContent: m.messageContent || m.MessageContent,
            imageUrl: m.imageUrl || m.ImageUrl,
            createdAt: m.createdAt || m.CreatedAt,
            isRead: m.isRead || m.IsRead
          }))
        );

        // Đánh dấu đã xem
        await messageService.markAsRead(selectedUser.userId);
        if (connection && connection.state === 'Connected') {
          connection.invoke("NotifySeen", selectedUser.userId).catch(err => console.error("NotifySeen error:", err));
        }
      } catch (error) {
        console.error("Lỗi lấy lịch sử tin nhắn:", error);
      }
    };
    fetchHistory();
  }, [selectedUser, connection]);

  // 2b. Lấy lịch sử tin nhắn nhóm khi chọn nhóm
  useEffect(() => {
    if (!selectedGroup) return;
    const fetchGroupHistory = async () => {
      try {
        const res = await messageService.getGroupMessages(selectedGroup.conversationId);
        const data = res?.result?.$values || res?.result || res?.$values || res || [];
        setGroupMessages(
          (Array.isArray(data) ? data : []).map(m => ({
            messageId: m.messageId || m.MessageId,
            senderId: m.senderId || m.SenderId,
            senderName: m.senderName || m.SenderName,
            senderAvatar: m.senderAvatar || m.SenderAvatar,
            messageContent: m.messageContent || m.MessageContent,
            imageUrl: m.imageUrl || m.ImageUrl,
            createdAt: m.createdAt || m.CreatedAt,
          }))
        );
        await messageService.markGroupAsRead(selectedGroup.conversationId);
        setUnreadGroupCounts(prev => ({ ...prev, [selectedGroup.conversationId]: 0 }));
      } catch (e) {
        console.error('Lỗi lấy tin nhắn nhóm:', e);
      }
    };
    fetchGroupHistory();
  }, [selectedGroup]);

  // 3. Lắng nghe tin nhắn thời gian thực
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Ref cho selectedGroup để tránh stale closure trong SignalR handler
  const selectedGroupRef = useRef(selectedGroup);
  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    if (!connection) return;

    const handleReceiveMessage = (senderId, content, imageUrl, createdAt) => {
      // Bỏ qua tín hiệu WebRTC
      if (content?.startsWith('[RTC_SIGNAL]')) return;

      const sId = senderId?.toString() || "";
      const currentSelectedId = selectedUserRef.current?.userId?.toString() || "";
      const myId = user?.userId?.toString() || "";
      const msgTime = createdAt || new Date().toISOString();

      const isFromMe = sId === myId;
      const isFromSelectedUser = sId === currentSelectedId;

      const previewText = imageUrl
        ? (t('messaging.image') || 'Ảnh')
        : (content?.substring(0, 35) || '');

      if (isFromMe || isFromSelectedUser) {
        const newMsg = { 
            senderId, 
            messageContent: content, 
            imageUrl: imageUrl, 
            createdAt: msgTime, 
            isRead: false 
        };
        setMessages(prev => [...prev, newMsg]);

        // Đẩy người đang chat lên đầu danh sách
        bubbleUserToTop(isFromMe ? currentSelectedId : sId, previewText, msgTime);

        // Tự động báo Seen
        if (isFromSelectedUser) {
          messageService.markAsRead(currentSelectedId).catch(() => { });
          connection.invoke("NotifySeen", currentSelectedId).catch(() => { });
          // Reset unread count local
          setUnreadCountsPerUser(prev => ({ ...prev, [senderId]: 0 }));
          fetchUnreadCount();
        }
      } else {
        toast.info(t('messaging.newMessageFrom', { name: sender?.displayName || '...' }) + `: ${previewText}...`, {
          onClick: () => {
            const targetUser = usersRef.current.find(u => u.userId?.toString() === sId);
            if (targetUser) setSelectedUser(targetUser);
          }
        });
      }
    };

    const handleUserTyping = (senderId, isTyping) => {
      if (selectedUserRef.current && senderId?.toString() === selectedUserRef.current.userId?.toString()) {
        setIsOtherTyping(isTyping);
      }
    };

    const handleMessageSeen = (viewerId) => {
      if (selectedUserRef.current && viewerId?.toString() === selectedUserRef.current.userId?.toString()) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    };

    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("UserTyping", handleUserTyping);
    connection.on("MessageSeen", handleMessageSeen);

    // Group message listener
    const handleReceiveGroupMessage = (messageId, groupId, senderId, senderName, senderAvatar, content, imageUrl, createdAt) => {
      const gId = groupId?.toString();
      const myId = user?.userId?.toString();
      const mId = messageId?.toString();

      const previewText = imageUrl ? 'Ảnh' : (content?.substring(0, 35) || '');
      const msgTime = createdAt || new Date().toISOString();

      // Update groups list: bubble to top
      setGroups(prev => {
        const idx = prev.findIndex(g => {
          const cid = g.conversationId || g.ConversationId;
          return cid?.toString().toLowerCase() === gId.toLowerCase();
        });
        if (idx === -1) return prev;
        const updated = { ...prev[idx], lastMessage: previewText, lastMessageTime: msgTime };
        const rest = prev.filter((_, i) => i !== idx);
        const newList = [updated, ...rest];
        groupsRef.current = newList;
        return newList;
      });

      // If this group is currently open, append message
      const currentGroupId = (selectedGroupRef.current?.conversationId || selectedGroupRef.current?.ConversationId)?.toString();
      if (gId.toLowerCase() === currentGroupId?.toLowerCase()) {
        setGroupMessages(prev => {
          // Tránh trùng lặp tin nhắn (do nhận từ cả Group broadcast và Caller callback)
          if (prev.some(m => m.messageId?.toString() === mId)) return prev;

          return [...prev, {
            messageId: mId,
            senderId,
            senderName,
            senderAvatar,
            messageContent: content,
            imageUrl,
            createdAt: msgTime,
          }];
        });
        // Mark as read immediately
        messageService.markGroupAsRead(groupId).catch(() => {});
      } else if (senderId?.toString() !== myId) {
        setUnreadGroupCounts(prev => ({ ...prev, [gId]: (prev[gId] || 0) + 1 }));
        toast.info(`${grp?.displayName || 'Nhóm'}: ${previewText}`, {
          onClick: () => {
            const targetGrp = groupsRef.current.find(g => g.conversationId?.toString() === gId);
            if (targetGrp) { setSelectedGroup(targetGrp); setSelectedUser(null); setActiveTab('group'); }
          }
        });
      }
    };
    connection.on('ReceiveGroupMessage', handleReceiveGroupMessage);

    // Lắng nghe sự kiện nhóm mới được tạo
    const handleNewGroupCreated = (groupInfo) => {
      const gId = groupInfo.conversationId || groupInfo.ConversationId;
      if (!gId) return;

      // Join SignalR group ngay lập tức để nhận tin nhắn
      connection.invoke('JoinGroup', gId).catch(() => {});

      // Cập nhật danh sách nhóm
      const normalized = {
        conversationId: gId,
        title: groupInfo.title || groupInfo.Title,
        isGroup: true,
        displayName: groupInfo.title || groupInfo.Title || 'Nhóm mới',
        displayAvatar: null,
        lastMessage: '',
        lastMessageTime: groupInfo.createdAt || groupInfo.CreatedAt || new Date().toISOString(),
        memberCount: groupInfo.memberCount || groupInfo.MemberCount || 0
      };

      setGroups(prev => {
        if (prev.some(g => g.conversationId?.toString() === gId.toString())) return prev;
        const newList = [normalized, ...prev];
        groupsRef.current = newList;
        return newList;
      });

      toast.info(`Bạn vừa được thêm vào nhóm mới: ${normalized.displayName}`);
    };
    connection.on('OnNewGroupCreated', handleNewGroupCreated);

    return () => {
      connection.off("ReceiveMessage");
      connection.off("UserTyping");
      connection.off("MessageSeen");
      connection.off('ReceiveGroupMessage');
      connection.off('OnNewGroupCreated');
    };
  }, [connection, user, users]);

  // Send group message
  const handleSendGroupMessage = async (e) => {
    e.preventDefault();
    if (!connection || connection.state !== 'Connected') {
      toast.error(t('messaging.connectionError'));
      return;
    }
    if (!inputText.trim() || !selectedGroup) return;
    const gId = selectedGroup.conversationId || selectedGroup.ConversationId;
    if (!gId) return;

    const sentText = inputText.trim();
    try {
      await connection.invoke('SendGroupMessage', gId, sentText, null);
      setInputText('');
    } catch (err) {
      console.error('Group send error:', err);
      toast.error(t('messaging.sendError'));
    }
  };

  const handleGroupCreated = (newGroup, memberIds) => {
    const gId = newGroup.conversationId || newGroup.ConversationId;
    const normalized = {
      ...newGroup,
      conversationId: gId,
      isGroup: true,
      displayName: newGroup.title || newGroup.Title || 'Nhóm mới',
      displayAvatar: null,
      lastMessage: '',
      lastMessageTime: newGroup.createdAt || newGroup.CreatedAt || new Date().toISOString(),
    };
    groupsRef.current = [normalized, ...groupsRef.current];
    setGroups(prev => [normalized, ...prev]);
    setSelectedGroup(normalized);
    setSelectedUser(null);
    setActiveTab('group');
    // Join SignalR group cho nhóm mới tạo
    if (connection && connection.state === 'Connected' && gId) {
      connection.invoke('JoinGroup', gId).catch(err => console.error('JoinGroup error:', err));
      
      // Thông báo cho các thành viên khác
      if (memberIds && memberIds.length > 0) {
        connection.invoke('NotifyNewGroup', gId, memberIds, normalized.displayName).catch(err => console.error('NotifyNewGroup error:', err));
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!connection || connection.state !== 'Connected') {
      toast.error(t('messaging.connectionError'));
      return;
    }

    if (inputText.trim() && selectedUser) {
      const sentText = inputText.trim();
      try {
        await connection.invoke("SendPrivateMessage", selectedUser.userId, sentText, null);
        setInputText("");
        connection.invoke("SendTypingStatus", selectedUser.userId, false).catch(() => { });
        // Đẩy người nhận lên đầu ngay sau khi gửi
        bubbleUserToTop(selectedUser.userId, sentText, new Date().toISOString());
      } catch (error) {
        console.error("Send error:", error);
        toast.error(t('messaging.sendError'));
      }
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('messaging.imageOnlyError'));
      return;
    }

    setIsUploading(true);
    try {
      const response = await messageService.uploadImage(file);
      const imageUrlInput = typeof response === 'string' ? response : (response?.imageUrl || response?.url || response?.imagePath || response?.result);

      if (imageUrlInput) {
        // Gửi qua SignalR với 3 tham số (targetId, content, imageUrl)
        // Gửi đường dẫn tương đối, client sẽ tự thêm domain qua getFullAvatarUrl
        await connection.invoke("SendPrivateMessage", selectedUser.userId, "", imageUrlInput);
      } else {
        throw new Error("Không lấy được URL ảnh");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t('messaging.uploadError'));
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (connection && connection.state === 'Connected' && selectedUser) {
      connection.invoke("SendTypingStatus", selectedUser.userId, true).catch(() => { });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (connection.state === 'Connected') {
          connection.invoke("SendTypingStatus", selectedUser.userId, false).catch(() => { });
        }
      }, 2500);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedGroup) handleSendGroupMessage(e);
      else handleSendMessage(e);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#fcfcfd] overflow-hidden">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 pb-24 sm:p-6 min-h-0">
        <div className="h-full bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden flex">

          {/* Sidebar */}
          <div className={`${(selectedUser || selectedGroup) ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-slate-50 flex-col h-full`}>
            {/* Header with Tabs */}
            <div className="p-4 lg:p-6 border-b border-slate-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl lg:text-2xl font-black text-slate-800">{t('messaging.title')}</h2>
                {activeTab === 'group' && (
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all font-bold text-sm"
                    title="Tạo nhóm mới"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Tabs */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setActiveTab('dm')}
                  className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === 'dm' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Đoạn chat
                </button>
                <button
                  onClick={() => setActiveTab('group')}
                  className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all relative ${
                    activeTab === 'group' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Nhóm
                  {Object.values(unreadGroupCounts).some(c => c > 0) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                      {Object.values(unreadGroupCounts).reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 custom-scrollbar">
              {activeTab === 'dm' ? (
                <>
                  {users.map(u => (
                    <div
                      key={u.userId}
                      onClick={() => { setSelectedUser(u); setSelectedGroup(null); setUnreadCountsPerUser(prev => ({ ...prev, [u.userId]: 0 })); fetchUnreadCount(); }}
                      className={`flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-[1.2rem] lg:rounded-[1.5rem] cursor-pointer transition-all ${selectedUser?.userId === u.userId ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/50">
                        <img src={u.displayAvatar} alt="" className="w-full h-full object-cover" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}`} />
                        {onlineUsers.has(u.userId) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 truncate text-sm lg:text-base">{u.displayName}</div>
                          {u.lastMessage ? (
                            <div className={`text-[11px] truncate mt-0.5 font-medium ${unreadCountsPerUser[u.userId] > 0 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>{u.lastMessage}</div>
                          ) : (
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {onlineUsers.has(u.userId) ? <span className="text-emerald-500">{t('messaging.activeNow')}</span> : <span>{t('messaging.offline')}</span>}
                            </div>
                          )}
                        </div>
                        {unreadCountsPerUser[u.userId] > 0 && (
                          <div className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-red-100 flex-shrink-0">
                            {unreadCountsPerUser[u.userId] > 9 ? '9+' : unreadCountsPerUser[u.userId]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <div className="text-center py-10 text-slate-300 text-xs font-bold uppercase tracking-widest">{t('messaging.noFriends')}</div>}
                </>
              ) : (
                <>
                  {groups.map(g => (
                    <div
                      key={g.conversationId}
                      onClick={() => {
                        setSelectedGroup(g);
                        setSelectedUser(null);
                        setUnreadGroupCounts(prev => ({ ...prev, [g.conversationId]: 0 }));
                        // Ensure joined to SignalR group
                        if (connection && connection.state === 'Connected') {
                          connection.invoke('JoinGroup', g.conversationId).catch(() => {});
                        }
                      }}
                      className={`flex items-center gap-3 p-3 lg:p-4 rounded-[1.2rem] lg:rounded-[1.5rem] cursor-pointer transition-all ${selectedGroup?.conversationId === g.conversationId ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-black text-lg shadow-sm">
                        {g.displayAvatar ? (
                          <img src={g.displayAvatar} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 truncate text-sm lg:text-base">{g.displayName}</div>
                          {g.lastMessage ? (
                            <div className={`text-[11px] truncate mt-0.5 font-medium ${unreadGroupCounts[g.conversationId] > 0 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>{g.lastMessage}</div>
                          ) : (
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{g.memberCount} thành viên</div>
                          )}
                        </div>
                        {unreadGroupCounts[g.conversationId] > 0 && (
                          <div className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg flex-shrink-0">
                            {unreadGroupCounts[g.conversationId] > 9 ? '9+' : unreadGroupCounts[g.conversationId]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {groups.length === 0 && (
                    <div className="text-center py-10 text-slate-300">
                      <div className="flex justify-center mb-3">
                        <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="text-xs font-bold uppercase tracking-widest">Chưa có nhóm nào</div>
                      <button onClick={() => setShowCreateGroup(true)} className="mt-3 text-indigo-500 text-xs font-black hover:underline">+ Tạo nhóm mới</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className={`${(selectedUser || selectedGroup) ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col h-full bg-slate-50/20 min-w-0`}>
            {selectedUser ? (
              <>
                {/* DM Chat Header */}
                <div className="p-4 lg:p-6 bg-white border-b border-slate-50 flex items-center gap-4 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/50">
                    <img src={selectedUser.displayAvatar} alt="" className="w-full h-full object-cover" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.displayName)}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{selectedUser.displayName}</h3>
                    {isOtherTyping ? (
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest animate-pulse">{t('messaging.typing')}</p>
                    ) : (
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                        {onlineUsers.has(selectedUser.userId) ? t('messaging.online') : t('messaging.offline')}
                      </p>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-2 sm:gap-4">
                    <button onClick={() => startCall(selectedUser, 'audio')} className="p-2 sm:p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    </button>
                    <button onClick={() => startCall(selectedUser, 'video')} className="p-2 sm:p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                    <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 text-slate-400 hover:text-indigo-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                </div>
                {/* DM Messages */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-6 custom-scrollbar min-h-0">
                  {messages.map((m, i) => {
                    const isMe = m.senderId?.toString() === user?.userId?.toString();
                    const imgUrl = m.imageUrl ? getFullAvatarUrl(m.imageUrl) : (m.messageContent?.startsWith('[IMAGE]') ? m.messageContent.replace('[IMAGE]', '') : null);
                    return (
                      <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] p-3 lg:p-4 rounded-[1.2rem] lg:rounded-[1.5rem] text-[13px] lg:text-sm font-medium shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                          {imgUrl ? <img src={imgUrl} alt="sent" className="max-w-full sm:max-w-[400px] rounded-2xl cursor-pointer hover:opacity-95 transition-all shadow-lg border-2 border-white/20" onClick={() => setEnlargedImage(imgUrl)} /> : <p className="whitespace-pre-wrap break-words leading-relaxed">{m.messageContent}</p>}
                          <div className={`text-[8px] lg:text-[9px] mt-2 font-bold uppercase tracking-tighter opacity-60 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {(() => { const ds = m.createdAt || m.CreatedAt; if (!ds) return ''; const us = ds.endsWith('Z') || ds.includes('+') ? ds : `${ds}Z`; return new Date(us).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); })()}
                            {isMe && m.isRead && <span className="text-indigo-200 ml-1 font-black">· SEEN</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isOtherTyping && <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300"><div className="bg-white border border-slate-100 p-3 rounded-[1.2rem] rounded-tl-none shadow-sm flex items-center gap-1.5"><div className="flex gap-1"><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" /><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" /><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" /></div><span className="text-[10px] font-bold text-slate-400 tracking-tight ml-1 uppercase">{selectedUser.displayName.split(' ')[0]} {t('messaging.isTyping')}</span></div></div>}
                  <div ref={messagesEndRef} className="h-2" />
                </div>
                {/* DM Input */}
                <div className="p-4 lg:p-6 bg-white border-t border-slate-50 flex-shrink-0">
                  <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                  <form onSubmit={handleSendMessage} className="flex gap-2 lg:gap-3 items-center relative">
                    <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isUploading} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      {isUploading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                    </button>
                    <div className="flex-1 relative">
                      <input type="text" value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown} maxLength={500}
                        placeholder={t('messaging.messagePlaceholder', { name: selectedUser.displayName.split(' ')[0] })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl lg:rounded-2xl px-4 lg:px-5 pr-14 lg:pr-16 py-2.5 lg:py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-sm" />
                      <div className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300 pointer-events-none">{inputText.length}/500</div>
                    </div>
                    <button type="submit" disabled={!inputText.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 lg:px-7 py-2.5 lg:py-3 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95">{t('messaging.send')}</button>
                  </form>
                </div>
              </>
            ) : selectedGroup ? (
              <>
                {/* Group Chat Header */}
                <div className="p-4 lg:p-6 bg-white border-b border-slate-50 flex items-center gap-4 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-sm">
                    {selectedGroup.displayAvatar ? (
                      <img src={selectedGroup.displayAvatar} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{selectedGroup.displayName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedGroup.memberCount || ''} thành viên</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button 
                      onClick={() => setShowGroupSettings(true)}
                      className="p-2 sm:p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Cài đặt nhóm"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button onClick={() => setSelectedGroup(null)} className="md:hidden p-2 text-slate-400 hover:text-indigo-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                {/* Group Messages */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 custom-scrollbar min-h-0">
                  {groupMessages.map((m, i) => {
                    const isMe = m.senderId?.toString() === user?.userId?.toString();
                    const imgUrl = m.imageUrl ? getFullAvatarUrl(m.imageUrl) : null;
                    return (
                      <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}>
                        <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[85%] sm:max-w-[70%]`}>
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                              <img src={m.senderAvatar ? getFullAvatarUrl(m.senderAvatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.senderName || '?')}&size=28`} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            {!isMe && <span className="text-[10px] font-black text-indigo-500 mb-1 ml-1">{m.senderName}</span>}
                            <div className={`p-3 lg:p-4 rounded-[1.2rem] lg:rounded-[1.5rem] text-[13px] lg:text-sm font-medium shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                              {imgUrl ? <img src={imgUrl} alt="sent" className="max-w-full sm:max-w-[300px] rounded-2xl cursor-pointer hover:opacity-95 shadow-lg" onClick={() => setEnlargedImage(imgUrl)} /> : <p className="whitespace-pre-wrap break-words leading-relaxed">{m.messageContent}</p>}
                              <div className={`text-[8px] mt-2 font-bold uppercase tracking-tighter opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                                {(() => { const ds = m.createdAt; if (!ds) return ''; const us = ds.endsWith('Z') || ds.includes('+') ? ds : `${ds}Z`; return new Date(us).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-2" />
                </div>
                {/* Group Input */}
                <div className="p-4 lg:p-6 bg-white border-t border-slate-50 flex-shrink-0">
                  <form onSubmit={handleSendGroupMessage} className="flex gap-2 lg:gap-3 items-center">
                    <div className="flex-1 relative">
                      <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} maxLength={500}
                        placeholder={`Nhắn tin vào ${selectedGroup.displayName}...`}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl lg:rounded-2xl px-4 lg:px-5 pr-14 lg:pr-16 py-2.5 lg:py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-sm" />
                      <div className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300 pointer-events-none">{inputText.length}/500</div>
                    </div>
                    <button type="submit" disabled={!inputText.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 lg:px-7 py-2.5 lg:py-3 rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95">{t('messaging.send')}</button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 text-center bg-white/50">
                <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                  <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                </div>
                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-2">{t('messaging.selectContact')}</h3>
                <p className="text-xs font-bold text-slate-300 max-w-[200px]">{t('messaging.selectContactDesc')}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={handleGroupCreated}
          getFullAvatarUrl={getFullAvatarUrl}
        />
      )}

      {/* Group Settings Modal */}
      {showGroupSettings && selectedGroup && (
        <GroupSettingsModal
          group={selectedGroup}
          onClose={() => setShowGroupSettings(false)}
          getFullAvatarUrl={getFullAvatarUrl}
          onGroupUpdated={(updatedGroup) => {
            setSelectedGroup(updatedGroup);
            setGroups(prev => prev.map(g => 
              (g.conversationId || g.ConversationId) === (updatedGroup.conversationId || updatedGroup.ConversationId) 
              ? updatedGroup 
              : g
            ));
          }}
        />
      )}

      {/* Image Preview Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300"
          onClick={() => setEnlargedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 group"
            onClick={(e) => { e.stopPropagation(); setEnlargedImage(null); }}
          >
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <div className="relative max-w-full max-h-full flex items-center justify-center animate-in zoom-in-95 duration-300 shadow-2xl">
            <img 
              src={enlargedImage} 
              alt="enlarged" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border-4 border-white/10 shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
        </div>
      )}
    </div>
  );
};

export default Messaging;