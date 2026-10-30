import { Album, Song } from './types';

export const FEATURED_ALBUMS: Album[] = [
  {
    id: 'breezy-deluxe',
    title: 'BREEZY (Deluxe)',
    artist: 'Chris Brown',
    year: 2022,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop', // high-res vibrant visual
    accentColor: '#3b82f6', // electric cobalt blue
    tracksCount: 33,
    description: 'Tenth studio masterpiece showcasing high-tempo R&B, signature vocals, and deep basslines.',
    songs: [
      {
        id: 'cb-1',
        title: 'Under the Influence',
        artist: 'Chris Brown',
        album: 'BREEZY (Deluxe)',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
        duration: 184,
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg', // Fallback stream or synthesized
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
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop',
        duration: 216,
        audioUrl: 'https://actions.google.com/sounds/v1/cartoon/metal_twang.ogg',
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
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop',
        duration: 220,
        audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/teleport_in.ogg',
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
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1000&auto=format&fit=crop',
    accentColor: '#f43f5e', // rose crimson
    tracksCount: 21,
    description: 'Iconic 6 God compilation featuring legendary collaborations, melodic introspections and 808 anthems.',
    songs: [
      {
        id: 'drk-1',
        title: 'Knife Talk (feat. 21 Savage)',
        artist: 'Drake',
        album: 'Certified Lover Boy',
        coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1000&auto=format&fit=crop',
        duration: 242,
        audioUrl: 'https://actions.google.com/sounds/v1/weapons/laser_gun.ogg',
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
        coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop',
        duration: 257,
        audioUrl: 'https://actions.google.com/sounds/v1/foley/water_drip.ogg',
        bitrate: '320 kbps MP3',
        format: 'MP3',
        year: 2021,
        genre: 'Hip-Hop',
        accentColor: '#a855f7',
        lyrics: [
          { time: 7, text: "I'm too sexy for this syrup, too sexy for your girl" },
          { time: 14, text: "Too sexy for this world, too sexy for this club" }
        ]
      }
    ]
  },
  {
    id: 'cb-indigo',
    title: 'Indigo',
    artist: 'Chris Brown',
    year: 2019,
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
    accentColor: '#8b5cf6', // deep purple violet
    tracksCount: 32,
    description: 'Cosmic double-album exploring spirituality, dualities, and electric dance rhythms.',
    songs: [
      {
        id: 'cb-4',
        title: 'No Guidance (feat. Drake)',
        artist: 'Chris Brown',
        album: 'Indigo',
        coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
        duration: 260,
        audioUrl: 'https://actions.google.com/sounds/v1/household/clock_ticking.ogg',
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
      }
    ]
  },
  {
    id: 'drake-her-loss',
    title: 'Her Loss',
    artist: 'Drake & 21 Savage',
    year: 2022,
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop',
    accentColor: '#06b6d4', // neon cyan
    tracksCount: 16,
    description: 'Relentless hard-hitting collaborative album produced with Tay Keith and Boi-1da.',
    songs: [
      {
        id: 'drk-3',
        title: 'Rich Flex',
        artist: 'Drake & 21 Savage',
        album: 'Her Loss',
        coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop',
        duration: 239,
        audioUrl: 'https://actions.google.com/sounds/v1/human/crowd_cheer.ogg',
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
      }
    ]
  },
  {
    id: 'cb-1111',
    title: '11:11',
    artist: 'Chris Brown',
    year: 2023,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    accentColor: '#10b981', // emerald green
    tracksCount: 22,
    description: 'Elevated, mature sonic project balanced across 11:11 AM and 11:11 PM conceptual discs.',
    songs: [
      {
        id: 'cb-5',
        title: 'Sensational (feat. Davido & Lojay)',
        artist: 'Chris Brown',
        album: '11:11',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
        duration: 231,
        audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/force_field.ogg',
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
