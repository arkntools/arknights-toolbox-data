export interface DataCharacter {
  pinyin: {
    full: string;
    head: string;
  };
  romaji: string;
  appellation: string;
  star: number;
  recruitment: Record<string, number>;
  position: number;
  profession: number;
  tags: number[];
}

export type DataJsonCharacter = Record<string, DataCharacter>;
