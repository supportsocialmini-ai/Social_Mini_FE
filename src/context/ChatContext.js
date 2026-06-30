import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import axiosClient from '../api/axiosClient';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [connection, setConnection] = useState(null);
  const [openChats, setOpenChats] = useState([]);

  // WebRTC States
  const [call, setCall] = useState(null); // { targetUser, type, isIncoming, status: 'ringing'|'connected' }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadCountsPerUser, setUnreadCountsPerUser] = useState({}); // { userId: count }
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [randomChatState, setRandomChatState] = useState({ 
    status: 'idle', // idle, searching, chatting
    conversationId: null, 
    partner: null,
    partnerLikedMe: false
  });

  const [queueStats, setQueueStats] = useState({
    total: 0,
    matching: 0,
    global: 0
  });

  const peerConnection = useRef(null);
  const pendingCandidates = useRef([]);

  const fetchUnreadCount = async () => {
    try {
      const countRes = await axiosClient.get('api/chat/unread-count');
      setUnreadMessageCount(countRes?.result || countRes || 0);

      const countsRes = await axiosClient.get('api/chat/unread-counts');
      const countsData = countsRes?.result || countsRes?.$values || countsRes || [];
      const countsMap = {};
      if (Array.isArray(countsData)) {
        countsData.forEach(item => {
          countsMap[item.senderId] = item.count;
        });
      }
      setUnreadCountsPerUser(countsMap);
    } catch (error) {
      console.error("Lỗi fetch unread count:", error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const ids = await axiosClient.get('api/chat/online-users');
      const data = ids?.$values || ids || [];
      setOnlineUsers(new Set(data));
    } catch (error) {
      console.error("Lỗi fetch online users:", error);
    }
  };

  const handleOpenChat = (chatUser) => {
    setOpenChats(prev => {
      const chatId = chatUser.isGroup ? `group_${chatUser.conversationId}` : chatUser.userId;
      if (prev.find(c => (c.isGroup ? `group_${c.conversationId}` : c.userId) === chatId)) return prev;
      return [...prev, chatUser];
    });
  };

  const handleCloseChat = (chatId) => {
    setOpenChats(prev => prev.filter(c => (c.isGroup ? `group_${c.conversationId}` : c.userId) !== chatId));
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (user && token) {
      const hubUrl = `${process.env.REACT_APP_API_URL || 'https://social-mini-app.onrender.com'}/chatHub`;
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token
        })
        .configureLogging(signalR.LogLevel.None)
        .withAutomaticReconnect()
        .build();

      newConnection.start()
        .then(() => {
          console.log("SignalR Connected!");
          setConnection(newConnection);
          fetchUnreadCount();
          fetchOnlineUsers();

          newConnection.on("ReceiveMessage", (senderId, content, imageUrl, createdAt) => {
            fetchUnreadCount();
            setUnreadMessageCount(prev => prev + 1);
            setUnreadCountsPerUser(prev => ({
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1
            }));

            if (window.location.pathname !== '/messaging' && senderId !== user?.userId) {
              toast.info(`Tin nhắn mới: ${content?.substring(0, 30)}${content?.length > 30 ? '...' : ''}`);
            }

          });

          newConnection.on("ReceiveWebRTCSignal", (senderId, signalString) => {
            try {
              const signalData = JSON.parse(signalString);
              handleIncomingSignal(senderId, signalData);
            } catch (e) { console.error("Lỗi parse signal:", e); }
          });

          newConnection.on("ReceiveGroupMessage", (messageId, groupId, senderId, senderName, senderAvatar, content, imageUrl, createdAt) => {
            if (senderId !== user?.userId) {
              toast.info(`Nhóm: ${content?.substring(0, 30)}${content?.length > 30 ? '...' : ''}`);
            }
          });

          newConnection.on("UserOnline", (userId) => {
            setOnlineUsers(prev => new Set([...prev, userId]));
          });

          newConnection.on("UserOffline", (userId) => {
            setOnlineUsers(prev => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
          });

          newConnection.on("WaitingInQueue", (total, matching) => {
            setQueueStats(prev => ({ ...prev, total, matching }));
          });

          newConnection.on("GlobalQueueUpdate", (global) => {
            setQueueStats(prev => ({ ...prev, global }));
          });

          newConnection.on("RandomMatchFound", (conversationId, name, partnerId) => {
            setRandomChatState({
              status: 'chatting',
              conversationId,
              partner: { userId: partnerId, fullName: name, avatarUrl: null, isAnonymous: true }
            });
            toast.success("Đã tìm thấy một người bạn mới!");
          });

          newConnection.on("IdentityRevealed", (user) => {
            setRandomChatState(prev => ({
              ...prev,
              partner: { ...user, isAnonymous: false }
            }));
            toast.success("Danh tính đã được tiết lộ!");
          });

          newConnection.on("PartnerLeft", () => {
             setRandomChatState({ status: 'idle', conversationId: null, partner: null });
             toast.info("Đối phương đã rời cuộc trò chuyện.");
          });

          newConnection.on("PartnerLiked", () => {
             setRandomChatState(prev => ({ ...prev, partnerLikedMe: true }));
             toast.info("Đối phương đã thả tim cho bạn!");
          });
        })
        .catch(err => {
          if (err.name === 'AbortError' || err.toString().includes('AbortError')) return;
          console.error("SignalR Connection Error: ", err);
        });

      return () => {
        if (newConnection) newConnection.stop();
      };
    }
  }, [user]);

  // WebRTC Logic
  const handleIncomingSignal = async (senderId, signal) => {
    if (signal.type === 'offer') {
      try {
        const usersRes = await axiosClient.get('api/user/all');
        const allUsers = usersRes?.$values || usersRes || [];
        const callerData = Array.isArray(allUsers) ? allUsers.find(u => u.userId === senderId) : null;

        setCall({
          targetUser: {
            userId: senderId,
            displayName: callerData?.fullName || callerData?.username || 'Người dùng lạ',
            avatarUrl: callerData?.avatarUrl || null
          },
          type: signal.callType,
          isIncoming: true,
          status: 'ringing',
          signal
        });
      } catch (e) {
        setCall({ targetUser: { userId: senderId }, type: signal.callType, isIncoming: true, status: 'ringing', signal });
      }
    } else if (signal.type === 'answer') {
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          processPendingCandidates();
        } catch (e) { console.error(e); }
      }
    } else if (signal.type === 'candidate') {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) { console.error(e); }
      } else {
        pendingCandidates.current.push(signal.candidate);
      }
    } else if (signal.type === 'hangup') {
      endCall(false);
    }
  };

  const processPendingCandidates = async () => {
    if (peerConnection.current && peerConnection.current.remoteDescription) {
      while (pendingCandidates.current.length > 0) {
        const candidate = pendingCandidates.current.shift();
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) { console.error(e); }
      }
    }
  };

  const startCall = async (targetUser, type = 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setLocalStream(stream);
      setCall({ targetUser, type, isIncoming: false, status: 'ringing' });

      const pc = createPeerConnection(targetUser.userId, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal(targetUser.userId, { type: 'offer', sdp: offer, callType: type });
    } catch (err) { console.error(err); }
  };

  const acceptCall = async () => {
    if (!call || !call.signal) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: call.type === 'video', audio: true });
      setLocalStream(stream);
      setCall(prev => ({ ...prev, status: 'connected' }));

      const pc = createPeerConnection(call.targetUser.userId, stream);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(call.signal.sdp));
        processPendingCandidates();
      } catch (e) { console.error(e); }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal(call.targetUser.userId, { type: 'answer', sdp: answer });
    } catch (err) { console.error(err); }
  };

  const declineCall = () => {
    if (call) sendSignal(call.targetUser.userId, { type: 'hangup' });
    endCall();
  };

  const endCall = (notify = true) => {
    if (notify && call) sendSignal(call.targetUser.userId, { type: 'hangup' });
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    pendingCandidates.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setCall(null);
  };

  const createPeerConnection = (targetUserId, stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal(targetUserId, { type: 'candidate', candidate: event.candidate });
    };
    pc.ontrack = (event) => setRemoteStream(event.streams[0]);
    peerConnection.current = pc;
    return pc;
  };

  const sendSignal = (targetUserId, signal) => {
    if (connection && connection.state === 'Connected') {
      connection.invoke("SendWebRTCSignal", targetUserId, JSON.stringify(signal))
        .catch(err => console.error("Signal error:", err));
    }
  };

  return (
    <ChatContext.Provider value={{
      connection,
      openChats,
      handleOpenChat,
      handleCloseChat,
      unreadMessageCount,
      setUnreadMessageCount,
      unreadCountsPerUser,
      setUnreadCountsPerUser,
      fetchUnreadCount,
      onlineUsers,
      randomChatState,
      setRandomChatState,
      queueStats,
      joinRandomQueue: (targetGender, minAge = 18, maxAge = 99) => connection?.invoke("JoinRandomQueue", targetGender, parseInt(minAge), parseInt(maxAge)),
      leaveRandomQueue: () => connection?.invoke("LeaveRandomQueue"),
      sendRandomHeart: (conversationId) => connection?.invoke("SendRandomHeart", conversationId),
      leaveRandomChat: (conversationId) => connection?.invoke("LeaveRandomChat", conversationId),
      call, startCall, acceptCall, declineCall, endCall, localStream, remoteStream
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};