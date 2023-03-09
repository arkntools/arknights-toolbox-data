import { each, invert, isNumber, mapValues, pickBy, pull, transform, without } from 'lodash-es';
import { transliterate } from 'transliteration';
import {
  ensureReadJsonSync,
  gameDataUrl,
  getNameForRecruitment,
  getRecruitmentTable,
  isOperator,
  writeFile,
  writeLocale,
} from './common';
import { retryGet } from './request';
import { getRichTextCss } from './css';
import { getPinyin } from './pinyin';
import { getRomaji } from './romaji';
import { downloadImageByList } from './download';
import { CharPosition, CharProfession } from 'types';
import type {
  ActivityTable,
  BuildingData,
  CharacterTable,
  CharPatchTable,
  DataJsonCharacter,
  GachaTable,
  GamedataConst,
  ItemTable,
  RetroTable,
  SkillTable,
  StageTable,
  UniequipTable,
  ZoneTable,
} from 'types';
import { AVATAR_IMG_DIR, GameDataReplaceMap, LangMap, ROBOT_TAG_NAME_CN } from 'constant';

interface GameData {
  characterTable: CharacterTable;
  buildingData: BuildingData;
  skillTable: SkillTable;
  gachaTable: GachaTable;
  itemTable: ItemTable;
  stageTable: StageTable;
  zoneTable: ZoneTable;
  charPatchTable: CharPatchTable;
  gamedataConst: GamedataConst;
  activityTable: ActivityTable;
  retroTable: RetroTable;
  uniequipTable: UniequipTable;
}

export class DataUpdater {
  /** 游戏数据 */
  private gameData!: Record<string, GameData>;

  private character!: DataJsonCharacter;

  /** 技能ID与描述MD5对应表 */
  // private buildingBuffId2DescriptionMd5: Record<string, string> = {};

  public async start() {
    await this.fetchGameData();

    for (const [locale, data] of Object.entries(this.gameData)) {
      const isCN = locale === 'cn';

      if (isCN) this.updateRichTextCss(data);
      this.updateTermDescription(data, locale);
      await this.updateCharacter(data, locale);

      // 升变处理
      const charPatchInfo = mapValues(charPatchTable.infos, ({ tmplIds }, id) => without(tmplIds, id));
    }
  }

  private async fetchGameData() {
    const gameData: Record<string, Record<string, any>> = mapValues(LangMap, () => ({}));
    const dataErrorMap: Record<string, Record<string, any>> = mapValues(LangMap, () => ({}));
    const fetchData = async (url: string) =>
      process.env.UPDATE_SOURCE === 'local' ? ensureReadJsonSync(url) : await retryGet(url);

    for (const langShort of Object.keys(LangMap)) {
      for (const [key, url] of Object.entries(gameDataUrl[langShort])) {
        try {
          const obj = await fetchData(url);
          if (typeof obj === 'string') throw new Error('Not json');
          gameData[langShort][key] = obj;
        } catch (error) {
          console.warn(`Error loading data ${url}`);
          dataErrorMap[langShort][key] = error;
        }
      }
    }

    each(dataErrorMap, (dataMap, lang) => {
      each(dataMap, (err, dataName) => {
        const replaces = pull(GameDataReplaceMap[dataName] || [], lang);
        if (replaces.length) {
          const useable = replaces.find(l => gameData[l][dataName]);
          if (useable) {
            gameData[lang][dataName] = gameData[useable][dataName];
            console.warn(`Use ${useable}/${dataName} instead of ${lang}/${dataName}`);
            return;
          }
        }
        console.error(`Cannot replace data ${lang} ${dataName}, origin error:`);
        console.error(err);
      });
    });

    this.gameData = gameData as any;
  }

  /** 基建技能富文本样式 */
  private updateRichTextCss({ gamedataConst }: GameData) {
    const className2color = transform(
      gamedataConst.richTextStyles,
      (obj, v, k) => {
        if (!k.startsWith('cc.')) return;
        const search = /<color=(#[\dA-F]+)>/.exec(v);
        if (search) obj[k.replace(/[^0-9a-zA-Z]/g, '-')] = search[1];
      },
      {} as Record<string, string>,
    );
    writeFile('richText.css', getRichTextCss(className2color));
  }

  /** 基建技能提示 */
  private updateTermDescription({ gamedataConst }: GameData, locale: string) {
    const termId2term = transform(
      gamedataConst.termDescriptionDict,
      (obj, { termName, description }, k) => {
        if (!k.startsWith('cc.')) return;
        obj[k.replace(/\W/g, '_')] = {
          name: termName,
          desc: description,
        };
      },
      {} as Record<string, { name: string; desc: string }>,
    );
    writeLocale(locale, 'term.json', termId2term);
  }

  private async updateCharacter({ gachaTable, characterTable }: GameData, locale: string) {
    const isCN = locale === 'cn';
    const recruitmentTable = getRecruitmentTable(gachaTable.recruitDetail);

    // 词条翻译
    const tagName2Id = transform(
      gachaTable.gachaTags,
      (obj, { tagId, tagName }) => {
        obj[tagName] = tagId;
      },
      {} as Record<string, number>,
    );
    writeLocale(locale, 'tag.json', invert(tagName2Id));

    // 名字翻译
    const nameId2Name = transform(
      pickBy(characterTable, isOperator),
      (obj, { name }, id) => {
        const shortId = id.replace(/^char_/, '');
        obj[shortId] = name.trim();
        const nameForRecruitment = getNameForRecruitment(name);
        if (nameForRecruitment in recruitmentTable) {
          this.character[shortId].recruitment[locale] = recruitmentTable[nameForRecruitment];
        }
      },
      {} as Record<string, string>,
    );
    writeLocale(locale, 'character.json', nameId2Name);

    if (isCN) {
      // 普通角色
      this.character = transform(
        pickBy(characterTable, isOperator),
        (obj, { name, appellation, position, tagList, rarity, profession }, id) => {
          const shortId = id.replace(/^char_/, '');
          if (rarity === 0 && !tagList.includes(ROBOT_TAG_NAME_CN)) {
            tagList.push(ROBOT_TAG_NAME_CN);
          }
          obj[shortId] = {
            pinyin: getPinyin(name),
            romaji: '',
            appellation: transliterate(appellation),
            star: rarity + 1,
            recruitment: {},
            position: CharPosition[position],
            profession: CharProfession[profession],
            tags: tagList.map(tagName => tagName2Id[tagName]).filter(isNumber),
          };
        },
        {} as DataJsonCharacter,
      );
    }

    // 获取罗马音
    if (locale === 'jp') {
      for (const [id, name] of Object.entries(nameId2Name)) {
        this.character[id].romaji = await getRomaji(name);
      }
    }

    // 下载头像
    if (isCN) {
      await downloadImageByList({
        idList: Object.keys(nameId2Name),
        dirPath: AVATAR_IMG_DIR,
        resPathGetter: id => `avatar/char_${id}.png`,
        resize: 80,
      });
    }
  }
}
