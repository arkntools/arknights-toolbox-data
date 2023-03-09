// @ts-expect-error
import Kuroshiro from 'kuroshiro';
// @ts-expect-error
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { reduce } from 'lodash-es';

const kuroshiro = new Kuroshiro();
await kuroshiro.init(new KuromojiAnalyzer());

const extraTable = {
  遊: 'yu',
  濯: 'taku',
};

export const getRomaji = async (text: string): Promise<string> => {
  if (/^[\w-]*$/.test(text)) return '';
  return reduce(
    extraTable,
    (result, romaji, kanji) => result.replace(kanji, romaji),
    await kuroshiro.convert(text, { to: 'romaji', romajiSystem: 'passport' }),
  );
};
