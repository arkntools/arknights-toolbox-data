export interface GachaTag {
  tagId: number;
  tagName: string;
}

export interface GachaTable {
  gachaTags: GachaTag[];
  recruitDetail: string;
}
