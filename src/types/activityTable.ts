export interface ActivityBasicInfo {
  id: string;
  type: string;
  name: string;
}

export interface ActivityTable {
  basicInfo: Record<string, ActivityBasicInfo>;
  zoneToActivity: Record<string, string>;
}
