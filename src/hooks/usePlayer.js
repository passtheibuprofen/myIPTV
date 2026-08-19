import { useState, useCallback, useEffect } from 'react';

export function usePlayer() {
  const [currentChannel, setCurrentChannel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const playChannel = useCallback((channel) => {
    setCurrentChannel(channel);
    setPlayerError(null);
    setReconnectAttempt(0);
    setIsPlaying(true);
  }, []);

  const handleError = useCallback((errorMsg) => {
    setPlayerError(errorMsg);
    setIsPlaying(false);
  }, []);

  const handleReconnect = useCallback(() => {
    setReconnectAttempt(prev => {
      if (prev >= 2) {
        setPlayerError('Stream unavailable after multiple attempts');
        setIsPlaying(false);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const stopPlayback = useCallback(() => {
    setCurrentChannel(null);
    setIsPlaying(false);
    setPlayerError(null);
    setReconnectAttempt(0);
  }, []);

  return {
    currentChannel,
    isPlaying,
    playerError,
    reconnectAttempt,
    playChannel,
    handleError,
    handleReconnect,
    stopPlayback,
  };
}
