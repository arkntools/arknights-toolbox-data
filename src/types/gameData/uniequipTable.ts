import type { ItemCost } from './itemTable';

export interface UniEquip {
  uniEquipId: string;
  uniEquipName: string;
  charId: string;
  itemCost: Record<string, ItemCost[]> | null;
}

export interface UniequipTable {
  equipDict: Record<string, UniEquip>;
}
