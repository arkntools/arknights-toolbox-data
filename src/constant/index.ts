import { resolve } from 'path';

const IMG_DIR = resolve(__dirname, '../../assets/img');

export const AVATAR_IMG_DIR = resolve(IMG_DIR, 'avatar');
export const SKILL_IMG_DIR = resolve(IMG_DIR, 'skill');
export const BUILDING_SKILL_IMG_DIR = resolve(IMG_DIR, 'building_skill');
export const ITEM_IMG_DIR = resolve(IMG_DIR, 'item');
export const ITEM_PKG_ZIP = resolve(__dirname, '../../assets/pkg/item.zip');
export const NOW = Date.now();

export const PURCHASE_CERTIFICATE_ID = '4006';
export const EXT_ITEM = ['4001', 'AP_GAMEPLAY', '2001', '2002', '2003', '2004'];
export const ROBOT_TAG_NAME_CN = '支援机械';

export const LangMap = {
  cn: 'zh_CN',
  tw: 'zh_TW',
  us: 'en_US',
  jp: 'ja_JP',
  kr: 'ko_KR',
} as const;

/** 备用替换 */
export const GameDataReplaceMap = {
  stageTable: ['kr', 'jp', 'en'],
} as const;

export const FormulasKeyMap = {
  WORKSHOP: 'workshopFormulas',
  MANUFACTURE: 'manufactFormulas',
} as const;
