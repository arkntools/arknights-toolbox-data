import { resolve } from 'path';
import { ensureFileSync, existsSync, readFileSync, readJsonSync, writeFileSync, writeJsonSync } from 'fs-extra';
import { camelCase, inRange, isEqual, map, mapValues, size, sortBy, transform, uniq } from 'lodash';
import type { BuildingData, BuildingProduct, Character, ItemCost, StageTable, UniEquip } from 'types';
import { MaterialType } from 'types';
import { CHIP_ASSISTANT_ID, DATA_DIR, FormulasKeyMap, LangMap, LOCALES_DIR, PURCHASE_CERTIFICATE_ID } from 'constant';

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

export const isOperator = ({ isNotObtainable }: Character, id: string) =>
  id.split('_')[0] === 'char' && !isNotObtainable;

export const isBattleRecord = (id: string) => inRange(Number(id), 2001, 2010);
export const isSkillSummary = (id: string) => inRange(Number(id), 3301, 3310);
export const isModToken = (id: string) => /^mod_(?:unlock|update)_token/.test(id);
export const isMaterial = (id: string) => inRange(Number(id), 30011, 32000);
export const isChipAss = (id: string) => String(id) === CHIP_ASSISTANT_ID;
export const isChip = (id: string) => inRange(Number(id), 3211, 3300);
export const isCertificate = (id: string) => String(id) === PURCHASE_CERTIFICATE_ID;
export const isItem = (id: string) =>
  isSkillSummary(id) || isModToken(id) || isMaterial(id) || isChipAss(id) || isChip(id) || isCertificate(id);

export const getMaterialListObject = (list?: ItemCost[] | null) =>
  transform(
    (list || []).filter(({ id }) => isItem(id)),
    (obj, { id, count }) => {
      obj[id] = count;
    },
    {} as Record<string, number>,
  );

export const getFormula = (buildingProductList: BuildingProduct[], buildingData: BuildingData) => {
  const formula = buildingProductList.find(({ roomType }) => roomType in FormulasKeyMap);
  if (!formula) return;
  const roomType = formula.roomType as keyof typeof FormulasKeyMap;
  return {
    formulaType: roomType,
    formula: getMaterialListObject(buildingData[FormulasKeyMap[roomType]][formula.formulaId].costs),
  };
};

export const getEquipMaterialListObject = (itemCost: UniEquip['itemCost']) => {
  if (!itemCost) return [];
  return map(itemCost, getMaterialListObject);
};

export const getHasDropStageList = (stages: StageTable['stages']) => {
  const includeStageType = new Set(['MAIN', 'SUB', 'DAILY']);
  return uniq(
    Object.values(stages)
      .filter(
        ({ stageType, stageDropInfo: { displayDetailRewards } }) =>
          includeStageType.has(stageType) &&
          displayDetailRewards.some(({ id, dropType }) => isItem(id) && dropType !== 1),
      )
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
          ? resolve(__dirname, `../../../ArknightsGameData/${lang}/gamedata/excel/${file}`)
          : getResourceURL('Kengxxiao/ArknightsGameData', 'master', `${lang}/gamedata/excel/${file}`);
    },
    {} as Record<string, string>,
  );
export const gameDataUrl = mapValues(LangMap, lang => getDataURL(lang));

export const getNameForRecruitment = (name: string) => name.replace(/'|"/g, '');

/** 公招干员类型表 */
export const getRecruitmentTable = (recruitDetail: string): Record<string, number> =>
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

const someObjsEmpty = (objs: any[]) => objs.some(obj => size(obj) === 0);
export const checkObjsNotEmpty = (...objs: any[]) => {
  if (someObjsEmpty(objs)) throw new Error('Empty object.');
};
const _writeData = (path: string, obj: any) => {
  if (!existsSync(path)) {
    if (someObjsEmpty([obj])) return false;
    writeJsonSync(path, {});
  }
  if (!isEqual(readJsonSync(path), obj)) {
    writeJsonSync(path, obj, { spaces: 2 });
    return true;
  }
  return false;
};
const _writeText = (path: string, text: string) => {
  if (!existsSync(path) && !text.length) return false;
  ensureFileSync(path);
  if (readFileSync(path).toString() !== text) {
    writeFileSync(path, text);
    return true;
  }
  return false;
};
export const writeData = (name: string, obj: any, allowEmpty = false) => {
  if (!allowEmpty) checkObjsNotEmpty(obj);
  if (_writeData(resolve(DATA_DIR, name), obj)) console.log(`Update ${name}`);
};
export const writeText = (name: string, text: string, allowEmpty = false) => {
  if (!allowEmpty && !text) throw new Error('Empty content.');
  if (_writeText(resolve(DATA_DIR, name), text)) console.log(`Update ${name}`);
};
export const writeLocale = (locale: string, name: string, obj: any, allowEmpty: boolean | string[] = false) => {
  if (!allowEmpty || (Array.isArray(allowEmpty) && !allowEmpty.includes(locale))) {
    checkObjsNotEmpty(obj);
  }
  if (_writeData(resolve(LOCALES_DIR, locale, name), obj)) console.log(`Update ${locale} ${name}`);
};

const itemTypeAsserts: Array<{ type: MaterialType; assert: (id: string) => boolean }> = [
  { type: MaterialType.MATERIAL, assert: id => inRange(Number(id), 30011, 32000) },
  { type: MaterialType.CHIP, assert: id => inRange(Number(id), 3211, 3300) },
  { type: MaterialType.MOD_TOKEN, assert: id => /^mod_(?:unlock|update)_token/.test(id) },
  { type: MaterialType.SKILL_SUMMARY, assert: id => inRange(Number(id), 3301, 3310) },
  { type: MaterialType.CHIP_ASS, assert: id => id === CHIP_ASSISTANT_ID || id === PURCHASE_CERTIFICATE_ID },
];
export const getItemType = (id: string) => {
  const result = itemTypeAsserts.find(({ assert }) => assert(id));
  return result?.type ?? MaterialType.UNKNOWN;
};
