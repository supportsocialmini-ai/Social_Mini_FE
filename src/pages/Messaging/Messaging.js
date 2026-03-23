import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import messageService from '../../services/messageService';
import userService from '../../services/userService';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const Messaging = () => {
  const { user, getFullAvatarUrl } = useAuth();
  const { t } = useTranslation();
  const {
    connection, onlineUsers,
    unreadCountsPerUser, setUnreadCountsPerUser, fetchUnreadCount,
    startCall
  } = useChat();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const imageInputRef = useRef(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Lấy danh sách người dùng để chat
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getUsersToChat();
        const res = response?.data || response;
        let rawData = res?.result || res?.Result || res?.$values || (Array.isArray(res) ? res : []);

        const normalizedData = (Array.isArray(rawData) ? rawData : [])
          .filter(u => u && u.userId !== user?.userId)
          .map(u => ({
            ...u,
            displayName: u.fullName || u.FullName || u.userName || u.username || 'Người dùng',
            displayAvatar: getFullAvatarUrl(u.avatarUrl || u.AvatarUrl) || ''
          }));

        setUsers(normalizedData);
      } catch (error) {
        console.error("Lỗi lấy danh sách người dùng:", error);
      }
    };
    if (user) fetchUsers();
  }, [user, getFullAvatarUrl]);

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

  // 3. Lắng nghe tin nhắn thời gian thực
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    if (!connection) return;

    const handleReceiveMessage = (senderId, content, imageUrl, createdAt) => {
      // Bỏ qua tín hiệu WebRTC
      if (content?.startsWith('[RTC_SIGNAL]')) return;

      const sId = senderId?.toString() || "";
      const currentSelectedId = selectedUserRef.current?.userId?.toString() || "";
      const myId = user?.userId?.toString() || "";

      const isFromMe = sId === myId;
      const isFromSelectedUser = sId === currentSelectedId;

      if (isFromMe || isFromSelectedUser) {
        const newMsg = { 
            senderId, 
            messageContent: content, 
            imageUrl: imageUrl, 
            createdAt: createdAt || new Date().toISOString(), 
            isRead: false 
        };
        setMessages(prev => [...prev, newMsg]);

        // Tự động báo Seen
        if (isFromSelectedUser) {
          messageService.markAsRead(currentSelectedId).catch(() => { });
          connection.invoke("NotifySeen", currentSelectedId).catch(() => { });
          // Reset unread count local
          setUnreadCountsPerUser(prev => ({ ...prev, [senderId]: 0 }));
          fetchUnreadCount();
        }
      } else {
        const sender = users.find(u => u.userId?.toString() === sId);
        const previewText = imageUrl ? `[${t('messaging.image') || 'Image'}]` : (content?.substring(0, 20) || t('messaging.newMessage') || "New message");
        toast.info(t('messaging.newMessageFrom', { name: sender?.displayName || '...' }) + `: ${previewText}...`);
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

    return () => {
      connection.off("ReceiveMessage");
      connection.off("UserTyping");
      connection.off("MessageSeen");
    };
  }, [connection, user, users]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!connection || connection.state !== 'Connected') {
      toast.error(t('messaging.connectionError'));
      return;
    }

    if (inputText.trim() && selectedUser) {
      try {
        await connection.invoke("SendPrivateMessage", selectedUser.userId, inputText, null);
        setInputText("");
        connection.invoke("SendTypingStatus", selectedUser.userId, false).catch(() => { });
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
      handleSendMessage(e);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#fcfcfd] overflow-hidden">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 pb-24 sm:p-6 min-h-0">
        <div className="h-full bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden flex">

          {/* Sidebar */}
          <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-slate-50 flex-col h-full`}>
            <div className="p-6 lg:p-8 border-b border-slate-50 flex-shrink-0">
              <h2 className="text-xl lg:text-2xl font-black text-slate-800">{t('messaging.title')}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 custom-scrollbar">
              {users.map(u => (
                <div
                  key={u.userId}
                  onClick={() => {
                    setSelectedUser(u);
                    setUnreadCountsPerUser(prev => ({ ...prev, [u.userId]: 0 }));
                    fetchUnreadCount();
                  }}
                  className={`flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-[1.2rem] lg:rounded-[1.5rem] cursor-pointer transition-all ${selectedUser?.userId === u.userId ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/50">
                    <img
                      src={u.displayAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}`}
                    />
                    {onlineUsers.has(u.userId) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate text-sm lg:text-base">{u.displayName}</div>
                      <div className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {onlineUsers.has(u.userId) ? <span className="text-emerald-500">{t('messaging.activeNow')}</span> : <span>{t('messaging.offline')}</span>}
                      </div>
                    </div>
                    {unreadCountsPerUser[u.userId] > 0 && (
                      <div className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-red-100">
                        {unreadCountsPerUser[u.userId] > 9 ? '9+' : unreadCountsPerUser[u.userId]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && <div className="text-center py-10 text-slate-300 text-xs font-bold uppercase tracking-widest">{t('messaging.noFriends')}</div>}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col h-full bg-slate-50/20 min-w-0`}>
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 lg:p-6 bg-white border-b border-slate-50 flex items-center gap-4 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/50">
                    <img
                      src={selectedUser.displayAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.displayName)}`}
                    />
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

                <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-6 custom-scrollbar min-h-0">
                  {messages.map((m, i) => {
                    const isMe = m.senderId?.toString() === user?.userId?.toString();
                    const imgUrl = m.imageUrl ? getFullAvatarUrl(m.imageUrl) : (m.messageContent?.startsWith('[IMAGE]') ? m.messageContent.replace('[IMAGE]', '') : null);
                    
                    return (
                      <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] p-3 lg:p-4 rounded-[1.2rem] lg:rounded-[1.5rem] text-[13px] lg:text-sm font-medium shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt="sent"
                              className="max-w-full sm:max-w-[400px] rounded-2xl cursor-pointer hover:opacity-95 transition-all shadow-lg border-2 border-white/20"
                              onClick={() => setEnlargedImage(imgUrl)}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{m.messageContent}</p>
                          )}
                          <div className={`text-[8px] lg:text-[9px] mt-2 font-bold uppercase tracking-tighter opacity-60 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                             {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             {isMe && m.isRead && <span className="text-indigo-200 ml-1 font-black">· SEEN</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isOtherTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="bg-white border border-slate-100 p-3 rounded-[1.2rem] rounded-tl-none shadow-sm flex items-center gap-1.5">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                        </div>
                         <span className="text-[10px] font-bold text-slate-400 tracking-tight ml-1 uppercase">{selectedUser.displayName.split(' ')[0]} {t('messaging.isTyping')}</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-2" />
                </div>

                <div className="p-4 lg:p-6 bg-white border-t border-slate-50 flex-shrink-0">
                  <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                  <form onSubmit={handleSendMessage} className="flex gap-2 lg:gap-3 items-center relative">
                    <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isUploading} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      {isUploading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : 
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                    </button>
                     <input 
                       type="text" 
                       value={inputText} 
                       onChange={handleInputChange} 
                       onKeyDown={handleKeyDown} 
                       maxLength={2000}
                       placeholder={t('messaging.messagePlaceholder', { name: selectedUser.displayName.split(' ')[0] })} 
                       className="flex-1 bg-slate-50 border border-slate-100 rounded-xl lg:rounded-2xl px-4 lg:px-5 py-2.5 lg:py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-sm" 
                     />
                     <div className="absolute right-24 bottom-full mb-2 text-[10px] font-bold text-slate-300">
                       {inputText.length}/2000
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