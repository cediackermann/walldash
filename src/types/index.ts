export type ZoneId = 'header-left' | 'header-right' | 'main-1' | 'main-2' | 'footer-1' | 'footer-2' | 'footer-3';
export type WidgetId = 'clock' | 'weather' | 'sl' | 'sbb' | 'spotify' | 'system' | 'spacer';
export type WidgetLayout = Partial<Record<ZoneId, WidgetId>>;

export interface SLWidgetConfig {
  stationId: string;
  stationName: string;
}

export interface SBBWidgetConfig {
  stationId: string;
  stationName: string;
}

export interface SpotifyWidgetConfig {
  clientId: string;
  clientSecret: string;
}

export interface WeatherWidgetConfig {
  plz: string;
}

export interface Config {
  refreshRate: number;
  alwaysOn: boolean;
  layout: WidgetLayout;
  sl: SLWidgetConfig;
  sbb: SBBWidgetConfig;
  spotify: SpotifyWidgetConfig;
  weather: WeatherWidgetConfig;
}

export interface Departure {
  line: {
    designation: string;
    transport_mode: string;
    group_of_lines?: string;
  };
  destination: string;
  scheduled: string;
  stop_area: { name: string };
}

export interface StopLocation {
  id: string;
  name: string;
}

export interface SBBDeparture {
  name: string;
  category: string;
  number: string;
  to: string;
  stop: {
    departure: string | null;
    delay: number | null;
    platform: string | null;
  };
}

export interface SpotifyNowPlaying {
  playing: boolean;
  track?: {
    name: string;
    artist: string;
    album: string;
    durationMs: number;
    progressMs: number;
  };
}

export interface WeatherData {
  temperature: number;
  description: string;
  sunrise: string;
  sunset: string;
  moonPhase: string;
  hourly: Array<{ time: string; temp: number }>;
}
