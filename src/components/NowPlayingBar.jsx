export default function NowPlayingBar({ channel, isOnAir, onToggleSidebar, showSidebar }) {
  return (
    <div
      className="shrink-0 flex items-center"
      style={{
        height: 64,
        background: '#181818',
        borderTop: '1px solid #282828',
        padding: '0 20px',
      }}
    >
      {channel ? (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded flex items-center justify-center text-[16px] font-bold shrink-0"
            style={{ background: '#333', color: '#1DB954' }}
          >
            {channel.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: '#fff' }}>
              {channel.name}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] truncate" style={{ color: '#b3b3b3' }}>
                {channel.category || 'Uncategorized'}
              </span>
              {isOnAir && (
                <span className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#1DB954', boxShadow: '0 0 4px rgba(29,185,84,0.6)' }}
                  />
                  <span className="text-[10px] font-bold uppercase" style={{ color: '#1DB954' }}>
                    ON AIR
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <p className="text-[13px]" style={{ color: '#6a6a6a' }}>No channel selected</p>
        </div>
      )}

      <button
        onClick={onToggleSidebar}
        className="shrink-0 p-2 rounded-full transition-colors"
        style={{ background: 'transparent', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
        title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {showSidebar ? (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
            </>
          ) : (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
