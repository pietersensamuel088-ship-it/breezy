import { Song } from '../types';
import { getStreamUrl } from '../mockData';

/**
 * Calculates Levenshtein Distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let i = 0; i <= an; i++) matrix[0][i] = i;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Calculates string similarity score between 0.0 and 1.0
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Smart fuzzy search for local song library with typo tolerance
 */
export function fuzzySearchSongs(query: string, songs: Song[]): {
  matches: Song[];
  didYouMean: string | null;
} {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) {
    return { matches: [], didYouMean: null };
  }

  const queryWords = cleanQuery.split(/\s+/).filter(Boolean);

  let bestSuggestionText: string | null = null;
  let bestSuggestionScore = 0;

  for (const song of songs) {
    const titleSim = stringSimilarity(cleanQuery, song.title);
    const artistSim = stringSimilarity(cleanQuery, song.artist);
    if (titleSim > 0.55 && titleSim > bestSuggestionScore) {
      bestSuggestionText = song.title;
      bestSuggestionScore = titleSim;
    }
    if (artistSim > 0.55 && artistSim > bestSuggestionScore) {
      bestSuggestionText = song.artist;
      bestSuggestionScore = artistSim;
    }
  }

  const scoredSongs = songs.map((song) => {
    const titleLower = song.title.toLowerCase();
    const artistLower = song.artist.toLowerCase();
    const albumLower = (song.album || '').toLowerCase();
    const fullText = `${titleLower} ${artistLower} ${albumLower}`;

    let score = 0;

    // 1. Exact phrase matches (highest boost)
    if (fullText.includes(cleanQuery)) {
      score += 100;
    }

    // 2. Word-by-word token matching
    for (const word of queryWords) {
      if (fullText.includes(word)) {
        score += 30;
      } else {
        // Check partial typo in individual words
        const allTargetWords = fullText.split(/\s+/);
        let maxWordSim = 0;
        for (const tw of allTargetWords) {
          const sim = stringSimilarity(word, tw);
          if (sim > maxWordSim) maxWordSim = sim;
        }
        if (maxWordSim >= 0.65) {
          score += Math.round(maxWordSim * 25);
        }
      }
    }

    return { song, score };
  });

  // Filter out non-relevant results and sort by highest score
  const matches = scoredSongs
    .filter((item) => item.score >= 20)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.song);

  // If exact match was found, we don't need a "Did you mean"
  const hasExact = matches.some(
    (m) =>
      m.title.toLowerCase() === cleanQuery ||
      m.artist.toLowerCase() === cleanQuery
  );

  const didYouMean = !hasExact && bestSuggestionText && bestSuggestionScore >= 0.6
    ? bestSuggestionText
    : null;

  return { matches, didYouMean };
}

/**
 * Public Cloud Music Search API (iTunes / Apple Music)
 * - Free, instant, official studio artwork & auto-corrects typos
 */
export async function searchCloudMusic(query: string, signal?: AbortSignal): Promise<{
  songs: Song[];
  correctedTerm?: string;
}> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return { songs: [] };

  try {
    const encoded = encodeURIComponent(cleanQuery);
    const url = `https://itunes.apple.com/search?term=${encoded}&entity=song&limit=12`;

    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return { songs: [] };

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return { songs: [] };

    const cloudSongs: Song[] = data.results.map((track: any, index: number) => {
      // High-res studio artwork
      const cover = track.artworkUrl100
        ? track.artworkUrl100.replace('100x100bb', '600x600bb')
        : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

      const durationSec = track.trackTimeMillis ? Math.round(track.trackTimeMillis / 1000) : 180;
      const releaseYear = track.releaseDate ? new Date(track.releaseDate).getFullYear() : 2023;
      const title = track.trackName || 'Unknown Title';
      const artist = track.artistName || 'Unknown Artist';
      const album = track.collectionName || 'Single / Master';
      const trackId = `itunes-${track.trackId || index}`;

      // Palette accent based on artist
      const accent = artist.toLowerCase().includes('drake') ? '#fbbf24' : '#3b82f6';

      return {
        id: trackId,
        title,
        artist,
        album,
        coverUrl: cover,
        duration: durationSec,
        audioUrl: track.previewUrl || getStreamUrl(trackId, title, artist),
        bitrate: 'Master Stream (Proxmox)',
        format: 'FLAC',
        year: releaseYear,
        genre: track.primaryGenreName || 'R&B / Soul',
        accentColor: accent,
      };
    });

    return { songs: cloudSongs };
  } catch {
    return { songs: [] };
  }
}
