export interface SkillLevel {
  name: string;
}

export interface Skill {
  skillId: string;
  iconId: string | null;
  levels: SkillLevel[];
}

export type SkillTable = Record<string, Skill>;
