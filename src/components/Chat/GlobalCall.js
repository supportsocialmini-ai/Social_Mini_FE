import React from 'react';
import { useChat } from '../../context/ChatContext';
import CallModal from './CallModal';

const GlobalCall = () => {
  const { 
    call, acceptCall, declineCall, endCall, 
    localStream, remoteStream 
  } = useChat();

  if (!call) return null;

  return (
    <CallModal 
      isOpen={!!call}
      type={call?.type}
      targetUser={call?.targetUser}
      isIncoming={call?.isIncoming}
      onHangup={endCall}
      onAccept={acceptCall}
      onDecline={declineCall}
      localStream={localStream}
      remoteStream={remoteStream}
    />
  );
};

export default GlobalCall;
