import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

const ROW_HEIGHT = 60;
const GRID_CELL = 130;
const OVERSCAN = 8;

function StarIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#1DB954' : 'none'} stroke={filled ? '#1DB954' : '#b3b3b3'} strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function ChannelRow({ channel, isActive, isFav, isOnAir, onClick, onToggleFav }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 text-left transition-colors duration-75 rounded-md group"
      style={{
        height: ROW_HEIGHT,
        padding: '10px 12px',
        background: isActive ? '#282828' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = '#282828';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="shrink-0">
              <PlayIcon />
            </span>
          )}
          <span
            className="text-[14px] font-semibold truncate"
            style={{ color: isActive ? '#1DB954' : '#fff' }}
          >
            {channel.name}
          </span>
          {isOnAir && (
            <span
              className="shrink-0 w-2 h-2 rounded-full"
              style={{ background: '#1DB954', boxShadow: '0 0 6px rgba(29,185,84,0.6)' }}
              title="ON AIR"
            />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[12px] truncate" style={{ color: '#b3b3b3' }}>
            {channel.category || 'Uncategorized'}
          </span>
          {channel.country && (
            <>
              <span className="text-[12px]" style={{ color: '#6a6a6a' }}>·</span>
              <span className="text-[12px]" style={{ color: '#6a6a6a' }}>
                {channel.country}
              </span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className="shrink-0 p-1 bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        style={isFav ? { opacity: 1 } : {}}
        title={isFav ? 'Unfavorite' : 'Favorite'}
      >
        <StarIcon filled={isFav} />
      </button>
    </button>
  );
}

function ChannelGridCell({ channel, isActive, isFav, isOnAir, onClick, onToggleFav }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 rounded-lg transition-colors duration-100 group relative"
      style={{
        width: GRID_CELL,
        height: GRID_CELL,
        background: isActive ? '#282828' : '#181818',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = '#282828';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = '#181818';
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-bold mb-2"
        style={{ background: '#333', color: '#1DB954' }}
      >
        {channel.name.charAt(0)}
      </div>
      <span
        className="text-[12px] font-semibold text-center truncate w-full leading-tight"
        style={{ color: isActive ? '#1DB954' : '#fff' }}
      >
        {channel.name}
      </span>
      <span className="text-[10px] text-center truncate w-full" style={{ color: '#b3b3b3' }}>
        {channel.category || 'Uncategorized'}
      </span>
      {isOnAir && (
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{ background: '#1DB954', boxShadow: '0 0 6px rgba(29,185,84,0.6)' }}
        />
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className="absolute top-2 left-2 p-0 bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        style={isFav ? { opacity: 1 } : {}}
      >
        <StarIcon filled={isFav} />
      </button>
    </button>
  );
}

export default function ChannelRack({
  channels,
  currentChannel,
  isFavorite,
  onToggleFavorite,
  onSelectChannel,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  onAirChannels,
  gridView,
  onToggleGridView,
  loading,
  isStacked,
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);

  const categories = useMemo(() => {
    const cats = new Set(channels.map(c => c.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [channels]);

  const filteredChannels = useMemo(() => {
    let list = channels;
    if (showFavoritesOnly) list = list.filter(c => isFavorite(c.id));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q));
    }
    if (selectedCategory !== 'All') list = list.filter(c => c.category === selectedCategory);
    return list;
  }, [channels, search, selectedCategory, showFavoritesOnly, isFavorite]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [search, selectedCategory, showFavoritesOnly]);

  const rowHeight = gridView ? GRID_CELL + 8 : ROW_HEIGHT;
  const totalHeight = filteredChannels.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const endIndex = Math.min(filteredChannels.length, Math.ceil((scrollTop + containerHeight) / rowHeight) + OVERSCAN);
  const visibleChannels = filteredChannels.slice(startIndex, endIndex);

  const handleScroll = useCallback((e) => setScrollTop(e.target.scrollTop), []);

  return (
    <div
      className="flex flex-col"
      style={{
        width: '100%',
        height: '100%',
        maxWidth: isStacked ? '100%' : 340,
        background: '#121212',
        borderRight: isStacked ? 'none' : '1px solid #282828',
        ...(isStacked ? { borderTop: '1px solid #282828' } : {}),
        overflow: 'hidden',
      }}
    >
      <div className="shrink-0" style={{ padding: '16px 20px 0' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-bold" style={{ color: '#fff' }}>Channels</h2>
          <button
            onClick={onToggleGridView}
            className="p-2 rounded-full transition-colors"
            style={{ background: 'transparent', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
            title={gridView ? 'List view' : 'Grid view'}
          >
            {gridView ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            )}
          </button>
        </div>

        <div
          className="flex items-center gap-2 rounded-full"
          style={{ background: '#282828', padding: '10px 16px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" strokeWidth="2" className="shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[13px]"
            style={{ color: '#fff', fontFamily: 'inherit', paddingLeft: 4 }}
          />
        </div>
      </div>

      <div
        className="shrink-0 flex gap-2"
        style={{
          padding: '12px 20px',
          overflowX: 'auto',
          overflowY: 'hidden',
          minWidth: 0,
          width: '100%',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={onToggleFavoritesOnly}
          className="shrink-0 rounded-full text-[12px] font-semibold transition-colors"
          style={{
            background: showFavoritesOnly ? '#1DB954' : '#282828',
            color: showFavoritesOnly ? '#000' : '#fff',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 14px',
          }}
        >
          Favorites
        </button>
        {categories.slice(0, 20).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="shrink-0 rounded-full text-[12px] font-medium transition-colors"
            style={{
              background: selectedCategory === cat ? '#1DB954' : '#282828',
              color: selectedCategory === cat ? '#000' : '#fff',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 14px',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative"
        style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '0 8px 8px' }}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="py-6 text-center text-[13px] font-medium" style={{ color: '#6a6a6a' }}>
            Loading channels...
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="py-6 text-center text-[13px] font-medium" style={{ color: '#6a6a6a' }}>
            No channels found
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            {visibleChannels.map((channel, i) => (
              <div
                key={channel.id}
                style={{
                  position: 'absolute',
                  top: (startIndex + i) * rowHeight,
                  left: 0,
                  right: 0,
                }}
              >
                {gridView ? (
                  <ChannelGridCell
                    channel={channel}
                    isActive={currentChannel?.id === channel.id}
                    isFav={isFavorite(channel.id)}
                    isOnAir={onAirChannels?.has(channel.id)}
                    onClick={() => onSelectChannel(channel)}
                    onToggleFav={() => onToggleFavorite(channel.id)}
                  />
                ) : (
                  <ChannelRow
                    channel={channel}
                    isActive={currentChannel?.id === channel.id}
                    isFav={isFavorite(channel.id)}
                    isOnAir={onAirChannels?.has(channel.id)}
                    onClick={() => onSelectChannel(channel)}
                    onToggleFav={() => onToggleFavorite(channel.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="shrink-0 text-[11px]"
        style={{ color: '#6a6a6a', borderTop: '1px solid #282828', padding: '8px 20px' }}
      >
        {filteredChannels.length.toLocaleString()} channels
      </div>
    </div>
  );
}
