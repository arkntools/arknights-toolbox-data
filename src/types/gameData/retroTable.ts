import type { Stage } from './stageTable';

export enum RetroType {
  /** 别传 */
  SIDE_STORY,
  /** 插曲 */
  INTERMEZZI,
}

export interface RetroAct {
  retroId: string;
  type: RetroType;
  linkedActId: string[];
}

export interface RetroTable {
  zoneToRetro: Record<string, string>;
  retroActList: Record<string, RetroAct>;
  stageList: Record<string, Stage>;
}
