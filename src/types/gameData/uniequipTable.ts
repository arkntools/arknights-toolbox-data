import type { ItemCost } from './itemTable';

export interface UniEquip {
  uniEquipId: string;
  uniEquipName: string;
  typeIcon: string;
  charId: string;
  itemCost: Record<string, ItemCost[]> | null;
}

export interface UniequipTable {
  equipDict: Record<string, UniEquip>;
  charEquip: Record<string, string[]>;
}
