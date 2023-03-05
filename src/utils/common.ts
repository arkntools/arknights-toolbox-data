import { resolve } from 'path';
import { readJsonSync } from 'fs-extra';
import { camelCase, inRange, map, mapValues, sortBy, transform, uniq } from 'lodash-es';
import { LANG_MAP, PURCHASE_CERTIFICATE_ID } from 'src/constant';

export const ensureReadJsonSync = <T = any>(...args: Parameters<typeof readJsonSync>): T | undefined => {
  try {
    return readJsonSync(...args);
  } catch (error: any) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
};

export const sortObjectBy = <T>(obj: Record<string, T>, fn: (key: string, value: T) => any): Record<string, T> =>
  Object.fromEntries(sortBy(Object.entries(obj), ([k, v]) => fn(k, v)));

const idStandardizationMap = new Map<string, string>();
export const idStandardization = (id: string) => {
  const result = id.replace(/\[([0-9]+?)\]/g, '_$1');
  if (result !== id) idStandardizationMap.set(result, id);
  return result;
};
export const revIdStandardization = (result: string) => idStandardizationMap.get(result) || result;

export const isOperator = ({ isNotObtainable }: any, id: string) => id.split('_')[0] === 'char' && !isNotObtainable;

export const isSkillSummary = (id: string) => inRange(Number(id), 3301, 3310);
export const isModToken = (id: string) => /^mod_(?:unlock|update)_token/.test(id);
export const isMaterial = (id: string) => inRange(Number(id), 30011, 32000);
export const isChipAss = (id: string) => String(id) === '32001';
export const isChip = (id: string) => inRange(Number(id), 3211, 3300);
export const isCertificate = (id: string) => String(id) === PURCHASE_CERTIFICATE_ID;
export const isItem = (id: string) =>
  isSkillSummary(id) || isModToken(id) || isMaterial(id) || isChipAss(id) || isChip(id) || isCertificate(id);

const getMaterialListObject = (list: any[]) =>
  transform(
    (list || []).filter(({ id }) => isItem(id)),
    (obj, { id, count }) => {
      obj[id] = count;
    },
    {} as Record<string, number>,
  );

const formulasKeyMap: Record<string, string> = {
  WORKSHOP: 'workshopFormulas',
  MANUFACTURE: 'manufactFormulas',
};
export const getFormula = (buildingProductList: any[], buildingData: any) => {
  const formula = buildingProductList.find(({ roomType }) => roomType === 'WORKSHOP' || roomType === 'MANUFACTURE');
  if (!formula || !(formula.roomType in formulasKeyMap)) return;
  return {
    formulaType: formula.roomType,
    formula: getMaterialListObject(buildingData[formulasKeyMap[formula.roomType]][formula.formulaId].costs),
  };
};

export const getEquipMaterialListObject = (itemCost: any) => {
  if (!itemCost) return [];
  if (Array.isArray(itemCost)) return [getMaterialListObject(itemCost)];
  return map(itemCost, getMaterialListObject);
};

export const getStageList = (stages: any) => {
  const includeStageType = new Set(['MAIN', 'SUB', 'DAILY']);
  return uniq(
    Object.values<any>(stages)
      .filter(({ stageType }) => includeStageType.has(stageType))
      .map(({ code }) => code),
  );
};

export const getResourceURL = (repo: string, branch: string, path: string) =>
  `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;

const getDataURL = (lang: string) =>
  transform(
    [
      'character_table.json',
      'building_data.json',
      'skill_table.json',
      'gacha_table.json',
      'item_table.json',
      'stage_table.json',
      'zone_table.json',
      'gamedata_const.json',
      'activity_table.json',
      'zh_CN/char_patch_table.json',
      'retro_table.json',
      'uniequip_table.json',
    ],
    (obj, file) => {
      const paths = file.split('/');
      if (paths.length === 2) {
        const [tLang, tFile] = paths;
        if (tLang === lang) file = tFile;
        else return;
      }
      obj[camelCase(file.split('.')[0])] =
        process.env.UPDATE_SOURCE === 'local'
          ? resolve(__dirname, `../../ArknightsGameData/${lang}/gamedata/excel/${file}`)
          : getResourceURL('Kengxxiao/ArknightsGameData', 'master', `${lang}/gamedata/excel/${file}`);
    },
    {} as Record<string, string>,
  );
export const gameData = mapValues(LANG_MAP, lang => getDataURL(lang));

export const getNameForRecruitment = (name: string) => name.replace(/'|"/g, '');

/** 公招干员类型表 */
export const getRecruitmentTable = (recruitDetail: string) =>
  Object.fromEntries(
    recruitDetail
      .replace(/\\n/g, '\n')
      .split(/\s*-*\n★+\s*/)
      .splice(1)
      .map(line => line.split(/(?<!<)\/(?!>)/).map(name => name.trim()))
      .flat()
      .map(name => [
        getNameForRecruitment(name.replace(/^<.+?>(.+?)<\/>$/g, '$1')),
        name.startsWith('<@rc.eml>') ? 2 : 1,
      ]),
  );
