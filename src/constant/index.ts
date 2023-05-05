import { resolve } from 'path';

const IMG_DIR = resolve(__dirname, '../../assets/img');
export const DATA_DIR = resolve(__dirname, '../../assets/data');
export const LOCALES_DIR = resolve(__dirname, '../../assets/locales');
export const OTHER_DATA_DIR = resolve(__dirname, '../../others');

export const AVATAR_IMG_DIR = resolve(IMG_DIR, 'avatar');
export const SKILL_IMG_DIR = resolve(IMG_DIR, 'skill');
export const BUILDING_SKILL_IMG_DIR = resolve(IMG_DIR, 'building_skill');
export const ITEM_IMG_DIR = resolve(IMG_DIR, 'item');
export const ITEM_PKG_ZIP = resolve(__dirname, '../../assets/pkg/item.zip');

export const PURCHASE_CERTIFICATE_ID = '4006';
export const CHIP_ASSISTANT_ID = '32001';
export const EXT_ITEM = ['4001', 'AP_GAMEPLAY', '2001', '2002', '2003', '2004'];
export const ROBOT_TAG_NAME_CN = '支援机械';

export const DATE_NOW = Date.now();
export const DATE_FILE_LAST_MOD = new Date(1556668800000);

export const LangMap: Record<string, string> = {
  cn: 'zh_CN',
  us: 'en_US',
  jp: 'ja_JP',
  kr: 'ko_KR',
};

/** 备用替换 */
export const GameDataReplaceMap: Record<string, string[] | undefined> = {
  stageTable: ['kr', 'jp', 'en'],
};

export const FormulasKeyMap = {
  WORKSHOP: 'workshopFormulas',
  MANUFACTURE: 'manufactFormulas',
} as const;
