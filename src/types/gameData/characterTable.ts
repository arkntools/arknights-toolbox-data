import type { ItemCost } from './itemTable';

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

export interface CharSkill {
  skillId: string;
  levelUpCostCond: Array<{ levelUpCost: ItemCost[] }>;
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
  rarity: number | string;
  profession: keyof typeof CharProfession;
  subProfessionId: string;
  phases: Array<{ evolveCost: ItemCost[] | null }>;
  skills: CharSkill[];
  allSkillLvlup: Array<{ lvlUpCost: ItemCost[] }>;
}

export type CharacterTable = Record<string, Character>;
