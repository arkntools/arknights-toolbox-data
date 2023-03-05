import type { BuildingProduct } from './buildingData';

export enum OccPer {
  ALWAYS = 0,
  ALMOST = 1,
  USUAL = 2,
  OFTEN = 3,
  SOMETIMES = 4,
}

export interface StageDrop {
  stageId: string;
  occPer: keyof typeof OccPer;
}

export interface Item {
  itemId: string;
  name: string;
  rarity: number;
  sortId: number;
  stageDropList: StageDrop[];
  buildingProductList: BuildingProduct[];
}
