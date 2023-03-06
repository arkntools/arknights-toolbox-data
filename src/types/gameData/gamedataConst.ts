export interface TermDescription {
  termId: string;
  termName: string;
  description: string;
}

export interface GamedataConst {
  richTextStyles: Record<string, string>;
  termDescriptionDict: Record<string, TermDescription>;
}
