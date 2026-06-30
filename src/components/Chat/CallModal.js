import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

const CallModal = ({ isOpen, type, targetUser, onHangup, onAccept, onDecline, isIncoming, remoteStream, localStream }) => {
  const { getFullAvatarUrl } = useAuth();
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isMinimized]); // Re-bind khi thay đổi trạng thái minimize

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isMinimized]);

  if (!isOpen) {
    if (isMinimized) setIsMinimized(false); // Reset trạng thái khi đóng
    return null;
  }

  return (
    <div className={`fixed z-[9999] transition-all duration-300 ease-in-out ${
      isMinimized 
        ? 'bottom-6 right-6 w-72 h-[450px] bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden' 
        : 'inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 sm:p-10'
    }`}>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setIsMinimized(!isMinimized)}
        className={`absolute top-4 right-4 z-[10000] p-2 text-white/70 hover:text-white bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full transition-all hover:scale-110 active:scale-95 ${isMinimized ? 'border border-white/10' : ''}`}
        title={isMinimized ? "Phóng to" : "Thu nhỏ"}
      >
        {isMinimized ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Background Decor (Chỉ hiện khi Maximize) */}
      {!isMinimized && (
        <>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
        </>
      )}

      {/* Main Content Container */}
      <div className={`w-full h-full flex flex-col ${isMinimized ? 'p-4 relative' : 'max-w-4xl items-center gap-10'}`}>
        
        {/* User Info & Status */}
        {(!isMinimized || !remoteStream) && (
          <div className={`flex flex-col items-center text-center animate-in fade-in duration-500 z-50 ${isMinimized ? 'mt-8 mb-4' : ''}`}>
            <div className={`${isMinimized ? 'w-20 h-20' : 'w-24 h-24 sm:w-32 sm:h-32'} rounded-full bg-slate-800 border-2 border-white/10 p-1 mb-4 shadow-2xl`}>
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-700">
                <img 
                  src={getFullAvatarUrl(targetUser?.avatarUrl, targetUser?.fullName || targetUser?.displayName)} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
            <h2 className={`${isMinimized ? 'text-xl' : 'text-2xl sm:text-4xl'} font-black text-white tracking-tight mb-1 truncate max-w-[200px]`}>
              {targetUser?.fullName || targetUser?.displayName}
            </h2>
            <p className={`text-indigo-400 font-bold uppercase tracking-[0.2em] ${isMinimized ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}>
              {isIncoming && !remoteStream ? "Incoming Call..." : "Quality calling..."}
            </p>
          </div>
        )}

        {/* Video Streams */}
        <div className={`w-full relative flex-1 ${isMinimized ? 'absolute inset-0 z-0' : 'grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px] sm:min-h-[400px]'}`}>
          
          {/* Remote Video */}
          <div className={`relative bg-slate-800/80 overflow-hidden border border-white/5 shadow-2xl ${isMinimized ? 'w-full h-full rounded-none' : 'rounded-[2.5rem] aspect-video md:aspect-auto'}`}>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black/40" />
            {!remoteStream && !isMinimized && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <p className="text-[10px] font-black uppercase tracking-widest mt-4">Waiting for partner...</p>
              </div>
            )}
          </div>
          
          {/* Local Video */}
          <div className={`relative bg-slate-800/80 overflow-hidden border border-white/10 shadow-2xl ${isMinimized ? 'absolute bottom-24 right-4 w-20 aspect-[3/4] rounded-xl z-20 shadow-black/50 ring-2 ring-white/10' : 'rounded-[2.5rem] aspect-video md:aspect-auto'}`}>
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-black/40 scale-x-[-1]" />
            {!isMinimized && (
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">You</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={`flex items-center justify-center z-50 animate-in slide-in-from-bottom-4 duration-500 ${isMinimized ? 'absolute bottom-6 left-0 right-0 gap-6' : 'gap-6 sm:gap-10'}`}>
          {isIncoming && !remoteStream ? (
            <>
              <button 
                onClick={onDecline}
                className={`${isMinimized ? 'w-12 h-12' : 'w-16 h-16 sm:w-20 sm:h-20'} bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-rose-500/20 transition-all hover:scale-110 active:scale-90`}
              >
                <svg className={`${isMinimized ? 'w-6 h-6' : 'w-8 h-8'} rotate-[135deg]`} fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </button>
              <button 
                onClick={isIncoming ? onAccept : undefined}
                className={`${isMinimized ? 'w-12 h-12' : 'w-16 h-16 sm:w-20 sm:h-20'} bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 transition-all hover:scale-110 active:scale-95 animate-bounce`}
              >
                <svg className={isMinimized ? 'w-6 h-6' : 'w-8 h-8'} fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </button>
            </>
          ) : (
            <button 
              onClick={onHangup}
              className={`${isMinimized ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20'} bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-rose-500/20 transition-all hover:scale-110 active:scale-90`}
            >
              <svg className={`${isMinimized ? 'w-7 h-7' : 'w-8 h-8'} rotate-[135deg]`} fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CallModal;
