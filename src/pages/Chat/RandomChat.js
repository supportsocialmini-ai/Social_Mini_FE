import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Navbar from '../../components/Layout/Navbar';
import { toast } from 'react-toastify';
import { Heart, X, MessageCircle, User, Zap, Users, Shield, Send, Image as ImageIcon, Smile, Lock, Crown, Check, CreditCard, Clock } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const RandomChat = () => {
  const { user, getFullAvatarUrl, isPremium, hasFeature } = useAuth();
  const {
    randomChatState,
    setRandomChatState,
    queueStats,
    joinRandomQueue,
    leaveRandomQueue,
    sendRandomHeart,
    leaveRandomChat,
    connection
  } = useChat();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [targetGender, setTargetGender] = useState('Male');
  const [ageRange, setAgeRange] = useState('All');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(80);
  const [showGenderSelect, setShowGenderSelect] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [dbPackages, setDbPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const scrollRef = useRef(null);

  // Auto-select first package when list loaded
  useEffect(() => {
    if (dbPackages.length > 0 && !selectedPackageId) {
      setSelectedPackageId(dbPackages[0].id);
    }
  }, [dbPackages, selectedPackageId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchDbPackages = async () => {
      try {
        const res = await axiosClient.get('/api/payment/packages');
        setDbPackages(res || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách gói:", err);
      }
    };
    fetchDbPackages();
  }, []);

  // Handle SignalR events
  useEffect(() => {
    if (connection) {
      const handleMsg = (senderId, content, imageUrl, createdAt) => {
        // Chỉ nhận tin nhắn nếu là từ partner hiện tại
        setMessages(prev => [...prev, {
          senderId,
          content,
          imageUrl,
          createdAt,
          isMe: senderId === user?.userId
        }]);
      };

      const handleError = (msg) => {
        toast.error(msg);
        setRandomChatState(prev => ({ ...prev, status: 'idle' }));
        setShowGenderSelect(true);
        setIsSearching(false);
      };

      // Component này chỉ cần nghe tin nhắn và lỗi, 
      // các sự kiện trạng thái (Matching, Identity, v.v.) đã được ChatContext lo liệu toàn cục.
      connection.on("ReceiveMessage", handleMsg);
      connection.on("ReceiveError", handleError);

      return () => {
        connection.off("ReceiveMessage", handleMsg);
        connection.off("ReceiveError", handleError);
      };
    }
  }, [connection, user, setRandomChatState]);

  const handleStartSearch = async () => {
    if (!user?.gender || !user?.dateOfBirth) {
      toast.warn("Vui lòng cập nhật Giới tính và Ngày sinh!");
      navigate('/profile');
      return;
    }

    if (connection?.state !== 'Connected') {
      toast.error("Đang kết nối lại máy chủ, vui lòng đợi giây lát...");
      return;
    }

    let min = ageRange === 'All' ? 18 : minAge;
    let max = ageRange === 'All' ? 99 : maxAge;

    setIsSearching(true);
    try {
      // Chuyển sang trạng thái tìm kiếm NGAY LẬP TỨC để tránh bị Race Condition
      setShowGenderSelect(false);
      setRandomChatState(prev => ({ ...prev, status: 'searching' }));

      await joinRandomQueue(targetGender, min, max);
    } catch (err) {
      console.error("Join Queue Error:", err);

      // CHỈ RESET nếu hiện tại không phải đang Chat (phòng trường hợp đã Match nhanh qua SignalR)
      setRandomChatState(prev => {
        if (prev.status === 'chatting') return prev;

        toast.error(`Lỗi: ${err.message || "Không thể kết nối máy chủ"}`);
        setShowGenderSelect(true);
        return { ...prev, status: 'idle' };
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !randomChatState.conversationId || !randomChatState.partner?.userId) return;
    try {
      await connection.invoke("SendPrivateMessage", randomChatState.partner.userId, inputText, null);
      setInputText('');
    } catch (err) {
      toast.error("Không thể gửi tin.");
    }
  };

  const handleHeart = async () => {
    if (!randomChatState.conversationId) return;
    try {
      await sendRandomHeart(randomChatState.conversationId);
      toast.info("Đã gửi tim ❤️");
    } catch (err) {
      toast.error("Lỗi gửi tim.");
    }
  };

  const handleLeave = async () => {
    if (window.confirm("Rời cuộc trò chuyện? Lịch sử sẽ bị xóa.")) {
      await leaveRandomChat(randomChatState.conversationId);
      setRandomChatState({ status: 'idle', conversationId: null, partner: null, partnerLikedMe: false });
      setMessages([]);
      setShowGenderSelect(true);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPackageId) return;
    setIsProcessingPayment(true);
    try {
      const response = await axiosClient.post('/api/payment/create', { packageId: selectedPackageId });
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
    } catch (err) {
      toast.error("Không thể khởi tạo thanh toán.");
      setIsProcessingPayment(false);
    }
  };

  const selectedPkg = dbPackages.find(p => p.id === selectedPackageId) || dbPackages[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100">
      <Navbar />

      {/* Cài đặt Animation Radar */}
      <style>{`
        @keyframes radar-ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        .radar-wave {
          animation: radar-ping 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center relative overflow-hidden">

        {/* Đèn nền trang trí */}
        <div className="absolute top-[10%] left-[10%] w-80 h-80 bg-indigo-300/30 rounded-full blur-[100px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-purple-300/30 rounded-full blur-[100px] -z-10 animate-pulse [animation-delay:2s]"></div>

        {/* MẶT NẠ CHỌN GIỚI TÍNH & ĐỘ TUỔI (PREMIUM) */}
        {showGenderSelect && randomChatState.status === 'idle' && (
          <div className="w-full max-w-xl bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-10 md:p-14 transition-all hover:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.12)]">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="p-5 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-200 group-hover:rotate-12 transition-transform">
                <Zap className="w-12 h-12 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Tìm bạn tâm giao</h1>
                <p className="text-slate-500 font-medium max-w-sm">Chỉ lộ diện khi cả hai cùng chung nhịp đập. An toàn, bảo mật và thú vị!</p>
              </div>

              <div className="w-full space-y-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Tôi đang tìm kiếm</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'Male', label: 'Nam giới', icon: User, color: 'indigo' },
                      { id: 'Female', label: 'Nữ giới', icon: Heart, color: 'rose' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setTargetGender(opt.id)}
                        className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-2 transition-all ${targetGender === opt.id
                            ? `border-${opt.color}-500 bg-white shadow-xl scale-[1.05]`
                            : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                          }`}
                      >
                        <div className={`p-4 rounded-2xl ${targetGender === opt.id ? `bg-${opt.color}-50 text-${opt.color}-600` : 'bg-white text-slate-400'}`}>
                          <opt.icon className="w-8 h-8" />
                        </div>
                        <span className={`font-bold ${targetGender === opt.id ? 'text-slate-900' : 'text-slate-500'}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center flex items-center justify-center gap-2">
                     Độ tuổi phù hợp: <span className="text-slate-900 text-sm">{ageRange === 'All' ? 'Bất kỳ' : `${minAge} - ${maxAge} tuổi`}</span>
                     {!hasFeature('Filter Age') && <Crown className="w-3 h-3 text-amber-500 fill-current" />}
                   </p>
                   
                   <div className="px-4">
                      {/* Range Slider Container */}
                      <div className={`relative w-full h-12 flex items-center ${!hasFeature('Filter Age') ? 'opacity-30 cursor-not-allowed' : ''}`}
                           onClick={() => !hasFeature('Filter Age') && setShowPremiumModal(true)}>
                        
                        {/* Custom Slider Track */}
                        <div className="absolute w-full h-1.5 bg-slate-100 rounded-full"></div>
                        <div 
                          className="absolute h-1.5 bg-slate-900 rounded-full"
                          style={{ 
                            left: `${((minAge - 18) / (80 - 18)) * 100}%`, 
                            right: `${100 - ((maxAge - 18) / (80 - 18)) * 100}%` 
                          }}
                        ></div>

                        {/* Input Range (Hidden but functional) */}
                        <input
                          type="range"
                          min="18"
                          max="80"
                          value={minAge}
                          disabled={!hasFeature('Filter Age')}
                          onChange={(e) => {
                            const val = Math.min(Number(e.target.value), maxAge - 1);
                            setMinAge(val);
                            setAgeRange('Custom');
                          }}
                          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
                        />
                        <input
                          type="range"
                          min="18"
                          max="80"
                          value={maxAge}
                          disabled={!hasFeature('Filter Age')}
                          onChange={(e) => {
                            const val = Math.max(Number(e.target.value), minAge + 1);
                            setMaxAge(val);
                            setAgeRange('Custom');
                          }}
                          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
                        />
                      </div>

                      <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-300">
                        <span>18 tuổi</span>
                        <span>80 tuổi</span>
                      </div>
                   </div>

                   {/* Nút reset về Bất kỳ */}
                   {hasFeature('Filter Age') && ageRange !== 'All' && (
                     <div className="text-center mt-4">
                        <button 
                          onClick={() => { setAgeRange('All'); setMinAge(18); setMaxAge(80); }}
                          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                          Đặt lại: Bất kỳ
                        </button>
                     </div>
                   )}
                </div>
              </div>

              <button
                onClick={handleStartSearch}
                disabled={isSearching || connection?.state !== 'Connected'}
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {connection?.state !== 'Connected' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="opacity-70">Đang kết nối...</span>
                  </>
                ) : isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang tìm kiếm...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 fill-current text-indigo-400" />
                    <span>Bắt đầu ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* CASE 2: RADAR SEARCHING UI */}
        {randomChatState.status === 'searching' && (
          <div className="flex flex-col items-center justify-center text-center space-y-12">
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* Radar Waves */}
              <div className="absolute inset-0 bg-indigo-500 rounded-full radar-wave"></div>
              <div className="absolute inset-0 bg-indigo-400 rounded-full radar-wave [animation-delay:1.3s]"></div>
              <div className="absolute inset-0 bg-indigo-300 rounded-full radar-wave [animation-delay:2.6s]"></div>

              <div className="relative w-44 h-44 bg-white p-2 rounded-full shadow-2xl z-20">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-4 border-white">
                  <img src={getFullAvatarUrl(user?.avatarUrl)} className="w-full h-full object-cover" alt="User" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Đang quét sóng...</h2>
              <p className="text-slate-500 font-medium text-lg">Hệ thống đang tìm một {targetGender === 'Male' ? 'chàng trai' : 'cô gái'} dành cho bạn</p>

              {/* BẢNG THỐNG KÊ HÀNG ĐỢI (NEW) */}
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                    Tìm thấy {queueStats.matching || 0} đối tượng phù hợp
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Tổng cộng {queueStats.global || queueStats.total || 0} người đang tìm kiếm
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                leaveRandomQueue();
                setRandomChatState({ status: 'idle', conversationId: null, partner: null, partnerLikedMe: false });
                setShowGenderSelect(true);
              }}
              className="px-10 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
            >
              Hủy tìm kiếm
            </button>
          </div>
        )}

        {/* CASE 3: CHATTING UI */}
        {randomChatState.status === 'chatting' && (
          <div className="w-full max-w-6xl bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] rounded-[3rem] border border-slate-100 flex flex-col md:flex-row h-[800px] overflow-hidden animate-in fade-in duration-700">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50/50">
              <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
                <div className="flex items-center gap-5">
                  <div className={`relative w-16 h-16 rounded-3xl overflow-hidden shadow-xl transition-all duration-1000 ${randomChatState.partner?.isAnonymous ? 'bg-slate-900 group' : 'rotate-0'}`}>
                    {randomChatState.partner?.isAnonymous ? (
                      <div className="flex items-center justify-center h-full text-white/30">
                        <Shield className="w-8 h-8" />
                      </div>
                    ) : (
                      <img src={getFullAvatarUrl(randomChatState.partner?.avatarUrl)} className="w-full h-full object-cover" alt="Partner" />
                    )}
                    <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      {randomChatState.partner?.fullName}
                      {isPremium && <Crown className="w-5 h-5 text-amber-500 fill-current" />}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kết nối bí mật</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleHeart}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${randomChatState.partnerLikedMe
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                        : 'bg-rose-50 text-rose-500 hover:bg-rose-100 active:scale-90'
                      }`}
                  >
                    <Heart className={`w-7 h-7 ${randomChatState.partnerLikedMe ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleLeave}
                    className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-20">
                    <MessageCircle className="w-20 h-20" />
                    <p className="text-xl font-black">Phá tan bầu không khí này nào!</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-6 py-4 rounded-[2rem] shadow-sm ${msg.isMe
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                      <p className="text-[15px] font-medium leading-relaxed">{msg.content}</p>
                      <span className={`text-[10px] mt-2 block opacity-40 font-bold ${msg.isMe ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <footer className="p-8 bg-white border-t border-slate-100">
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2.5rem] border border-slate-100 shadow-inner">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Lời chào của bạn..."
                    className="flex-1 bg-transparent border-none px-6 py-4 text-sm font-bold focus:ring-0 outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl disabled:opacity-30 active:scale-95"
                  >
                    <Send className="w-7 h-7" />
                  </button>
                </div>
              </footer>
            </div>
          </div>
        )}
        {/* MODAL NÂNG CẤP PREMIUM */}
        {showPremiumModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isProcessingPayment && setShowPremiumModal(false)}></div>
            <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
               {/* Header Modal */}
               <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                     <Crown className="w-40 h-40 rotate-12" />
                  </div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-4 text-amber-400">
                        <Crown className="w-8 h-8 fill-current" />
                        <span className="font-black tracking-widest uppercase text-sm">Hội viên Premium</span>
                     </div>
                     <h2 className="text-4xl font-black mb-2">Nâng cấp trải nghiệm</h2>
                     <p className="text-slate-400 font-medium leading-relaxed">Mở khóa mọi tính năng lọc nâng cao, lộ diện danh tính và nhiều đặc quyền khác.</p>
                  </div>
               </div>

                <div className="p-10 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {dbPackages.length > 0 ? dbPackages.map((pkg, idx) => (
                        <button 
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          disabled={isProcessingPayment}
                          className={`relative p-6 rounded-3xl border-2 transition-all text-left flex flex-col justify-between hover:scale-[1.02] active:scale-95 ${
                             selectedPackageId === pkg.id 
                             ? 'border-indigo-600 bg-indigo-50/30' 
                             : (idx === 1 ? 'border-amber-400/30 bg-amber-50/10' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200')
                          }`}
                        >
                           {(selectedPackageId === pkg.id || (idx === 1 && !selectedPackageId)) && (
                             <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase">Đang chọn</span>
                           )}
                           <div>
                               <p className="text-xs font-black text-slate-500 uppercase mb-1">{pkg.name}</p>
                               <p className="text-2xl font-black text-slate-900">
                                  {pkg.price?.toLocaleString('vi-VN')} ₫
                               </p>
                               <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {pkg.durationDays || 30} ngày
                               </div>
                            </div>
                           <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-tighter">{pkg.description || 'Ưu đãi đặc biệt'}</p>
                        </button>
                      )) : (
                        <div className="col-span-3 py-10 text-center text-slate-400 font-bold italic">
                           Đang tải các gói ưu đãi...
                        </div>
                      )}
                   </div>

                  <div className="space-y-4 bg-slate-50 p-6 rounded-3xl min-h-[200px]">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Đặc quyền của gói {selectedPkg?.name}:</p>
                     {selectedPkg?.features?.split(',').map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                           <Check className="w-4 h-4 text-green-500" />
                           {item.trim()}
                        </div>
                     )) || [
                        "Lọc đối tượng theo độ tuổi chính xác",
                        "Lọc theo giới tính mọi lúc",
                        "Hiệu ứng Radar Premium rực rỡ",
                        "Xem trước danh tính (Unmask) bí mật",
                        "Hỗ trợ ưu tiên 24/7"
                     ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                           <Check className="w-4 h-4 text-green-500" />
                           {item}
                        </div>
                     ))}
                  </div>

                  <div className="flex flex-col items-center gap-5 pt-4">
                     <button 
                        onClick={handleUpgrade}
                        disabled={isProcessingPayment || !selectedPackageId}
                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                     >
                        {isProcessingPayment ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Đang xử lý...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-6 h-6" />
                            <span>Thanh toán ngay</span>
                          </>
                        )}
                     </button>

                     <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <Shield className="w-3 h-3" />
                       Thanh toán an toàn qua VNPay
                     </div>
                     
                     <button 
                       onClick={() => setShowPremiumModal(false)}
                       disabled={isProcessingPayment}
                       className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                     >
                       Để sau
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RandomChat;
