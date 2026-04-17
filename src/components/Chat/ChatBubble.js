import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import messageService from '../../services/messageService';
import userService from '../../services/userService';

/* ─── Mini Chat Bubble Window ─────────────────────────────── */
const ChatWindow = ({ chatUser, onClose, connection, getFullAvatarUrl, currentUser, onlineUsers }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const typingRef = useRef(null);
  const selectedUserRef = useRef(chatUser);

  useEffect(() => { selectedUserRef.current = chatUser; }, [chatUser]);

  // Fetch message history
  useEffect(() => {
    const load = async () => {
      try {
        const res = await messageService.getMessages(chatUser.userId);
        const history = res.data || res?.$values || res || [];
        setMessages(
          history
            .filter(m => {
              const c = m.messageContent || m.MessageContent || '';
              return !c.startsWith('[RTC_SIGNAL]');
            })
            .map(m => ({
              senderId: m.senderId || m.SenderId,
              messageContent: m.messageContent || m.MessageContent,
              imageUrl: m.imageUrl || m.ImageUrl,
              createdAt: m.createdAt || m.CreatedAt,
              isRead: m.isRead || m.IsRead,
            }))
        );
        await messageService.markAsRead(chatUser.userId);
      } catch (e) { console.error(e); }
    };
    load();
  }, [chatUser.userId]);

  // SignalR listeners
  useEffect(() => {
    if (!connection) return;
    const handleMsg = (senderId, content, imageUrl, createdAt) => {
      if (content?.startsWith('[RTC_SIGNAL]')) return;
      const sId = senderId?.toString();
      const myId = currentUser?.userId?.toString();
      const targetId = selectedUserRef.current?.userId?.toString();
      if (sId === myId || sId === targetId) {
        setMessages(prev => [...prev, {
          senderId, messageContent: content, imageUrl,
          createdAt: createdAt || new Date().toISOString(), isRead: false,
        }]);
        if (sId === targetId) messageService.markAsRead(targetId).catch(() => {});
      }
    };
    const handleTyping = (sid, isTyping) => {
      if (sid?.toString() === selectedUserRef.current?.userId?.toString()) setIsOtherTyping(isTyping);
    };
    connection.on('ReceiveMessage', handleMsg);
    connection.on('UserTyping', handleTyping);
    return () => {
      connection.off('ReceiveMessage', handleMsg);
      connection.off('UserTyping', handleTyping);
    };
  }, [connection, currentUser]);

  useEffect(() => {
    if (!isMinimized) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMinimized]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !connection || connection.state !== 'Connected') return;
    try {
      await connection.invoke('SendPrivateMessage', chatUser.userId, inputText.trim(), null);
      setInputText('');
      connection.invoke('SendTypingStatus', chatUser.userId, false).catch(() => {});
    } catch (err) { console.error(err); }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (connection?.state === 'Connected') {
      connection.invoke('SendTypingStatus', chatUser.userId, true).catch(() => {});
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => {
        connection.invoke('SendTypingStatus', chatUser.userId, false).catch(() => {});
      }, 2000);
    }
  };

  const isOnline = onlineUsers?.has(chatUser.userId);

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
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="relative w-8 h-8 flex-shrink-0">
          <img
            src={chatUser.displayAvatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chatUser.displayName)}&background=6366f1&color=fff`; }}
          />
          {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{chatUser.displayName}</p>
          <p className="text-white/60 text-[10px] font-medium">
            {isOtherTyping ? 'đang gõ...' : isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
          </p>
        </div>
        <div className="flex items-center gap-1">
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
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-[12px] font-medium shadow-sm ${
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
          key={chatUser.userId}
          chatUser={chatUser}
          onClose={() => onClose(chatUser.userId)}
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
    if (!isOpen || users.length > 0) return;
    setLoading(true);
    const load = async () => {
      try {
        const res = await userService.getUsersToChat();
        const raw = res?.data || res;
        let data = raw?.result || raw?.Result || raw?.$values || (Array.isArray(raw) ? raw : []);
        data = data.filter(u => u && u.userId !== user?.userId).map(u => ({
          ...u,
          displayName: u.fullName || u.FullName || u.username || 'Người dùng',
          displayAvatar: getFullAvatarUrl(u.avatarUrl || u.AvatarUrl) || '',
        }));
        setUsers(data);
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
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="text-slate-400 text-sm font-semibold">Chưa có hội thoại nào</p>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {users.map(u => {
                const isOnline = onlineUsers?.has(u.userId);
                const unread = unreadCountsPerUser?.[u.userId] || 0;
                return (
                  <button
                    key={u.userId}
                    onClick={() => { onOpenChat(u); setIsOpen(false); }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all text-left group relative"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={u.displayAvatar}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=6366f1&color=fff`; }}
                      />
                      {isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-white shadow-sm" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                        {u.displayName}
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
              })}
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
