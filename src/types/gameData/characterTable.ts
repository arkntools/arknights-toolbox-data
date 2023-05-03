import type { MergeExclusive } from 'type-fest';
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

type CharSkillLevelUpData = Array<{ levelUpCost: ItemCost[] }>;

export type CharSkill = {
  skillId: string;
  /** @external */
  isPatch?: boolean;
  /** @external */
  unlockStages?: string[];
} & MergeExclusive<
  // old
  { levelUpCostCond: CharSkillLevelUpData },
  // new
  { specializeLevelUpData: CharSkillLevelUpData }
>;

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
  phases: Array<{ evolveCost: ItemCost[] | null }>;
  skills: CharSkill[];
  allSkillLvlup: Array<{ lvlUpCost: ItemCost[] }>;
}

export type CharacterTable = Record<string, Character>;
