import type { BuildingProduct } from './buildingData';
import type { OccPercent } from './stageTable';

export interface ItemStageDrop {
  stageId: string;
  occPer: keyof typeof OccPercent;
}

export interface Item {
  itemId: string;
  name: string;
  rarity: number;
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
