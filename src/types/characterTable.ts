export enum CharProfession {
  WARRIOR = 1,
  SNIPER,
  TANK,
  MEDIC,
  SUPPORT,
  CASTER,
  SPECIAL,
  PIONEER,
}

export enum CharPosition {
  MELEE = 9,
  RANGED,
}

export interface CharCost {
  id: string;
  count: number;
  type: string;
}

export interface CharSkill {
  skillId: string;
  levelUpCostCond: Array<{ levelUpCost: CharCost[] }>;
  /** @external */
  isPatch?: boolean;
  /** @external */
  unlockStages?: string[];
}

export interface Character {
  name: string;
  description: string;
  appellation: string;
  position: keyof typeof CharPosition;
  tagList: string[];
  isNotObtainable: boolean;
  rarity: number;
  profession: keyof typeof CharProfession;
  subProfessionId: string;
  phases: Array<{ evolveCost: CharCost[] | null }>;
}

export type CharacterTable = Record<string, Character>;
