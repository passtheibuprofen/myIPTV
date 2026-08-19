const CACHE_KEY = 'iptvme_channel_cache';
const CACHE_TTL = 30 * 60 * 1000;

export function parseM3U(playlistText) {
  const lines = playlistText.split('\n');
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF:')) continue;

    const meta = parseExtInf(line);
    const urlLine = lines[i + 1]?.trim();
    if (urlLine && !urlLine.startsWith('#')) {
      channels.push({
        id: meta.tvgId || `ch-${channels.length}`,
        name: meta.name || 'Unknown Channel',
        logo: meta.logo || '',
        category: meta.category || 'Uncategorized',
        country: extractCountry(meta.tvgId, meta.category, meta.name),
        url: urlLine,
      });
    }
  }

  return channels;
}

function parseExtInf(line) {
  const result = {
    tvgId: '',
    tvgLogo: '',
    category: '',
    name: '',
  };

  const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
  if (tvgIdMatch) result.tvgId = tvgIdMatch[1];

  const logoMatch = line.match(/tvg-logo="([^"]*)"/);
  if (logoMatch) result.tvgLogo = logoMatch[1];

  const groupMatch = line.match(/group-title="([^"]*)"/);
  if (groupMatch) result.category = groupMatch[1];

  const nameMatch = line.match(/,\s*(.+)$/);
  if (nameMatch) result.name = nameMatch[1].trim();

  result.logo = result.tvgLogo;
  result.name = result.name;

  return result;
}

function extractCountry(tvgId, category, name) {
  if (tvgId && tvgId.includes('.')) {
    const parts = tvgId.split('.');
    if (parts[0] && parts[0].length === 2) {
      return parts[0].toUpperCase();
    }
  }

  const combined = `${category} ${name}`.toLowerCase();
  const countryPatterns = [
    /\b(usa|united states|america)\b/i, /\b(uk|united kingdom|britain|england)\b/i,
    /\b(canada)\b/i, /\b(australia)\b/i, /\b(germany|deutschland|deu)\b/i,
    /\b(france|france)\b/i, /\b(spain|espana|esp)\b/i, /\b(italy|italia|ita)\b/i,
    /\b(brazil|brasil|bra)\b/i, /\b(mexico|mex)\b/i, /\b(india|ind)\b/i,
    /\b(japan|jpn)\b/i, /\b(china|chn)\b/i, /\b(korea|kor)\b/i,
    /\b(russia|rus)\b/i, /\b(portugal|prt)\b/i, /\b(netherlands|nederland|nld)\b/i,
    /\b(turkey|turkiye|tur)\b/i, /\b(poland|polska|pol)\b/i,
    /\b(arabic|arab|saudi|dubai)\b/i, /\b(latin|latino)\b/i,
    /\b(africa|afr)\b/i, /\b(indonesia|idn)\b/i, /\b(thailand|tha)\b/i,
  ];

  for (const pattern of countryPatterns) {
    const match = combined.match(pattern);
    if (match) {
      const raw = match[1].toLowerCase();
      const map = {
        'usa': 'US', 'united states': 'US', 'america': 'US',
        'uk': 'UK', 'united kingdom': 'UK', 'britain': 'UK', 'england': 'UK',
        'canada': 'CA', 'australia': 'AU', 'germany': 'DE', 'deutschland': 'DE',
        'france': 'FR', 'spain': 'ES', 'espana': 'ES', 'italy': 'IT', 'italia': 'IT',
        'brazil': 'BR', 'brasil': 'BR', 'mexico': 'MX', 'india': 'IN',
        'japan': 'JP', 'china': 'CN', 'korea': 'KR', 'russia': 'RU',
        'portugal': 'PT', 'netherlands': 'NL', 'nederland': 'NL',
        'turkey': 'TR', 'turkiye': 'TR', 'poland': 'PL', 'polska': 'PL',
        'arabic': 'AR', 'arab': 'AR', 'saudi': 'SA', 'dubai': 'AE',
        'latin': 'LATAM', 'latino': 'LATAM',
        'africa': 'AF', 'indonesia': 'ID', 'thailand': 'TH',
      };
      return map[raw] || raw.toUpperCase();
    }
  }

  return '';
}

export function getCachedChannels() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data.channels;
  } catch {
    return null;
  }
}

export function setCachedChannels(channels) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      channels,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage might be full — silently fail
  }
}
