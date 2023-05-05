export enum OccPercent {
  ALWAYS = 0,
  ALMOST = 1,
  USUAL = 2,
  OFTEN = 3,
  SOMETIMES = 4,
}

export enum StageDropType {
  NONE = 0,
  ONCE = 1,
  NORMAL = 2,
  SPECIAL = 3,
  ADDITIONAL = 4,
  APRETURN = 5,
  DIAMOND_MATERIAL = 6,
  FUNITURE_DROP = 7,
  COMPLETE = 8,
  CHARM_DROP = 9,
  OVERRIDE_DROP = 10,
  ITEM_RETURN = 11,
}

export interface StageDisplayReward {
  type: string;
  id: string;
  dropType: StageDropType | keyof typeof StageDropType;
}

export interface StageDisplayDetailReward extends StageDisplayReward {
  occPercent: OccPercent | keyof typeof OccPercent;
}

export interface Stage {
  stageType: string;
  stageId: string;
  zoneId: string;
  code: string;
  apCost: number;
  stageDropInfo: {
    displayRewards: StageDisplayReward[];
    displayDetailRewards: StageDisplayDetailReward[];
  };
}

export interface StageTable {
  stages: Record<string, Stage>;
}
