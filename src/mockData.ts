import { Album, Song } from './types';

export const getStreamUrl = (songId: string, title: string, artist: string): string => {
  const customBackend = typeof window !== 'undefined' ? localStorage.getItem('breezy_backend_url') : null;
  // If user configured a Proxmox backend URL, route directly to Proxmox!
  if (customBackend) {
    return `${customBackend}/api/stream?id=${encodeURIComponent(songId)}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
  }
  // Local stream server (Vite on 5173 which streams full 320kbps tracks from nicsongs)
  const host = typeof window !== 'undefined' && window.location.origin.includes('http')
    ? window.location.origin
    : 'http://127.0.0.1:5173';
  return `${host}/api/stream?id=${encodeURIComponent(songId)}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
};

export const FEATURED_ALBUMS: Album[] = [
  {
    id: 'breezy-deluxe',
    title: 'BREEZY (Deluxe)',
    artist: 'Chris Brown',
    year: 2022,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/2487714abac4e2c7be5e70e9b06ced1f/1000x1000-000000-80-0-0.jpg',
    accentColor: '#3b82f6', // electric cobalt blue
    tracksCount: 33,
    description: 'Tenth studio masterpiece showcasing high-tempo R&B, signature vocals, and deep basslines.',
    songs: [
      {
        id: 'cb-1',
        title: 'Under the Influence',
        artist: 'Chris Brown',
        album: 'BREEZY (Deluxe)',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/2487714abac4e2c7be5e70e9b06ced1f/1000x1000-000000-80-0-0.jpg',
        duration: 184,
        audioUrl: getStreamUrl('cb-1', 'Under the Influence', 'Chris Brown'),
        bitrate: 'FLAC 24-bit / 96.0 kHz',
        format: 'FLAC',
        year: 2022,
        genre: 'R&B / Soul',
        accentColor: '#3b82f6',
        lyrics: [
          { time: 10, text: "Fuckin' Robitussin" },
          { time: 14, text: "I don't know why this shit got me lazy" },
          { time: 18, text: "Armani White, she said she want to dance with me" },
          { time: 24, text: "Baby, you know you got me under the influence" },
          { time: 30, text: "So don't trust me, don't trust me tonight" }
        ]
      },
      {
        id: 'cb-2',
        title: 'Call Me Every Day (feat. Wizkid)',
        artist: 'Chris Brown',
        album: 'BREEZY (Deluxe)',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/cc269116fe4da8b1054a18ef7f1e39a8/1000x1000-000000-80-0-0.jpg',
        duration: 146,
        audioUrl: getStreamUrl('cb-2', 'Call Me Every Day', 'Chris Brown'),
        bitrate: 'FLAC 24-bit / 96.0 kHz',
        format: 'FLAC',
        year: 2022,
        genre: 'Afrobeats / R&B',
        accentColor: '#f59e0b',
        lyrics: [
          { time: 5, text: "Call me every day, call me every day" },
          { time: 12, text: "I give you loving, no delay" },
          { time: 18, text: "Hold you down when the night gets cold" }
        ]
      },
      {
        id: 'cb-3',
        title: 'Psychic (feat. Jack Harlow)',
        artist: 'Chris Brown',
        album: 'BREEZY (Deluxe)',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/617ae48566e129cdac2b150c4f208c5f/1000x1000-000000-80-0-0.jpg',
        duration: 220,
        audioUrl: getStreamUrl('cb-3', 'Psychic', 'Chris Brown'),
        bitrate: 'FLAC 24-bit / 48.0 kHz',
        format: 'FLAC',
        year: 2022,
        genre: 'Hip-Hop / R&B',
        accentColor: '#ec4899',
        lyrics: [
          { time: 8, text: "She think she psychic, she know what I like" },
          { time: 15, text: "Reading my mind every single night" }
        ]
      }
    ]
  },
  {
    id: 'drake-clb',
    title: 'Certified Lover Boy',
    artist: 'Drake',
    year: 2021,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/ea8f80f2edb20885ac8aed8751716794/1000x1000-000000-80-0-0.jpg',
    accentColor: '#f43f5e', // rose crimson
    tracksCount: 21,
    description: 'Iconic 6 God compilation featuring legendary collaborations, melodic introspections and 808 anthems.',
    songs: [
      {
        id: 'drk-1',
        title: 'Knife Talk (feat. 21 Savage)',
        artist: 'Drake',
        album: 'Certified Lover Boy',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/ea8f80f2edb20885ac8aed8751716794/1000x1000-000000-80-0-0.jpg',
        duration: 243,
        audioUrl: getStreamUrl('drk-1', 'Knife Talk', 'Drake'),
        bitrate: 'FLAC 24-bit / 96.0 kHz',
        format: 'FLAC',
        year: 2021,
        genre: 'Trap / Hip-Hop',
        accentColor: '#f43f5e',
        lyrics: [
          { time: 5, text: "I check the forecast every day" },
          { time: 10, text: "Gang shit, that's all I'm on" },
          { time: 16, text: "Vicious cut, talkin' with the blades out" }
        ]
      },
      {
        id: 'drk-2',
        title: 'Way 2 Sexy (feat. Future & Young Thug)',
        artist: 'Drake',
        album: 'Certified Lover Boy',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/ea8f80f2edb20885ac8aed8751716794/1000x1000-000000-80-0-0.jpg',
        duration: 257,
        audioUrl: getStreamUrl('drk-2', 'Way 2 Sexy', 'Drake'),
        bitrate: '320 kbps MP3',
        format: 'MP3',
        year: 2021,
        genre: 'Hip-Hop',
        accentColor: '#a855f7',
        lyrics: [
          { time: 7, text: "I'm too sexy for this syrup, too sexy for your girl" },
          { time: 14, text: "Too sexy for this world, too sexy for this club" }
        ]
      },
      {
        id: 'drk-2b',
        title: 'Fair Trade (feat. Travis Scott)',
        artist: 'Drake',
        album: 'Certified Lover Boy',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/ea8f80f2edb20885ac8aed8751716794/1000x1000-000000-80-0-0.jpg',
        duration: 291,
        audioUrl: getStreamUrl('drk-2b', 'Fair Trade', 'Drake'),
        bitrate: 'FLAC 24-bit / 96.0 kHz',
        format: 'FLAC',
        year: 2021,
        genre: 'Hip-Hop',
        accentColor: '#f43f5e',
        lyrics: [
          { time: 6, text: "I've been losin' friends and findin' peace" },
          { time: 12, text: "Honestly that sound like a fair trade to me" }
        ]
      }
    ]
  },
  {
    id: 'cb-indigo',
    title: 'Indigo',
    artist: 'Chris Brown',
    year: 2019,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/a98490c02eb8ac45ceb373543b50ec0e/1000x1000-000000-80-0-0.jpg',
    accentColor: '#8b5cf6', // deep purple violet
    tracksCount: 32,
    description: 'Cosmic double-album exploring spirituality, dualities, and electric dance rhythms.',
    songs: [
      {
        id: 'cb-4',
        title: 'No Guidance (feat. Drake)',
        artist: 'Chris Brown',
        album: 'Indigo',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/a98490c02eb8ac45ceb373543b50ec0e/1000x1000-000000-80-0-0.jpg',
        duration: 260,
        audioUrl: getStreamUrl('cb-4', 'No Guidance', 'Chris Brown'),
        bitrate: 'FLAC 24-bit / 96.0 kHz',
        format: 'FLAC',
        year: 2019,
        genre: 'R&B / Hip-Hop',
        accentColor: '#8b5cf6',
        lyrics: [
          { time: 6, text: "Before I die I'm tryna fuck you, baby" },
          { time: 12, text: "Hopefully we don't bust up no guidance" },
          { time: 18, text: "You got that fire, and I got that flame" }
        ]
      },
      {
        id: 'cb-4b',
        title: 'Heat (feat. Gunna)',
        artist: 'Chris Brown',
        album: 'Indigo',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/a98490c02eb8ac45ceb373543b50ec0e/1000x1000-000000-80-0-0.jpg',
        duration: 232,
        audioUrl: getStreamUrl('cb-4b', 'Heat', 'Chris Brown'),
        bitrate: 'FLAC 24-bit / 96.0 kHz',
        format: 'FLAC',
        year: 2019,
        genre: 'R&B / Trap',
        accentColor: '#8b5cf6',
        lyrics: [
          { time: 5, text: "Got that fire, got that heat" },
          { time: 11, text: "Baby know what she doing when we meet" }
        ]
      }
    ]
  },
  {
    id: 'drake-her-loss',
    title: 'Her Loss',
    artist: 'Drake & 21 Savage',
    year: 2022,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/4599d79a2bea5890737328996e2e7077/1000x1000-000000-80-0-0.jpg',
    accentColor: '#06b6d4', // neon cyan
    tracksCount: 16,
    description: 'Relentless hard-hitting collaborative album produced with Tay Keith and Boi-1da.',
    songs: [
      {
        id: 'drk-3',
        title: 'Rich Flex',
        artist: 'Drake & 21 Savage',
        album: 'Her Loss',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/4599d79a2bea5890737328996e2e7077/1000x1000-000000-80-0-0.jpg',
        duration: 239,
        audioUrl: getStreamUrl('drk-3', 'Rich Flex', 'Drake'),
        bitrate: 'FLAC 24-bit / 192.0 kHz',
        format: 'FLAC',
        year: 2022,
        genre: 'Hip-Hop / Rap',
        accentColor: '#06b6d4',
        lyrics: [
          { time: 4, text: "21, can you do somethin' for me?" },
          { time: 9, text: "Can you hit a lil' rich flex for me?" },
          { time: 15, text: "And 21, can you do your thing for me?" }
        ]
      },
      {
        id: 'drk-3b',
        title: 'Spin Bout U',
        artist: 'Drake & 21 Savage',
        album: 'Her Loss',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/4599d79a2bea5890737328996e2e7077/1000x1000-000000-80-0-0.jpg',
        duration: 214,
        audioUrl: getStreamUrl('drk-3b', 'Spin Bout U', 'Drake'),
        bitrate: 'FLAC 24-bit / 96.0 kHz',
        format: 'FLAC',
        year: 2022,
        genre: 'Hip-Hop / R&B',
        accentColor: '#06b6d4',
        lyrics: [
          { time: 6, text: "I'll spin about you, girl you know it's true" },
          { time: 13, text: "Ain't nothing in this world I wouldn't do" }
        ]
      }
    ]
  },
  {
    id: 'cb-1111',
    title: '11:11',
    artist: 'Chris Brown',
    year: 2023,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/e8b1b523f139f23bac60bc70528f386a/1000x1000-000000-80-0-0.jpg',
    accentColor: '#10b981', // emerald green
    tracksCount: 22,
    description: 'Elevated, mature sonic project balanced across 11:11 AM and 11:11 PM conceptual discs.',
    songs: [
      {
        id: 'cb-5',
        title: 'Sensational (feat. Davido & Lojay)',
        artist: 'Chris Brown',
        album: '11:11',
        coverUrl: 'https://cdn-images.dzcdn.net/images/cover/e8b1b523f139f23bac60bc70528f386a/1000x1000-000000-80-0-0.jpg',
        duration: 231,
        audioUrl: getStreamUrl('cb-5', 'Sensational', 'Chris Brown'),
        bitrate: 'FLAC 24-bit / 96.0 kHz',
        format: 'FLAC',
        year: 2023,
        genre: 'Afro-fusion / R&B',
        accentColor: '#10b981',
        lyrics: [
          { time: 5, text: "You be sweet like sugarcane" },
          { time: 11, text: "Sensational girl, you got the medicine" },
          { time: 18, text: "Body bounce to the rhythm again" }
        ]
      }
    ]
  }
];

export const ALL_SONGS: Song[] = FEATURED_ALBUMS.flatMap(a => a.songs);
