import type { OccPercent, RetroAct, RoomType, ZoneValidInfo } from 'types';

export interface DataCharacter {
  pinyin: {
    full: string;
    head: string;
  };
  romaji: string;
  appellation: string;
  star: number;
  recruitment: Record<string, number>;
  position: number;
  profession: number;
  tags: number[];
}

export type DataJsonCharacter = Record<string, DataCharacter>;

export type DataJsonUnopenedStage = Record<string, string[]>;

export type DataEventInfo = Record<string, { valid: ZoneValidInfo }>;

export type DataJsonEvent = Record<string, DataEventInfo>;

export type DataDrop = Record<string, OccPercent>;

export type DataStageDrop = Record<string, DataDrop>;

export type DataZoneDrop = Record<string, DataStageDrop>;

export type DataJsonDrop = Record<'event' | 'retro', DataZoneDrop>;

export type DataRetro = Pick<RetroAct, 'type' | 'startTime' | 'linkedActId'>;

export type DataRetroTable = Record<string, DataRetro>;

export type DataJsonRetro = Record<string, DataRetroTable>;

export interface DataStage {
  code: string;
  cost: number;
}

export type DataZoneStage = Record<string, DataStage>;

export type DataStageTable = Record<string, DataZoneStage>;

export type DataJsonStage = Record<'normal' | 'event' | 'retro', DataStageTable>;

export type DataItemCost = Record<string, number>;

export enum MaterialType {
  UNKNOWN = -1,
  MATERIAL,
  CHIP,
  MOD_TOKEN,
  SKILL_SUMMARY,
  CHIP_ASS,
}

export interface DataMaterial {
  type: MaterialType;
  sortId: Record<string, number>;
  rare: number;
  drop: DataDrop;
  formulaType: string;
  formula: DataItemCost;
}

export type DataJsonItem = Record<string, DataMaterial>;

export interface DataCharCultivate {
  evolve: DataItemCost[];
  skills: {
    normal: DataItemCost[];
    elite: Array<{
      name: string;
      cost: DataItemCost[];
      isPatch?: boolean;
      unlockStages?: string[];
    }>;
  };
  uniequip: Array<{
    id: string;
    cost: DataItemCost[];
  }>;
}

export type DataJsonCultivate = Record<string, DataCharCultivate>;

export type DataBuildingChar = Array<{ id: string; unlock: string }>;

export interface DataBuildingBuffData {
  icon: string;
  desc: string;
}

export interface DataBuildingBuffInfo {
  building: RoomType;
  num: Record<string, number>;
  is: Record<string, number>;
}

export type DataBuildingBuffNumKey = Record<string, string | string[]>;

export type DataJsonBuildingChar = Record<string, DataBuildingChar>;

export interface DataJsonBuildingBuff {
  data: Record<string, DataBuildingBuffData>;
  info: Record<string, DataBuildingBuffInfo>;
  numKey: Record<RoomType, DataBuildingBuffNumKey>;
}

export interface DataJsonBuilding {
  char: DataJsonBuildingChar;
  buff: DataJsonBuildingBuff;
}

export type DataJsonUniequip = Record<
  string,
  {
    typeIcon: string;
  }
>;
