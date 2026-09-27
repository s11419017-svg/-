export interface CastMember {
  id: string;
  name: string;
  classYear: string;
  roleName: string;
  roleNameEn: string;
  category: 'principal' | 'ensemble' | 'crew';
  quote: string;
  reflection: string;
  characterBio: string;
  image: string;
  spokenLine?: string;
  favoriteQuote?: string;
}

export interface RehearsalPhoto {
  id: string;
  title: string;
  caption: string;
  date: string;
  image: string;
  category: 'rehearsal' | 'stage' | 'script' | 'costume';
}

export interface PlayQuote {
  quoteEn: string;
  quoteZh: string;
  character: string;
  context: string;
}

export interface MusicalTrack {
  id: string;
  titleEn: string;
  titleZh: string;
  character: string;
  performer: string;
  tempo: string;
  desc: string;
  lyricsEn: string;
  lyricsZh: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  audioUrl?: string; // Optional custom MP3, uploaded audio, or external link
  freqPattern?: number[];
}

export interface ShowGeneralConfig {
  // 1. 公演基本資訊與時間倒數
  titleZh: string;
  titleEn: string;
  subhead: string;
  schoolName: string;
  gradeName: string;
  eventDateIso: string; // ISO format e.g. '2026-12-19T19:00:00' used for countdown
  eventDateFormatted: string;
  doorTime: string;
  showTime: string;
  venueName: string;
  venueAddress: string;
  admissionFee: string;

  // 2. 索票與票務資訊
  ticketStatus: 'open' | 'coming_soon' | 'closed';
  ticketButtonText: string;
  ticketUrl: string;
  ticketNotice: string;
  ticketReleaseDate: string;

  // 3. 核心文案與精神標語
  heroTagline: string;
  heroTaglineEn: string;
  heroLeadText: string;

  // 4. 現場交通、無障礙與動線聯絡
  parkingGuide: string;
  accessibilitySupport: string;
  contactInfo: string;
}

export interface ChangeRecord {
  id: string;
  timestamp: string;
  description: string;
  targetType: 'cast' | 'photo' | 'track' | 'bulk';
  previousState: {
    cast?: CastMember[];
    photos?: RehearsalPhoto[];
    tracks?: MusicalTrack[];
    generalConfig?: ShowGeneralConfig;
  };
}
