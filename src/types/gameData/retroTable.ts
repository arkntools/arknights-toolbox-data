import type { Stage } from './stageTable';

export enum RetroType {
  /** 别传 */
  SIDESTORY,
  /** 插曲 */
  BRANCHLINE,
}

export interface RetroAct {
  retroId: string;
  type: RetroType | keyof typeof RetroType;
  linkedActId: string[];
  startTime: number;
  name: string;
  customActType: string;
}

export interface RetroTable {
  zoneToRetro: Record<string, string>;
  retroActList: Record<string, RetroAct>;
  stageList: Record<string, Stage>;
}
