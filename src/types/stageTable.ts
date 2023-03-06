export enum OccPercent {
  ALWAYS = 0,
  ALMOST = 1,
  USUAL = 2,
  OFTEN = 3,
  SOMETIMES = 4,
}

export interface StageDisplayReward {
  type: string;
  id: string;
  dropType: number;
}

export interface StageDisplayDetailReward extends StageDisplayReward {
  occPercent: OccPercent;
}

export interface Stage {
  stageType: string;
  zoneId: string;
  code: string;
  stageDropInfo: {
    displayRewards: StageDisplayReward[];
    displayDetailRewards: StageDisplayDetailReward[];
  };
}

export interface StageTable {
  stages: Record<string, Stage>;
}
