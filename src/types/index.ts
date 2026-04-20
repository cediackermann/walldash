export interface Config {
  stationId: string;
  stationName: string;
  refreshRate: number;
}

export interface Departure {
  line: {
    designation: string;
    transport_mode: string;
  };
  destination: string;
  scheduled: string;
  stop_area: {
    name: string;
  };
}

export interface SLData {
  departures: Departure[];
}

export interface StopLocation {
  id: string;
  name: string;
}

export interface SearchData {
  StopLocation: StopLocation[];
}
