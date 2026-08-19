import { useState, useEffect, useCallback } from 'react';
import { parseM3U, getCachedChannels, setCachedChannels } from '../utils/m3uParser';

const PLAYLIST_URL = 'https://iptv-org.github.io/iptv/index.m3u';

export function useChannels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);

    const cached = getCachedChannels();
    if (cached && cached.length > 0) {
      setChannels(cached);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(PLAYLIST_URL);
      if (!res.ok) throw new Error(`Failed to fetch playlist: ${res.status}`);
      const text = await res.text();
      const parsed = parseM3U(text);

      if (parsed.length === 0) {
        throw new Error('No channels found in playlist');
      }

      setChannels(parsed);
      setCachedChannels(parsed);
    } catch (err) {
      setError(err.message || 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return { channels, loading, error, refetch: fetchChannels };
}
