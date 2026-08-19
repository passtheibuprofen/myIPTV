import { useState, useEffect, useCallback } from 'react';
import VideoPlayer from './components/VideoPlayer';
import ChannelRack from './components/ChannelRack';
import { useChannels } from './hooks/useChannels';
import { useFavorites } from './hooks/useFavorites';
import { usePlayer } from './hooks/usePlayer';

export default function App() {
  const { channels, loading, error, refetch } = useChannels();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const {
    currentChannel,
    reconnectAttempt,
    playChannel,
    handleError,
    handleReconnect,
  } = usePlayer();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleSelectChannel = useCallback((channel) => {
    playChannel(channel);
  }, [playChannel]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const idx = channels.findIndex(c => c.id === currentChannel?.id);
        const next = channels[idx + 1];
        if (next) playChannel(next);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const idx = channels.findIndex(c => c.id === currentChannel?.id);
        const prev = channels[idx - 1];
        if (prev) playChannel(prev);
      } else if (e.key === 'Escape') {
        const vid = document.querySelector('video');
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (vid && !vid.paused) {
          vid.pause();
        }
      } else if (e.key === 'm') {
        const vid = document.querySelector('video');
        if (vid) vid.muted = !vid.muted;
      } else if (e.key === 'f') {
        const container = document.querySelector('video')?.parentElement;
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          container?.requestFullscreen?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [channels, currentChannel, playChannel]);

  return (
    <div className="h-full flex overflow-hidden">
      {error && (
        <div
          className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-[12px] fade-in"
          style={{ color: 'var(--color-danger)', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-danger)' }}
        >
          ERR: {error}
        </div>
      )}

      <VideoPlayer
        channel={currentChannel}
        onError={handleError}
        onReconnect={handleReconnect}
        reconnectAttempt={reconnectAttempt}
        channelCount={channels.length}
        loadingCount={loading}
        onRefresh={refetch}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(s => !s)}
      />
      {showSidebar && (
        <ChannelRack
          channels={channels}
          currentChannel={currentChannel}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          onSelectChannel={handleSelectChannel}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesOnly={() => setShowFavoritesOnly(f => !f)}
        />
      )}
    </div>
  );
}
