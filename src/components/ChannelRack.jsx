import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import ToolbarButton from './ToolbarButton';

const ROW_HEIGHT = 40;
const OVERSCAN = 10;

function ChannelRow({ channel, isActive, isFav, onClick, onToggleFav }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-0 text-left transition-colors duration-75"
      style={{
        height: ROW_HEIGHT,
        background: isActive ? 'var(--color-accent)' : 'transparent',
        color: isActive ? 'var(--color-bg)' : 'var(--color-text)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--color-accent-dim)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span
        className="shrink-0 w-8 text-center text-[13px]"
        style={{
          color: isActive ? 'var(--color-bg)' : isFav ? 'var(--color-accent)' : 'var(--color-text-dim)',
          textShadow: isFav && !isActive ? '0 0 5px rgba(51,255,0,0.5)' : 'none',
        }}
      >
        {isActive ? '>' : isFav ? '*' : ' '}
      </span>

      <span
        className="shrink-0 w-8 text-center text-[11px]"
        style={{ color: isActive ? 'var(--color-bg)' : 'var(--color-text-dim)' }}
      >
        {channel.country || ''}
      </span>

      <span
        className="flex-1 truncate text-[13px] px-2"
        style={{
          color: isActive ? 'var(--color-bg)' : 'var(--color-text)',
          textShadow: isActive ? 'none' : '0 0 4px rgba(51,255,0,0.2)',
        }}
      >
        {channel.name}
      </span>

      <span
        className="shrink-0 text-[11px] px-3 truncate max-w-[140px]"
        style={{ color: isActive ? 'var(--color-bg)' : 'var(--color-text-dim)' }}
      >
        {channel.category || ''}
      </span>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className="shrink-0 w-8 text-center text-[13px] cursor-pointer bg-transparent border-none"
        style={{
          color: isActive ? 'var(--color-bg)' : isFav ? 'var(--color-accent)' : 'var(--color-text-dim)',
          textShadow: isFav && !isActive ? '0 0 5px rgba(51,255,0,0.5)' : 'none',
        }}
        title={isFav ? 'Unfavorite' : 'Favorite'}
      >
        {isFav ? '*' : '·'}
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
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [scrollTop, setScrollTop] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);

  const categories = useMemo(() => {
    const cats = new Set(channels.map(c => c.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [channels]);

  const countries = useMemo(() => {
    const co = new Set(channels.map(c => c.country).filter(Boolean));
    return ['All', ...Array.from(co).sort()];
  }, [channels]);

  const filteredChannels = useMemo(() => {
    let list = channels;
    if (showFavoritesOnly) list = list.filter(c => isFavorite(c.id));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    if (selectedCategory !== 'All') list = list.filter(c => c.category === selectedCategory);
    if (selectedCountry !== 'All') list = list.filter(c => c.country === selectedCountry);
    return list;
  }, [channels, search, selectedCategory, selectedCountry, showFavoritesOnly, isFavorite]);

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  const totalHeight = filteredChannels.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(filteredChannels.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  const visibleChannels = filteredChannels.slice(startIndex, endIndex);

  const handleScroll = useCallback((e) => setScrollTop(e.target.scrollTop), []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [search, selectedCategory, selectedCountry, showFavoritesOnly]);

  return (
    <div
      className="shrink-0 flex flex-col overflow-hidden fade-in"
      style={{ width: 400, borderLeft: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
    >
      <div style={{ borderBottom: '1px solid var(--color-border)', padding: '12px 14px' }}>
        <div className="flex items-center gap-4">
          <ToolbarButton
            icon="/"
            active={showSearch}
            onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch(''); }}
            title="Search"
          />
          <ToolbarButton
            icon="+"
            active={showFilters}
            onClick={() => setShowFilters(s => !s)}
            title="Filters"
          />
          <ToolbarButton
            icon="*"
            active={showFavoritesOnly}
            onClick={onToggleFavoritesOnly}
            title="Favorites"
          />

          <span className="flex-1" />

          <span className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
            {filteredChannels.length.toLocaleString()}
          </span>
        </div>

        {showSearch && (
          <div className="flex items-center gap-2 mt-5">
            <span className="text-[13px]" style={{ color: 'var(--color-accent)' }}>$</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="search_"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="term-input flex-1"
              style={{ fontSize: 13, padding: '7px 10px' }}
            />
          </div>
        )}

        {showFilters && (
          <div className="flex gap-3 mt-5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="term-select flex-1 min-w-0"
              style={{ padding: '6px 8px' }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="term-select"
              style={{ padding: '6px 8px', width: 80 }}
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        {filteredChannels.length === 0 ? (
          <div className="p-6 text-center text-[13px]" style={{ color: 'var(--color-text-dim)' }}>
            {showFavoritesOnly ? 'no favorites' : 'no results'}
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            {visibleChannels.map((channel, i) => (
              <div
                key={channel.id}
                style={{ position: 'absolute', top: (startIndex + i) * ROW_HEIGHT, left: 0, right: 0 }}
              >
                <ChannelRow
                  channel={channel}
                  isActive={currentChannel?.id === channel.id}
                  isFav={isFavorite(channel.id)}
                  onClick={() => onSelectChannel(channel)}
                  onToggleFav={() => onToggleFavorite(channel.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
