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
    phase: number;
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

export interface BuildingData {
  rooms: Record<RoomType, Room>;
  chars: Record<string, BuildingChar>;
  buffs: Record<string, BuildingBuff>;
}

export interface BuildingProduct {
  roomType: RoomType;
  formulaId: string;
}
