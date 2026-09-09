import { useState, useEffect, useCallback } from 'react';
import VideoPlayer from './components/VideoPlayer';
import ChannelRack from './components/ChannelRack';
import NowPlayingBar from './components/NowPlayingBar';
import { useChannels } from './hooks/useChannels';
import { useFavorites } from './hooks/useFavorites';
import { usePlayer } from './hooks/usePlayer';

const BREAKPOINT = 768;

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
  const [onAirChannels, setOnAirChannels] = useState(new Set());
  const [gridView, setGridView] = useState(false);
  const [isStacked, setIsStacked] = useState(window.innerWidth < BREAKPOINT);

  useEffect(() => {
    const onResize = () => setIsStacked(window.innerWidth < BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const markOnAir = useCallback((channelId) => {
    setOnAirChannels(prev => new Set([...prev, channelId]));
  }, []);

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
    <div className="h-full flex flex-col overflow-hidden">
      {error && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-[13px] fade-in bg-red-900/90 text-white">
          {error}
        </div>
      )}

      <div
        className="flex-1 overflow-hidden"
        style={{
          display: 'flex',
          flexDirection: isStacked ? 'column' : 'row',
        }}
      >
        {isStacked ? (
          <>
            <div
              style={{
                flex: '0 0 auto',
                minHeight: 0,
                width: '100%',
                aspectRatio: '16 / 9',
                maxHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              <VideoPlayer
                channel={currentChannel}
                onError={handleError}
                onReconnect={handleReconnect}
                onMarkOnAir={markOnAir}
                reconnectAttempt={reconnectAttempt}
                channelCount={channels.length}
                loadingCount={loading}
                onRefresh={refetch}
                showSidebar={showSidebar}
                onToggleSidebar={() => setShowSidebar(s => !s)}
              />
            </div>

            {showSidebar && (
              <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                <ChannelRack
                  channels={channels}
                  currentChannel={currentChannel}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onSelectChannel={handleSelectChannel}
                  showFavoritesOnly={showFavoritesOnly}
                  onToggleFavoritesOnly={() => setShowFavoritesOnly(f => !f)}
                  onAirChannels={onAirChannels}
                  gridView={gridView}
                  onToggleGridView={() => setGridView(g => !g)}
                  loading={loading}
                  isStacked
                />
              </div>
            )}
          </>
        ) : (
          <>
            {showSidebar && (
              <ChannelRack
                channels={channels}
                currentChannel={currentChannel}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onSelectChannel={handleSelectChannel}
                showFavoritesOnly={showFavoritesOnly}
                onToggleFavoritesOnly={() => setShowFavoritesOnly(f => !f)}
                onAirChannels={onAirChannels}
                gridView={gridView}
                onToggleGridView={() => setGridView(g => !g)}
                loading={loading}
                isStacked={false}
              />
            )}

            <VideoPlayer
              channel={currentChannel}
              onError={handleError}
              onReconnect={handleReconnect}
              onMarkOnAir={markOnAir}
              reconnectAttempt={reconnectAttempt}
              channelCount={channels.length}
              loadingCount={loading}
              onRefresh={refetch}
              showSidebar={showSidebar}
              onToggleSidebar={() => setShowSidebar(s => !s)}
            />
          </>
        )}
      </div>

      <NowPlayingBar
        channel={currentChannel}
        isOnAir={currentChannel ? onAirChannels.has(currentChannel.id) : false}
        onToggleSidebar={() => setShowSidebar(s => !s)}
        showSidebar={showSidebar}
      />
    </div>
  );
}
