import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import messageService from '../../services/messageService';
import userService from '../../services/userService';
import GroupSettingsModal from './GroupSettingsModal';

/* ─── Mini Chat Bubble Window ─────────────────────────────── */
const ChatWindow = ({ chatUser, onClose, connection, getFullAvatarUrl, currentUser, onlineUsers }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const typingRef = useRef(null);
  const selectedUserRef = useRef(chatUser);

  const isGroup = chatUser.isGroup || false;
  const conversationId = chatUser.conversationId || chatUser.userId;

  const { startCall } = useChat();

  const getActiveConversationId = () => {
    if (isGroup) return conversationId;
    if (chatUser.conversationId) return chatUser.conversationId;
    if (chatUser.ConversationId) return chatUser.ConversationId;
    if (messages && messages.length > 0) {
      const found = messages.find(m => m.conversationId || m.ConversationId);
      if (found) return found.conversationId || found.ConversationId;
    }
    return null;
  };

  const handleDeleteChat = async () => {
    const activeConvId = getActiveConversationId();
    if (!activeConvId) {
      alert('Không có lịch sử trò chuyện để xóa!');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này từ phía bạn không? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      await messageService.deleteConversation(activeConvId);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Xóa cuộc trò chuyện thất bại!');
    }
  };

  useEffect(() => { selectedUserRef.current = chatUser; }, [chatUser]);

  // Fetch message history
  useEffect(() => {
    const load = async () => {
      try {
        let history = [];
        if (isGroup) {
          const res = await messageService.getGroupMessages(conversationId);
          history = res.data || res?.$values || res || [];
        } else {
          const res = await messageService.getMessages(chatUser.userId);
          history = res.data || res?.$values || res || [];
          await messageService.markAsRead(chatUser.userId);
        }
        
        setMessages(
          history
            .filter(m => {
              const c = m.messageContent || m.MessageContent || '';
              return !c.startsWith('[RTC_SIGNAL]');
            })
            .map(m => ({
              messageId: m.messageId || m.MessageId,
              senderId: m.senderId || m.SenderId,
              senderName: m.senderName || m.SenderName || (m.sender?.fullName),
              senderAvatar: m.senderAvatar || m.SenderAvatar || (m.sender?.avatarUrl),
              messageContent: m.messageContent || m.MessageContent,
              imageUrl: m.imageUrl || m.ImageUrl,
              createdAt: m.createdAt || m.CreatedAt,
              isRead: m.isRead || m.IsRead,
              conversationId: m.conversationId || m.ConversationId
            }))
        );
      } catch (e) { console.error(e); }
    };
    load();
  }, [conversationId, isGroup]);

  // SignalR listeners
  useEffect(() => {
    if (!connection) return;

    if (isGroup && connection?.state === 'Connected') {
      connection.invoke('JoinGroup', conversationId).catch(err => console.error("Error joining SignalR group:", err));
    }

    const handlePrivateMsg = (senderId, content, imageUrl, createdAt) => {
      if (isGroup) return; // Ignore private messages in group window
      if (content?.startsWith('[RTC_SIGNAL]')) return;
      
      const sId = senderId?.toString();
      const myId = currentUser?.userId?.toString();
      const targetId = isGroup ? null : selectedUserRef.current?.userId?.toString();
      
      if (sId === myId || (targetId && sId === targetId)) {
        setMessages(prev => [...prev, {
          senderId, messageContent: content, imageUrl,
          createdAt: createdAt || new Date().toISOString(), isRead: false,
        }]);
        if (sId === targetId) messageService.markAsRead(targetId).catch(() => {});
      }
    };

    const handleGroupMsg = (messageId, groupId, senderId, senderName, senderAvatar, content, imageUrl, createdAt) => {
      if (!isGroup || groupId !== conversationId) return;

      setMessages(prev => {
        // Tránh tin nhắn trùng lặp (vì SignalR gửi cho cả Caller và Group)
        if (prev.some(m => m.messageId === messageId)) return prev;
        
        return [...prev, {
          messageId,
          senderId,
          senderName,
          senderAvatar,
          messageContent: content,
          imageUrl,
          createdAt: createdAt || new Date().toISOString(),
          isRead: true
        }];
      });
    };

    const chatId = isGroup ? `group_${conversationId}` : chatUser.userId?.toString();

    const handleTyping = (sid, isTyping) => {
      const currentTargetId = isGroup ? null : selectedUserRef.current?.userId?.toString();
      if (!isGroup && sid?.toString() === currentTargetId) {
        setIsOtherTyping(isTyping);
      }
    };

    connection.on('ReceiveMessage', handlePrivateMsg);
    connection.on('ReceiveGroupMessage', handleGroupMsg);
    connection.on('UserTyping', handleTyping);

    return () => {
      connection.off('ReceiveMessage', handlePrivateMsg);
      connection.off('ReceiveGroupMessage', handleGroupMsg);
      connection.off('UserTyping', handleTyping);
    };
  }, [connection, currentUser, isGroup, conversationId]);

  useEffect(() => {
    if (!isMinimized) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMinimized]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !connection || connection.state !== 'Connected') return;
    try {
      if (isGroup) {
        await connection.invoke('SendGroupMessage', conversationId, inputText.trim(), null);
      } else {
        await connection.invoke('SendPrivateMessage', chatUser.userId, inputText.trim(), null);
        connection.invoke('SendTypingStatus', chatUser.userId, false).catch(() => {});
      }
      setInputText('');
    } catch (err) { console.error(err); }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!isGroup && connection?.state === 'Connected') {
      connection.invoke('SendTypingStatus', chatUser.userId, true).catch(() => {});
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => {
        connection.invoke('SendTypingStatus', chatUser.userId, false).catch(() => {});
      }, 2000);
    }
  };

  const isOnline = !isGroup && onlineUsers?.has(chatUser.userId);

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-200/60"
      style={{
        width: 320,
        height: isMinimized ? 'auto' : 440,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: '#fff',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none"
        style={{ background: isGroup ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="relative w-8 h-8 flex-shrink-0">
          <img
            src={chatUser.displayAvatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chatUser.displayName)}&background=${isGroup ? '4f46e5' : '6366f1'}&color=fff`; }}
          />
          {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{chatUser.displayName}</p>
          <p className="text-white/60 text-[10px] font-medium">
            {isGroup ? 'Thảo luận nhóm' : isOtherTyping ? 'đang gõ...' : isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {isGroup && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-all mr-0.5"
                title="Cài đặt nhóm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteChat(); }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-all mr-0.5"
                title="Rời nhóm & Xóa cuộc trò chuyện"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
          {!isGroup && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); startCall(chatUser, 'audio'); }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-all"
                title="Gọi thoại"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); startCall(chatUser, 'video'); }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-all"
                title="Gọi video"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteChat(); }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-all"
                title="Xóa cuộc trò chuyện"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-all"
          >
            {isMinimized ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50/50" style={{ scrollbarWidth: 'thin' }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-xs font-medium">Bắt đầu cuộc trò chuyện!</p>
              </div>
            )}
            {messages.map((m, i) => {
              const isMe = m.senderId?.toString() === currentUser?.userId?.toString();
              const imgUrl = m.imageUrl
                ? getFullAvatarUrl(m.imageUrl)
                : m.messageContent?.startsWith('[IMAGE]') ? m.messageContent.replace('[IMAGE]', '') : null;
              
              return (
                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {isGroup && !isMe && (
                    <span className="text-[9px] font-bold text-slate-400 mb-0.5 ml-1">{m.senderName}</span>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[12px] font-medium shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                  }`}>
                    {imgUrl ? (
                      <img src={imgUrl} alt="sent" className="max-w-full rounded-xl" />
                    ) : (
                      <p className="leading-relaxed break-words whitespace-pre-wrap">{m.messageContent}</p>
                    )}
                    <p className={`text-[9px] mt-1 opacity-50 font-semibold ${isMe ? 'text-right' : 'text-left'}`}>
                      {m.createdAt ? new Date(m.createdAt.endsWith('Z') ? m.createdAt : `${m.createdAt}Z`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
            {isOtherTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 px-3 py-2 rounded-2xl rounded-tl-sm flex gap-1 items-center shadow-sm">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-slate-100">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Nhắn tin..."
              maxLength={500}
              className="flex-1 bg-slate-100 rounded-full px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-200 text-slate-700 placeholder:text-slate-400 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </>
      )}

      {showSettings && (
        <GroupSettingsModal
          group={{
            conversationId,
            displayName: chatUser.displayName,
            displayAvatar: chatUser.displayAvatar,
            creatorId: chatUser.creatorId,
            CreatorId: chatUser.CreatorId,
            isAdmin: chatUser.isAdmin
          }}
          onClose={() => setShowSettings(false)}
          getFullAvatarUrl={getFullAvatarUrl}
          onGroupUpdated={(updatedGroup) => {
            chatUser.displayName = updatedGroup.displayName;
            chatUser.displayAvatar = updatedGroup.displayAvatar;
            chatUser.avatarUrl = updatedGroup.avatarUrl;
          }}
        />
      )}
    </div>
  );
};

/* ─── Chat Bubble Manager (renders all open chat windows) ─── */
const ChatBubbleManager = ({ openChats, onClose, connection, getFullAvatarUrl, currentUser, onlineUsers }) => {
  if (openChats.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[3000] flex flex-row-reverse items-start gap-3 flex-wrap-reverse max-w-[calc(100vw-2rem)]">
      {openChats.map((chatUser) => (
        <ChatWindow
          key={chatUser.isGroup ? `group_${chatUser.conversationId}` : chatUser.userId}
          chatUser={chatUser}
          onClose={() => onClose(chatUser.isGroup ? `group_${chatUser.conversationId}` : chatUser.userId)}
          connection={connection}
          getFullAvatarUrl={getFullAvatarUrl}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
        />
      ))}
    </div>
  );
};

/* ─── Messenger Dropdown in Navbar ───────────────────────── */
const MessengerDropdown = ({ onOpenChat, getFullAvatarUrl, onlineUsers, unreadCountsPerUser }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { unreadMessageCount } = useChat();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, groupsRes] = await Promise.all([
          userService.getUsersToChat(),
          messageService.getGroups()
        ]);
        
        const rawUsers = usersRes?.data || usersRes;
        let userData = rawUsers?.result || rawUsers?.Result || rawUsers?.$values || (Array.isArray(rawUsers) ? rawUsers : []);
        userData = userData.filter(u => u && u.userId !== user?.userId).map(u => ({
          ...u,
          displayName: u.fullName || u.FullName || u.username || 'Người dùng',
          displayAvatar: getFullAvatarUrl(u.avatarUrl || u.AvatarUrl) || '',
          isGroup: false,
          conversationId: u.conversationId || u.ConversationId || null,
          lastMessageTime: u.lastMessageTime || u.LastMessageTime || null
        }));

        const rawGroups = groupsRes?.data || groupsRes?.$values || groupsRes || [];
        let groupData = rawGroups?.result?.$values || rawGroups?.result || rawGroups?.$values || (Array.isArray(rawGroups) ? rawGroups : []);
        groupData = groupData.map(g => ({
          ...g,
          userId: g.conversationId || g.ConversationId, 
          displayName: g.title || g.Title || 'Nhóm không tên',
          displayAvatar: (g.avatarUrl || g.AvatarUrl) ? getFullAvatarUrl(g.avatarUrl || g.AvatarUrl) : null,
          isGroup: true,
          conversationId: g.conversationId || g.ConversationId,
          creatorId: g.creatorId || g.CreatorId,
          isAdmin: g.isAdmin || g.IsAdmin || g.creatorId === user?.userId,
          lastMessageTime: g.lastMessageTime || g.LastMessageTime || null
        }));

        setUsers(userData);
        setGroups(groupData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Messenger icon button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-all group"
      >
        <svg className="h-6 w-6 text-gray-700 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadMessageCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full text-white text-[9px] sm:text-xs font-bold flex items-center justify-center">
            {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
          </span>
        )}
      </button>

      {/* Dropdown — always rendered with CSS transitions to prevent backdrop-filter jitter */}
      <div
        className="absolute right-0 top-full mt-3 bg-white rounded-[1.5rem] shadow-[0_25px_70px_-15px_rgba(99,102,241,0.35),0_10px_30px_-5px_rgba(0,0,0,0.12)] border border-slate-100 z-50 overflow-hidden"
        style={{
          width: 340,
          maxHeight: 520,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          backgroundColor: '#ffffff',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
          willChange: 'transform, opacity',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Tin nhắn</h3>
          <button
            onClick={() => { setIsOpen(false); navigate('/messaging'); }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-full"
          >
            Xem tất cả
          </button>
        </div>

        {/* User list */}
        <div className="overflow-y-auto px-1" style={{ maxHeight: 380, scrollbarWidth: 'thin' }}>
          {loading ? (
            <div className="flex flex-col gap-3 p-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded-full w-32" />
                    <div className="h-3 bg-slate-50 rounded-full w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (users.length === 0 && groups.length === 0) ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="text-slate-400 text-sm font-semibold">Chưa có hội thoại nào</p>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {(() => {
                const combinedChats = [...groups, ...users].sort((a, b) => {
                  const timeA = a.lastMessageTime || a.LastMessageTime;
                  const timeB = b.lastMessageTime || b.LastMessageTime;
                  if (!timeA && !timeB) return 0;
                  if (!timeA) return 1;
                  if (!timeB) return -1;
                  return new Date(timeB) - new Date(timeA);
                });

                return combinedChats.map(item => {
                  if (item.isGroup) {
                    return (
                      <button
                        key={`group_${item.conversationId}`}
                        onClick={() => { onOpenChat(item); setIsOpen(false); }}
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-indigo-50/50 transition-all text-left group relative"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white overflow-hidden shadow-md ring-2 ring-white">
                            <img
                              src={item.displayAvatar}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName)}&background=4f46e5&color=fff`; }}
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                            <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {item.displayName}
                          </p>
                          <p className="text-[10px] font-bold text-indigo-500/70 uppercase tracking-wider">Thảo luận nhóm</p>
                        </div>
                      </button>
                    );
                  } else {
                    const isOnline = onlineUsers?.has(item.userId);
                    const unread = unreadCountsPerUser?.[item.userId] || 0;
                    return (
                      <button
                        key={item.userId}
                        onClick={() => { onOpenChat(item); setIsOpen(false); }}
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all text-left group relative"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={item.displayAvatar}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName)}&background=6366f1&color=fff`; }}
                          />
                          {isOnline && (
                            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-white shadow-sm" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {item.displayName}
                          </p>
                          <p className={`text-xs font-medium truncate ${isOnline ? 'text-indigo-500/80' : 'text-slate-400'}`}>
                            {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                          </p>
                        </div>
                        {unread > 0 && (
                          <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </button>
                    );
                  }
                });
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50/50 border-t border-slate-50/50">
          <button
            onClick={() => { setIsOpen(false); navigate('/messaging'); }}
            className="w-full py-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 text-slate-600 hover:text-indigo-600 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            Mở trang nhắn tin
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export { ChatBubbleManager, MessengerDropdown };
