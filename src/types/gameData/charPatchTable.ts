import type { Character } from './characterTable';

export interface CharPatchTable {
  infos: Record<
    string,
    {
      tmplIds: string[];
      default: string;
    }
  >;
  patchChars: Record<string, Character>;
  unlockConds: Record<
    string,
    {
      conds: Array<{
        stageId: string;
        completeState: number;
      }>;
    }
  >;
}
