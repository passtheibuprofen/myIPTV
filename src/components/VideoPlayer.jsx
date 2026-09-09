import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';

function PillButton({ children, onClick, active, disabled, title, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${className}`}
      style={{
        background: active ? '#1DB954' : 'rgba(255,255,255,0.1)',
        color: active ? '#000' : '#fff',
        border: 'none',
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        minWidth: 40,
        minHeight: 36,
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
      }}
    >
      {children}
    </button>
  );
}

export default function VideoPlayer({
  channel,
  onError,
  onReconnect,
  onMarkOnAir,
  reconnectAttempt,
  channelCount,
  loadingCount,
  onRefresh,
  showSidebar,
  onToggleSidebar,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef(null);
  const [showVolSlider, setShowVolSlider] = useState(false);
  const volTimeout = useRef(null);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
  }, []);

  useEffect(() => {
    if (!channel || !videoRef.current) return;
    const video = videoRef.current;
    destroyHls();
    setLoading(true);
    setError(null);
    setIsPlaying(false);

    const url = channel.url;
    const isHls = url.includes('.m3u8') || url.includes('m3u8');

    const onManifestLoaded = () => {
      setLoading(false);
      onMarkOnAir?.(channel.id);
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60, startFragPrefetch: true, debug: false });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, onManifestLoaded);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (reconnectAttempt < 2) { onReconnect?.(); setTimeout(() => hls.startLoad(), 2000); }
              else { setError('Network error — stream may be offline'); setLoading(false); onError?.('Network error'); }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (reconnectAttempt < 2) { onReconnect?.(); hls.recoverMediaError(); }
              else { setError('Media error — stream corrupted'); setLoading(false); onError?.('Media error'); }
              break;
            default:
              setError('Stream unavailable'); setLoading(false); onError?.('Fatal error'); break;
          }
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', onManifestLoaded, { once: true });
      video.addEventListener('error', () => { setError('Native HLS error'); setLoading(false); onError?.('Native HLS error'); }, { once: true });
    } else {
      video.src = url;
      video.addEventListener('canplay', onManifestLoaded, { once: true });
      video.addEventListener('error', () => { setError('Stream unsupported or offline'); setLoading(false); onError?.('Playback error'); }, { once: true });
    }
    return destroyHls;
  }, [channel, reconnectAttempt, destroyHls, onError, onReconnect, onMarkOnAir]);

  useEffect(() => { if (videoRef.current) videoRef.current.volume = isMuted ? 0 : volume; }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().then(() => setIsPlaying(true)).catch(() => {});
    else { v.pause(); setIsPlaying(false); }
  }, []);

  const handleVolEnter = useCallback(() => { clearTimeout(volTimeout.current); setShowVolSlider(true); }, []);
  const handleVolLeave = useCallback(() => { volTimeout.current = setTimeout(() => setShowVolSlider(false), 400); }, []);
  const toggleMute = useCallback(() => setIsMuted(m => !m), []);

  const toggleFullscreen = useCallback(() => {
    const c = videoRef.current?.parentElement;
    if (!c) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else c.requestFullscreen?.();
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  }, [isPlaying]);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="text-center fade-in">
          <div className="text-[48px] mb-4" style={{ color: '#333' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <h2 className="text-[22px] font-bold mb-2" style={{ color: '#fff' }}>IPTVme</h2>
          <p className="text-[14px]" style={{ color: '#b3b3b3' }}>Select a channel to start watching</p>
          <p className="text-[12px] mt-1" style={{ color: '#6a6a6a' }}>Use arrow keys or click to browse</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 relative overflow-hidden"
      style={{ background: '#000' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video ref={videoRef} className="w-full h-full object-contain" onClick={togglePlay} playsInline />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="text-center fade-in">
            <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#535353', borderTopColor: '#1DB954' }} />
            <p className="text-[14px] font-semibold" style={{ color: '#fff' }}>{channel.name}</p>
            <p className="text-[12px] mt-1" style={{ color: '#b3b3b3' }}>Connecting...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="text-center max-w-md px-8 fade-in">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,50,50,0.1)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff3232" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-[15px] font-bold mb-1" style={{ color: '#fff' }}>{error}</p>
            <p className="text-[13px] mb-3" style={{ color: '#b3b3b3' }}>{channel.name}</p>
            <button
              onClick={onRefresh}
              className="rounded-full px-5 py-2 text-[13px] font-semibold"
              style={{ background: '#1DB954', color: '#000', border: 'none', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '20px 16px 14px' }}
      >
        <div className="flex items-center gap-3">
          <PillButton onClick={togglePlay}>
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </PillButton>

          <div
            className="flex items-center gap-2"
            onMouseEnter={handleVolEnter}
            onMouseLeave={handleVolLeave}
          >
            <PillButton onClick={toggleMute}>
              {isMuted || volume === 0 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume <= 0.5 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </PillButton>
            {showVolSlider && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                style={{ width: 80 }}
              />
            )}
          </div>

          <div className="flex-1 text-center">
            <span className="text-[14px] font-bold" style={{ color: '#fff' }}>{channel.name}</span>
          </div>

          <PillButton onClick={toggleFullscreen}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </PillButton>
        </div>
      </div>
    </div>
  );
}
