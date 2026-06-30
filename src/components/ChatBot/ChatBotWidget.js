import React, { useState, useEffect, useRef } from 'react';
import chatbotService from '../../services/chatbotService';
import { useAuth } from '../../context/AuthContext';

const ChatBotWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Drag state
  const [position, setPosition] = useState({ x: 24, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDragged, setIsDragged] = useState(false);
  const dragInfo = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Load history from localStorage
  useEffect(() => {
    if (user) {
      const savedMessages = localStorage.getItem(`chatbot_history_${user.userId}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        // Gửi tin nhắn chào mừng mặc định
        setMessages([
          { role: 'bot', content: `Xin chào ${user.fullName || 'bạn'}! Mình là MiniBot, trợ lý ảo của MiniSocial. Mình có thể giúp gì cho bạn hôm nay?` }
        ]);
      }
    }
  }, [user]);

  // Save to localStorage when messages change
  useEffect(() => {
    if (user && messages.length > 0) {
      localStorage.setItem(`chatbot_history_${user.userId}`, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setIsDragged(false);
    dragInfo.current = {
      startX: e.clientX || (e.touches && e.touches[0].clientX),
      startY: e.clientY || (e.touches && e.touches[0].clientY),
      initialX: position.x,
      initialY: position.y
    };
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const dx = clientX - dragInfo.current.startX;
    const dy = clientY - dragInfo.current.startY;
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setIsDragged(true);
    }

    setPosition({
      x: dragInfo.current.initialX + dx,
      y: dragInfo.current.initialY + dy
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    if (e.target.releasePointerCapture) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const toggleOpen = (e) => {
    if (isDragged) return;
    setIsOpen(!isOpen);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { role: 'user', content: inputText.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const historyToSend = messages.map(m => ({
        Role: m.role,
        Content: m.content
      }));

      const res = await chatbotService.askBot(userMessage.content, historyToSend);
      setMessages([...newMessages, { role: 'bot', content: res.answer }]);
    } catch (error) {
      console.error("Lỗi khi gọi Bot:", error);
      const errorMessage = error.response?.data || error.message || "Lỗi không xác định";
      setMessages([...newMessages, { role: 'bot', content: `Lỗi kỹ thuật: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null; // Chỉ hiển thị khi đã đăng nhập

  return (
    <div 
      className="fixed z-[9900] flex flex-col items-start pointer-events-none"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      
      {/* Nút Bong Bóng Chat */}
      <button 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={toggleOpen}
        className="pointer-events-auto w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-transform group border-2 border-white/20 touch-none cursor-grab active:cursor-grabbing hover:scale-110"
      >
        <svg className={`w-7 h-7 text-white transition-transform duration-300 ${isOpen ? 'rotate-90 scale-0' : 'rotate-0 scale-100 animate-pulse'}`} fill="currentColor" viewBox="0 0 24 24" pointerEvents="none">
          <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
        </svg>
        <svg className={`w-7 h-7 text-white absolute transition-transform duration-300 ${isOpen ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" pointerEvents="none">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Cửa sổ Chat */}
      <div 
        className={`pointer-events-auto absolute bottom-16 left-0 mb-4 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-left ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
        }`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner">
            <span className="text-xl text-white font-extrabold italic font-serif">S</span>
          </div>
          <div>
            <h3 className="text-white font-bold text-base leading-tight">Trợ Lý Ảo MiniSocial</h3>
            <p className="text-white/80 text-xs">Luôn sẵn sàng hỗ trợ</p>
          </div>
          <button onClick={() => setMessages([{ role: 'bot', content: 'Lịch sử chat đã được xóa. Bạn cần giúp gì?' }])} className="ml-auto text-white/70 hover:text-white p-1" title="Xóa lịch sử">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {msg.role === 'bot' ? (
                  <div className="whitespace-pre-wrap">
                    {msg.content}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Hỏi MiniBot điều gì đó..."
            className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputText.trim()}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
          >
            <svg className="w-5 h-5 -ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBotWidget;
