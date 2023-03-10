import type { OccPercent, RetroAct, ZoneValidInfo } from 'types';

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

export interface DataMaterial {
  sortId: Record<string, number>;
  rare: number;
  drop: DataDrop;
  formulaType: string;
  formula: Record<string, number>;
}

export type DataJsonItem = Record<string, DataMaterial>;
