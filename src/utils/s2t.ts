import { mapValues } from 'lodash';
import { Converter as createConverter } from 'opencc-js';

const converterTW = createConverter({ from: 'cn', to: 'tw' });
const converterTWP = createConverter({ from: 'cn', to: 'twp' });

const correctDict: Array<[string, string]> = [
  ['・', '·'],
  ['巖', '岩'],
  ['御', '禦'],
  ['燬', '毀'],
  ['彩虹小隊', '虹彩小隊'],
  ['重灌', '重裝'],
  ['傑西卡', '潔西卡'],
  ['白麵鴞', '白面鴞'],
  ['灰燼', 'ASH'],
  ['閃擊', 'BLITZ'],
  ['霜華', 'FROST'],
  ['戰車', 'TACHANKA'],
  ['高階', '高級'],
  ['回覆', '回復'],
  ['過載', '超載'],
  ['捱打', '挨打'],
  ['排程', '調度'],
  ['迴流', '回流'],
  ['攝像', '攝影'],
  ['電臺', '電台'],
  ['訊號', '信號'],
  ['鐳射', '雷射'],
  ['榴蓮', '榴槤'],
  ['信條', '信念'],
  ['秘聞', '祕聞'],
  ['奈米', '納米'],
  ['鯉氏偵探事務所', '鯉氏偵探所'],
  ['裝置維護', '設備維護'],
];

export const s2tw = (text: string) =>
  correctDict.reduce((str, [search, replace]) => str.replaceAll(search, replace), converterTW(text));

export const s2twp = (text: string) =>
  correctDict.reduce((str, [search, replace]) => str.replaceAll(search, replace), converterTWP(text));

export const objS2tw = (obj: Record<string, string>) => mapValues(obj, s2tw);

export const objS2twp = (obj: Record<string, string>) => mapValues(obj, s2twp);
