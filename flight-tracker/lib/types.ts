export interface FlightState {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
  aircraft_type?: string | null;
  registration?: string | null;
  operator?: string | null;
  dep_airport?: string | null;
  arr_airport?: string | null;
  flight_iata?: string | null;
}

export interface OpenSkyResponse {
  time: number;
  states: (string | number | boolean | null)[][] | null;
}

export function parseFlightStates(raw: (string | number | boolean | null)[][]): FlightState[] {
  return raw
    .filter(s => s[5] !== null && s[6] !== null)
    .map(s => ({
      icao24: s[0] as string,
      callsign: s[1] ? (s[1] as string).trim() : null,
      origin_country: s[2] as string,
      time_position: s[3] as number | null,
      last_contact: s[4] as number,
      longitude: s[5] as number | null,
      latitude: s[6] as number | null,
      baro_altitude: s[7] as number | null,
      on_ground: s[8] as boolean,
      velocity: s[9] as number | null,
      true_track: s[10] as number | null,
      vertical_rate: s[11] as number | null,
      sensors: null,
      geo_altitude: s[13] as number | null,
      squawk: s[14] as string | null,
      spi: s[15] as boolean,
      position_source: s[16] as number,
      aircraft_type: s[17] as string | null,
      registration: s[18] as string | null,
      operator: s[19] as string | null,
      dep_airport: s[20] as string | null,
      arr_airport: s[21] as string | null,
      flight_iata: s[22] as string | null,
    }));
}

export interface NTSBAccident {
  EventId?: string;
  NtsbNo?: string;
  EventDate?: string;
  EventLocalDate?: string;
  City?: string;
  State?: string;
  Country?: string;
  Operator?: string;
  AircraftMakeModel?: string;
  AircraftRegistration?: string;
  HighestInjury?: string;
  TotalFatalInjuries?: number;
  TotalSeriousInjuries?: number;
  TotalMinorInjuries?: number;
  TotalUninjured?: number;
  AircraftDamage?: string;
  FlightPurpose?: string;
  PhaseOfFlight?: string;
  WeatherCondition?: string;
  BroadPhase?: string;
  ReportStatus?: string;
  EngineType?: string;
  NumberOfEngines?: number;
  AirCarrier?: string;
  ReportUrl?: string;
  [key: string]: string | number | undefined;
}
