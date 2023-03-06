export interface Zone {
  zoneID: string;
  type: string;
  zoneNameFirst: string;
  zoneNameSecond: string;
}

export interface ZoneValidInfo {
  startTs: number;
  endTs: number;
}

export interface ZoneTable {
  zones: Record<string, Zone>;
  zoneValidInfo: Record<string, ZoneValidInfo>;
}
