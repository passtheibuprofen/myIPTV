import { useState, useCallback, useRef } from 'react';

const FAVORITES_KEY = 'iptvme_favorites';

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(favs) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites);
  const favSet = useRef(new Set(favorites));

  const toggleFavorite = useCallback((channelId) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      const arr = [...next];
      favSet.current = next;
      saveFavorites(arr);
      return arr;
    });
  }, []);

  const isFavorite = useCallback((channelId) => {
    return favSet.current.has(channelId);
  }, []);

  return { favorites, toggleFavorite, isFavorite };
}
