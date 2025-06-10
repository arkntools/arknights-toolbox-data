// @ts-expect-error
import Kuroshiro from 'kuroshiro';
// @ts-expect-error
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

const kuroshiro = new Kuroshiro();
const init = kuroshiro.init(new KuromojiAnalyzer());

const extraTable = {
  遊龍: 'yuryu',
  濯塵: 'takujin',
  承曦: 'shoasahi',
  引星: 'hikisei',
};

export const getRomaji = async (text: string): Promise<string> => {
  if (/^[\w-]*$/.test(text)) return '';
  await init;
  for (const [kanji, romaji] of Object.entries(extraTable)) {
    if (text.startsWith(kanji)) {
      text = text.replace(kanji, romaji);
      break;
    }
  }
  return kuroshiro.convert(text, { to: 'romaji', romajiSystem: 'passport' });
};
