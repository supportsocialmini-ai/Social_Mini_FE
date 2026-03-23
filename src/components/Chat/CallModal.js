import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

const CallModal = ({ isOpen, type, targetUser, onHangup, onAccept, onDecline, isIncoming, remoteStream, localStream }) => {
  const { getFullAvatarUrl } = useAuth();
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6 sm:p-10 animate-in fade-in duration-300">
      
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>

      <div className="w-full max-w-4xl flex flex-col items-center gap-10">
        
        {/* User Info & Status */}
        <div className="flex flex-col items-center text-center animate-in slide-in-from-top-4 duration-500">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2.5rem] bg-slate-800 border-2 border-white/10 p-1 mb-6 shadow-2xl">
            <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-slate-700">
              <img 
                src={getFullAvatarUrl(targetUser?.avatarUrl, targetUser?.fullName || targetUser?.displayName)} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
            {targetUser?.fullName || targetUser?.displayName}
          </h2>
          <p className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">
            {isIncoming ? (onAccept ? "Incoming Video Call..." : "Quality calling...") : "Calling..."}
          </p>
        </div>

        {/* Video Streams */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 relative min-h-[300px] sm:min-h-[400px]">
          {/* Remote Video */}
          <div className="relative bg-slate-800/50 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl aspect-video md:aspect-auto">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black/20" />
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <p className="text-[10px] font-black uppercase tracking-widest mt-4">Waiting for partner...</p>
              </div>
            )}
          </div>
          
          {/* Local Video */}
          <div className="relative bg-slate-800/50 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl aspect-video md:aspect-auto">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-black/20" />
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">You</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 sm:gap-10 animate-in slide-in-from-bottom-4 duration-500">
          {isIncoming && !remoteStream ? (
            <>
              <button 
                onClick={onDecline}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-rose-500/20 transition-all hover:scale-110 active:scale-90"
              >
                <svg className="w-8 h-8 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </button>
              <button 
                onClick={isIncoming ? onAccept : undefined}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 transition-all hover:scale-110 active:scale-95 animate-bounce"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </button>
            </>
          ) : (
            <button 
              onClick={onHangup}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-rose-500/20 transition-all hover:scale-110 active:scale-90"
            >
              <svg className="w-8 h-8 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CallModal;
