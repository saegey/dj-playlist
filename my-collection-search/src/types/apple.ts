export interface AppleMusicResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  url: string;
  artwork?: string;
  duration?: number; // ms
  isrc?: string;
}
