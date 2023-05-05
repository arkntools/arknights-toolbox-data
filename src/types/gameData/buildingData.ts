import type { ItemCost } from './itemTable';

export type RoomType =
  | 'CONTROL'
  | 'POWER'
  | 'MANUFACTURE'
  | 'TRADING'
  | 'DORMITORY'
  | 'WORKSHOP'
  | 'HIRE'
  | 'TRAINING'
  | 'MEETING'
  | 'ELEVATOR'
  | 'CORRIDOR';

export interface Room {
  id: RoomType;
  name: string;
}

export interface BuildingCharBuffData {
  buffId: string;
  cond: {
    phase: string | number;
    level: number;
  };
}

export interface BuildingChar {
  charId: string;
  buffChar: Array<{ buffData: BuildingCharBuffData[] }>;
}

export interface BuildingBuff {
  buffId: string;
  buffName: string;
  skillIcon: string;
  roomType: RoomType;
  description: string;
}

export interface BuildingFormula {
  formulaId: string;
  itemId: string;
  count: number;
  costPoint: number;
  costs: ItemCost[];
}

export interface BuildingData {
  rooms: Record<RoomType, Room>;
  chars: Record<string, BuildingChar>;
  buffs: Record<string, BuildingBuff>;
  workshopFormulas: Record<string, BuildingFormula>;
  manufactFormulas: Record<string, BuildingFormula>;
}

export interface BuildingProduct {
  roomType: RoomType;
  formulaId: string;
}
