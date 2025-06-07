import { assign, castArray, each, mapValues } from 'lodash';
import type { RoomType } from 'types';

const category: Record<string, Record<string, RegExp | RegExp[]>> = {
  BUILDING: {
    POWER: /(?:无人机|充能速度).*?(?<power>[\d.]+)/,
    HIRE: [/人脉资源.*?(?<connect>[\d.]+)/, /\+(?<connect>[\d.]+)%人脉资源/],
  },
  MANUFACTURE: {
    通用生产: [
      /(?<!配方的)生产力.*?最终达到\+(?<product>[\d.]+)/,
      /(?<!配方的)生产力\+(?<product>[\d.]+)/,
      /制造站.+最多提供(?<product>[\d.]+)%生产力/,
      /制造站.+每.+\+(?<product>[\d.]+)%生产力/,
      /为当前制造站\+(?<product>[\d.]+)%的?生产力/,
      /每格仓库容量.+(?<product>[\d.]+)%的?生产力/,
    ],
    贵金属: /贵金属.*?生产力\+(?<product>[\d.]+)%/,
    作战记录: /作战记录.*?生产力\+(?<product>[\d.]+)%/,
    源石: /源石.*?生产力\+(?<product>[\d.]+)%/,
    仓库容量: /仓库容量上限\+(?<capacity>[\d.]+)/,
  },
  TRADING: {
    订单效率: [
      /(?<!所有贸易站)订单(?:获取)?效率\+(?<order>[\d.]+)/,
      /(?<!所有)贸易站.+最多提供(?<order>[\d.]+)%效率/,
      /(?<!所有)贸易站.+自身\+(?<order>[\d.]+)%订单获取效率/,
      /(?<!所有)贸易站.+每.+\+(?<order>[\d.]+)%(?:订单)?获取效率/,
      /每\d+点.+\+(?<order>[\d.]+)%订单效率/,
    ],
    订单上限: /订单上限\+(?<orderLimit>[\d.]+)/,
    高品质: /高品质贵金属订单/,
  },
  CONTROL: {
    订单效率: /控制中枢.*订单(?:获取)?效率\+(?<orderAll>[\d.]+)/,
    生产力: /控制中枢.*生产力\+(?<productAll>[\d.]+)/,
    心情消耗: /控制中枢.*心情(?:每小时)?(?:消耗-|恢复\+)(?<moraleConsume>[\d.]+)/,
    线索倾向: [/线索倾向/, /尚未拥有的线索/],
    线索搜集: [/线索搜集速度\+(?<collect>[\d.]+)/],
  },
  DORMITORY: {
    群体恢复: /宿舍.*?所有干员.*?(?<moraleRecoveryAll>[\d.]+)/,
    单体恢复: /宿舍.*?某个干员.*?(?<moraleRecoverySingle>[\d.]+)/,
  },
  MEETING: {
    无特别加成: [/线索.*?速度.*?(?<collect>[\d.]+)/, /提升(?<collect>[\d.]+)%线索.*?速度/],
    ...mapValues(
      {
        线索1: '莱茵生命',
        线索2: '企鹅物流',
        线索3: '黑钢国际',
        线索4: '乌萨斯学生自治团',
        线索5: '格拉斯哥帮',
        线索6: '喀兰贸易',
        线索7: '罗德岛制药',
      },
      name => [new RegExp(`线索.*?速度.*?(?<collect>[\\d.]+).*更容易获得${name}`), new RegExp(name)],
    ),
  },
  WORKSHOP: {
    任意材料: /任意类?材料.*?概率提升(?<byproduct>[\d.]+)%/,
    基建材料: /基建材料.*?概率提升(?<byproduct>[\d.]+)%/,
    精英材料: /(?:精英|(?<!任意)类)材料.*?概率提升(?<byproduct>[\d.]+)%/,
    技巧概要: /技巧概要.*?概率提升(?<byproduct>[\d.]+)%/,
    芯片: /芯片.*?概率提升(?<byproduct>[\d.]+)%/,
  },
  TRAINING: {
    全能: [/，干员.*?(?<train>[\d.]+)/, /干员为当前干员.*?(?<train>[\d.]+)/],
    先锋: /先锋.*?(?<train>[\d.]+)/,
    狙击: /狙击.*?(?<train>[\d.]+)/,
    医疗: /医疗.*?(?<train>[\d.]+)/,
    术师: /术师.*?(?<train>[\d.]+)/,
    近卫: /近卫.*?(?<train>[\d.]+)/,
    重装: /重装.*?(?<train>[\d.]+)/,
    辅助: /辅助.*?(?<train>[\d.]+)/,
    特种: /特种.*?(?<train>[\d.]+)/,
  },
};

const numKey: Record<string, Record<string, string | string[]>> = {
  BUILDING: {
    MANUFACTURE: ['product', 'capacity'],
    TRADING: ['order', 'orderLimit'],
    POWER: 'power',
    CONTROL: ['orderAll', 'productAll', 'moraleConsume'],
    DORMITORY: ['moraleRecoveryAll', 'moraleRecoverySingle'],
    MEETING: 'collect',
    WORKSHOP: 'byproduct',
    TRAINING: 'train',
    HIRE: 'connect',
  },
  MANUFACTURE: {
    通用生产: 'product',
    贵金属: 'product',
    作战记录: 'product',
    源石: 'product',
    仓库容量: 'capacity',
  },
  TRADING: {
    订单效率: 'order',
    订单上限: 'orderLimit',
    高品质: [],
  },
  CONTROL: {
    订单效率: 'orderAll',
    生产力: 'productAll',
    心情消耗: 'moraleConsume',
    线索倾向: [],
    线索搜集: 'collect',
  },
  DORMITORY: {
    群体恢复: 'moraleRecoveryAll',
    单体恢复: 'moraleRecoverySingle',
  },
  MEETING: {
    无特别加成: 'collect',
    线索1: 'collect',
    线索2: 'collect',
    线索3: 'collect',
    线索4: 'collect',
    线索5: 'collect',
    线索6: 'collect',
    线索7: 'collect',
  },
  WORKSHOP: {
    任意材料: 'byproduct',
    基建材料: 'byproduct',
    精英材料: 'byproduct',
    技巧概要: 'byproduct',
    芯片: 'byproduct',
  },
  TRAINING: {
    全能: 'train',
    先锋: 'train',
    狙击: 'train',
    医疗: 'train',
    术师: 'train',
    近卫: 'train',
    重装: 'train',
    辅助: 'train',
    特种: 'train',
  },
};

const removeRichTextTag = (str: string): string => {
  const result = str.replace(/<(?:[^>]+)>([^<>]+)<\/>/g, '$1');
  return /<[^>]+>[^<>]+<\/>/.test(result) ? removeRichTextTag(result) : result;
};

export const processBuildingSkills = (
  md52Info: Record<string, { building: RoomType }>,
  md52Description: Record<string, string>,
) => {
  const info = mapValues(md52Info, ({ building }, md5) => {
    const is: Record<string, number> = {};
    const num: Record<string, string> = {};
    const description = removeRichTextTag(md52Description[md5]);

    if (building in category) {
      each(category[building], (value, key) => {
        for (const reg of castArray(value)) {
          const search = reg.exec(description);
          if (search) {
            is[key] = 1;
            if (search.groups) assign(num, search.groups);
            break;
          }
        }
      });
    } else if (building in category.BUILDING) {
      for (const reg of castArray(category.BUILDING[building])) {
        const search = reg.exec(description);
        if (search) {
          if (search.groups) assign(num, search.groups);
          break;
        }
      }
    }

    return { building, num: mapValues(num, parseFloat), is };
  });

  return { info, numKey };
};
