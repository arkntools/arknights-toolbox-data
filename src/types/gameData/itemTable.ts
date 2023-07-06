import type { BuildingProduct } from './buildingData';
import type { OccPercent } from './stageTable';

export enum RarityRank {
  TIER_1 = 0,
  TIER_2 = 1,
  TIER_3 = 2,
  TIER_4 = 3,
  TIER_5 = 4,
  TIER_6 = 5,
  E_NUM = 6,
}

export interface ItemStageDrop {
  stageId: string;
  occPer: keyof typeof OccPercent;
}

export interface Item {
  itemId: string;
  name: string;
  rarity: RarityRank | keyof typeof RarityRank;
  iconId: string;
  sortId: number;
  stageDropList: ItemStageDrop[];
  buildingProductList: BuildingProduct[];
}

export interface ItemTable {
  items: Record<string, Item>;
}

export interface ItemCost {
  id: string;
  count: number;
  type: string;
}
