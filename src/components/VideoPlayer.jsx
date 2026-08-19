import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import ToolbarButton from './ToolbarButton';

export default function VideoPlayer({
  channel,
  onError,
  onReconnect,
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

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60, startFragPrefetch: true, debug: false });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); video.play().then(() => setIsPlaying(true)).catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (reconnectAttempt < 2) { onReconnect?.(); setTimeout(() => hls.startLoad(), 2000); }
              else { setError('NETWORK_ERROR: stream offline or CORS blocked'); setLoading(false); onError?.('Network error'); }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (reconnectAttempt < 2) { onReconnect?.(); hls.recoverMediaError(); }
              else { setError('MEDIA_ERROR: stream corrupted'); setLoading(false); onError?.('Media error'); }
              break;
            default:
              setError('FATAL: stream unavailable'); setLoading(false); onError?.('Fatal error'); break;
          }
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => { setLoading(false); video.play().then(() => setIsPlaying(true)).catch(() => {}); }, { once: true });
      video.addEventListener('error', () => { setError('STREAM_FAIL: native HLS error'); setLoading(false); onError?.('Native HLS error'); }, { once: true });
    } else {
      video.src = url;
      video.addEventListener('canplay', () => { setLoading(false); video.play().then(() => setIsPlaying(true)).catch(() => {}); }, { once: true });
      video.addEventListener('error', () => { setError('STREAM_FAIL: unsupported or offline'); setLoading(false); onError?.('Playback error'); }, { once: true });
    }
    return destroyHls;
  }, [channel, reconnectAttempt, destroyHls, onError, onReconnect]);

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
      <div className="flex-1 flex items-center justify-center relative" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center fade-in">
          <pre className="text-[14px] glow-strong leading-tight" style={{ color: 'var(--color-text)' }}>
{`    ___________
   /           \\
  |  IPTVme    |
  |  ________  |
  | |        | |
  | |  []    | |
  | |________| |
  |____________|
      ||||
      ||||`}
          </pre>
          <p className="text-[12px] mt-4" style={{ color: 'var(--color-text-dim)' }}>SELECT A CHANNEL TO BEGIN</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-dim)' }}>USE ARROW KEYS OR CLICK TO NAVIGATE</p>
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-3 z-10">
          {!loadingCount && <span className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>[{channelCount.toLocaleString()}]</span>}
          <ToolbarButton icon="//" onClick={onRefresh} disabled={loadingCount} title="Refresh channels" />
          <ToolbarButton icon="[↗]" onClick={toggleFullscreen} title="Fullscreen" />
          <ToolbarButton
            icon={showSidebar ? '>>' : '<<'}
            onClick={onToggleSidebar}
            title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
          />
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
      <video ref={videoRef} className="w-full h-full object-contain bg-black" onClick={togglePlay} playsInline />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="text-center">
            <div className="text-[14px] glow mb-3">{'>'}CONNECTING TO {channel.name}...</div>
            <div className="text-[12px] glow" style={{ color: 'var(--color-accent)' }}>ON AIR</div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div className="text-center max-w-md px-8 fade-in">
            <pre className="text-[12px] mb-3" style={{ color: 'var(--color-danger)' }}>
{`╔══════════════════════════╗
║       STREAM ERROR      ║
╚══════════════════════════╝`}
            </pre>
            <p className="text-[13px] glow mb-2" style={{ color: 'var(--color-danger)' }}>{error}</p>
            <p className="text-[12px]" style={{ color: 'var(--color-text-dim)' }}>{channel.name}</p>
            <p className="text-[11px] mt-2" style={{ color: 'var(--color-text-dim)' }}>POSSIBLE CAUSES: CORS / MIXED CONTENT / OFFLINE</p>
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '24px 16px 14px' }}
      >
        <div className="flex items-center gap-3">
          <ToolbarButton icon={isPlaying ? '||' : '>'} onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'} />

          <div
            className="flex items-center gap-2"
            onMouseEnter={handleVolEnter}
            onMouseLeave={handleVolLeave}
          >
            <ToolbarButton
              icon={isMuted || volume === 0 ? 'X' : volume <= 0.3 ? '-' : '='}
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            />
            {showVolSlider && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                className="vol-slider"
                style={{ width: 80 }}
              />
            )}
          </div>

          <div className="flex-1 text-center">
            <span className="text-[13px] font-bold glow" style={{ color: 'var(--color-accent)' }}>{channel.name}</span>
            {channel.category && (
              <span className="text-[11px] ml-3" style={{ color: 'var(--color-text-dim)' }}>[{channel.category}]</span>
            )}
          </div>

        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-3 z-10">
        {!loadingCount && <span className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>[{channelCount.toLocaleString()}]</span>}
        <ToolbarButton icon="//" onClick={onRefresh} disabled={loadingCount} title="Refresh channels" />
        <ToolbarButton icon="[↗]" onClick={toggleFullscreen} title="Fullscreen" />
        <ToolbarButton
          icon={showSidebar ? '>>' : '<<'}
          onClick={onToggleSidebar}
          title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
        />
      </div>
    </div>
  );
}
