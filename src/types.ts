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
