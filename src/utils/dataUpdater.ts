import _, {
  each,
  invert,
  isNumber,
  map,
  mapKeys,
  mapValues,
  omitBy,
  pad,
  pick,
  pickBy,
  pull,
  size,
  some,
  sumBy,
  transform,
  uniq,
  without,
} from 'lodash';
import { transliterate } from 'transliteration';
import md5 from 'js-md5';
import {
  ensureReadJsonSync,
  gameDataUrl,
  getEquipMaterialListObject,
  getFormula,
  getMaterialListObject,
  getNameForRecruitment,
  getRecruitmentTable,
  getHasDropStageList,
  idStandardization,
  isBattleRecord,
  isItem,
  isOperator,
  revIdStandardization,
  sortObjectBy,
  writeText,
  writeLocale,
  writeData,
  checkObjsNotEmpty,
  getItemType,
  writeOtherData,
  fixEnumNum,
  forceEnumNum,
  fixI18nKey,
} from './common';
import { retryGet } from './request';
import { getRichTextCss } from './css';
import { getPinyin } from './pinyin';
import { getRomaji } from './romaji';
import { DownloadConfigBuilder, downloadImageByList } from './download';
import { processBuildingSkills } from './buildingSkills';
import { objS2tw, objS2twp } from './s2t';
import { CharPosition, CharProfession, OccPercent, RarityRank, RetroType, StageDropType } from 'types';
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
  DataJsonUnopenedStage,
  DataEventInfoMap,
  DataJsonEvent,
  DataJsonDrop,
  DataJsonRetro,
  DataJsonStage,
  DataDrop,
  DataJsonItem,
  DataCharCultivate,
  DataJsonCultivate,
  DataJsonBuildingBuff,
  DataJsonBuildingChar,
  AkhrData,
  DataJsonUniequip,
  DataEventInfo,
  DataCharacter,
} from 'types';
import {
  AVATAR_IMG_DIR,
  BUILDING_SKILL_IMG_DIR,
  CHIP_ASSISTANT_ID,
  EXT_ITEM,
  GameDataReplaceMap,
  ITEM_IMG_DIR,
  LangMap,
  DATE_NOW,
  PURCHASE_CERTIFICATE_ID,
  ROBOT_TAG_NAME_CN,
  SKILL_IMG_DIR,
  HAS_TW_DATA,
  UPDATE_FROM_ARKNTOOLS,
  UNIEQUIP_IMG_DIR,
} from 'constant';

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
  private gameData: Record<string, GameData> = {};
  private characterInfo: DataJsonCharacter = {};
  private unopenedStage: DataJsonUnopenedStage = {};
  private cnStageList: string[] = [];
  private eventInfo: DataJsonEvent = {};
  private readonly dropInfo: DataJsonDrop = { event: {}, retro: {} };
  private retroInfo: DataJsonRetro = {};
  private readonly stageInfo: DataJsonStage = { normal: {}, event: {}, retro: {} };
  private itemInfo: DataJsonItem = {};
  private buildingDescMd5MinLen = 0;
  private buildingBuffId2DescriptionMd5: Record<string, string> = {};

  private readonly downloadConfig = new DownloadConfigBuilder();

  public async start() {
    await this.fetchGameData();

    for (const [locale, data] of Object.entries(this.gameData)) {
      const isCN = locale === 'cn';

      if (isCN) {
        this.updateRichTextCss(data);
        this.updateUniequipInfo(data);
      }
      this.updateTermDescription(data, locale);
      await this.updateCharacterInfo(data, locale);
      this.updateUnopenedStage(data, locale);
      this.updateEventDrop(data);
      this.updateEventInfo(data, locale);
      this.updateRetroInfo(data, locale);
      this.updateRetroDrop(data);
      this.updateZoneInfo(data, locale);
      this.updateStageInfo(data, locale);
      this.updateItemInfo(data, locale);
      await this.updateItemData(data, locale);
      await this.updateSkillInfo(data, locale);
      await this.updateBuildingInfo(data, locale);
    }

    writeData('character.json', this.characterInfo);
    writeData('item.json', this.itemInfo);
    writeData('unopenedStage.json', this.unopenedStage);
    checkObjsNotEmpty(...Object.values(this.stageInfo));
    writeData('stage.json', this.stageInfo);
    writeData('drop.json', this.dropInfo);
    writeData('retro.json', this.retroInfo);
    writeData('event.json', this.eventInfo);

    this.downloadConfig.write();

    console.log('Update completed');
  }

  private async fetchGameData() {
    const gameData: Record<string, Record<string, any>> = mapValues(LangMap, () => ({}));
    const dataErrorMap: Record<string, Record<string, any>> = mapValues(LangMap, () => ({}));
    const fetchData = async (url: string) =>
      url.startsWith('https://') ? await retryGet(url) : ensureReadJsonSync(url);

    for (const langShort of Object.keys(LangMap)) {
      for (const [key, url] of Object.entries(gameDataUrl[langShort])) {
        try {
          const obj = await fetchData(url);
          if (typeof obj === 'string') throw new Error('Not json');
          gameData[langShort][key] = obj;
        } catch (error) {
          console.warn(`Error loading data ${url}`);
          console.warn(error);
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
    writeText('richText.css', getRichTextCss(className2color));
  }

  /** 基建技能提示 */
  private updateTermDescription({ gamedataConst }: GameData, locale: string) {
    const termId2term = transform(
      gamedataConst.termDescriptionDict,
      (obj, { termName, description }, k) => {
        if (!k.startsWith('cc.')) return;
        obj[k.replace(/\W/g, '_')] = {
          name: termName,
          desc: description.replaceAll('\r', ''),
        };
      },
      {} as Record<string, { name: string; desc: string }>,
    );
    writeLocale(locale, 'term.json', termId2term);
    if (locale === 'cn' && !HAS_TW_DATA) {
      writeLocale('tw', 'term.json', mapValues(termId2term, objS2twp));
    }
  }

  private async updateCharacterInfo({ gachaTable, characterTable }: GameData, locale: string) {
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
    const tagId2Name = invert(tagName2Id);
    writeLocale(locale, 'tag.json', tagId2Name);

    if (isCN) {
      const akhrData: AkhrData = { char: {}, tag: tagId2Name };

      // 普通角色
      this.characterInfo = transform(
        pickBy(characterTable, isOperator),
        (obj, { name, appellation, position, tagList, rarity, profession }, id) => {
          rarity = fixEnumNum(rarity, -1);
          const shortId = id.replace(/^char_/, '');
          if (rarity === 0 && !tagList.includes(ROBOT_TAG_NAME_CN)) {
            tagList.push(ROBOT_TAG_NAME_CN);
          }
          const charData: DataCharacter = {
            pinyin: getPinyin(name),
            romaji: '',
            appellation,
            star: rarity + 1,
            recruitment: {},
            position: CharPosition[position],
            profession: CharProfession[profession],
            tags: tagList.map(tagName => tagName2Id[tagName]).filter(isNumber),
          };
          const appellationTransl = transliterate(appellation);
          if (appellationTransl !== appellation) {
            charData.appellationTransl = appellationTransl;
          }
          obj[shortId] = charData;
          if (getNameForRecruitment(name) in recruitmentTable) {
            akhrData.char[name] = {
              star: charData.star,
              tags: [charData.profession, charData.position, ...charData.tags],
            };
          }
        },
        {} as DataJsonCharacter,
      );

      writeOtherData('akhr.json', akhrData);
    }

    // 名字翻译
    const nameId2Name = transform(
      pickBy(characterTable, isOperator),
      (obj, { name }, id) => {
        const shortId = id.replace(/^char_/, '');
        obj[shortId] = name.trim();
        const nameForRecruitment = getNameForRecruitment(name);
        if (nameForRecruitment in recruitmentTable) {
          this.characterInfo[shortId].recruitment[locale] = recruitmentTable[nameForRecruitment];
        }
      },
      {} as Record<string, string>,
    );
    writeLocale(locale, 'character.json', nameId2Name);
    if (isCN && !HAS_TW_DATA) {
      writeLocale('tw', 'character.json', objS2tw(nameId2Name));
    }

    // 获取罗马音
    if (locale === 'jp') {
      for (const [id, name] of Object.entries(nameId2Name)) {
        this.characterInfo[id].romaji = await getRomaji(name);
      }
    }

    // 下载头像
    if (isCN) {
      const avatarIdList = Object.keys(nameId2Name);
      if (UPDATE_FROM_ARKNTOOLS) {
        this.downloadConfig.set('avatar', {
          dir: AVATAR_IMG_DIR,
          resize: 80,
          idList: avatarIdList,
          configGetter: id => ({ id, iconId: `char_${id}` }),
        });
      } else {
        await downloadImageByList({
          idList: avatarIdList,
          dirPath: AVATAR_IMG_DIR,
          resPathGetter: id => `avatar/char_${id}.png`,
          resize: 80,
        });
      }
    }
  }

  private updateUnopenedStage({ stageTable }: GameData, locale: string) {
    if (locale === 'cn') {
      this.cnStageList = getHasDropStageList(stageTable.stages);
      this.unopenedStage[locale] = [];
    } else {
      const stageList = getHasDropStageList(stageTable.stages);
      this.unopenedStage[locale] = without(this.cnStageList, ...stageList);
    }
  }

  private updateEventInfo({ zoneTable, stageTable }: GameData, locale: string) {
    this.eventInfo[locale] = transform(
      zoneTable.zoneValidInfo,
      (obj, valid, zoneID) => {
        if (
          zoneTable.zones[zoneID].type === 'ACTIVITY' &&
          DATE_NOW < valid.endTs * 1000 &&
          zoneID in this.dropInfo.event
        ) {
          obj[zoneID] = { valid };
        }
      },
      {} as DataEventInfoMap,
    );

    // 五周年主线这种掉落替换活动
    each(stageTable.timelyStageDropInfo, ({ timelyGroupId, startTs, endTs, isReplace }) => {
      if (!isReplace || DATE_NOW >= endTs * 1000) return;
      const info: DataEventInfo = {
        valid: { startTs, endTs },
        drop: {},
      };
      const { dropInfo } = stageTable.timelyTable[timelyGroupId];
      each(dropInfo, ({ displayRewards, displayDetailRewards }, stageId) => {
        if (stageId.startsWith('tough_')) return;
        const { code } = stageTable.stages[stageId];
        const mainRewardIds = new Set(
          map(
            displayRewards.filter(
              ({ id, dropType }) => isItem(id) && forceEnumNum(dropType, StageDropType) !== StageDropType.ONCE,
            ),
            'id',
          ),
        );
        displayDetailRewards
          .filter(({ id }) => mainRewardIds.has(id))
          .forEach(({ id, occPercent }) => {
            if (!(id in info.drop!)) info.drop![id] = {};
            info.drop![id][code] = forceEnumNum(occPercent, OccPercent);
          });
      });
      this.eventInfo[locale][timelyGroupId] = info;
    });
  }

  private updateEventDrop({ stageTable }: GameData) {
    each(
      pickBy(
        stageTable.stages,
        ({ stageType, zoneId }) => stageType === 'ACTIVITY' && !(zoneId in this.dropInfo.event),
      ),
      ({ code, zoneId, stageDropInfo: { displayRewards, displayDetailRewards } }) => {
        const mainRewardIds = new Set(
          map(
            displayRewards.filter(
              ({ id, dropType }) => isItem(id) && forceEnumNum(dropType, StageDropType) !== StageDropType.ONCE,
            ),
            'id',
          ),
        );
        displayDetailRewards
          .filter(({ id }) => mainRewardIds.has(id))
          .forEach(({ id, occPercent }) => {
            if (!(zoneId in this.dropInfo.event)) this.dropInfo.event[zoneId] = {};
            const eventDrop = this.dropInfo.event[zoneId];
            if (!(id in eventDrop)) eventDrop[id] = {};
            eventDrop[id][code] = forceEnumNum(occPercent, OccPercent);
          });
      },
    );
  }

  private updateRetroInfo({ retroTable }: GameData, locale: string) {
    this.retroInfo[locale] = {};
    each(retroTable.retroActList, item => {
      this.retroInfo[locale][fixI18nKey(item.retroId)] = {
        type: forceEnumNum(item.type, RetroType),
        ...pick(item, ['startTime', 'linkedActId']),
      };
    });
  }

  private updateRetroDrop({ retroTable }: GameData) {
    each(
      pickBy(retroTable.stageList, ({ zoneId }) => !(zoneId in this.dropInfo.retro)),
      ({ zoneId, code, stageDropInfo }) => {
        const rewardTable = mapKeys(stageDropInfo.displayDetailRewards, 'id');
        stageDropInfo.displayRewards.forEach(({ id }) => {
          if (!isItem(id)) return;
          if (!(zoneId in this.dropInfo.retro)) this.dropInfo.retro[zoneId] = {};
          const eventDrop = this.dropInfo.retro[zoneId];
          if (!(id in eventDrop)) eventDrop[id] = {};
          eventDrop[id][code] = forceEnumNum(rewardTable[id].occPercent, OccPercent);
        });
      },
    );
  }

  private updateZoneInfo({ zoneTable, activityTable, retroTable }: GameData, locale: string) {
    const isCN = locale === 'cn';
    const zoneId2Name: Record<string, string> = {};

    // 主线
    each(zoneTable.zones, ({ type, zoneID, zoneNameFirst, zoneNameSecond }) => {
      if (type === 'MAINLINE' || type === 'WEEKLY') {
        zoneId2Name[zoneID] =
          zoneNameFirst && zoneNameSecond ? `${zoneNameFirst} ${zoneNameSecond}` : zoneNameFirst || zoneNameSecond;
      }
    });

    const isActivityType = (type: string) => type.startsWith('TYPE_ACT') || type === 'MINISTORY' || type === 'DEFAULT';

    // 活动
    each(activityTable.basicInfo, ({ id, type, name }) => {
      if (isActivityType(type)) {
        zoneId2Name[id] = isCN ? name.replace('·', '・') : name;
      }
    });

    // 插曲 & 别传
    each(retroTable.retroActList, ({ retroId, type, name }) => {
      zoneId2Name[fixI18nKey(retroId)] = `${name}@:(retroNameAppend.${forceEnumNum(type, RetroType)})`;
    });

    writeLocale(locale, 'zone.json', zoneId2Name);

    if (isCN) {
      if (!HAS_TW_DATA) writeLocale('tw', 'zone.json', objS2twp(zoneId2Name));
      writeData('zone.json', {
        zoneToActivity: _.omitBy(activityTable.zoneToActivity, (actId, zoneId) =>
          isActivityType(activityTable.basicInfo[actId].type),
        ),
        zoneToRetro: mapValues(retroTable.zoneToRetro, fixI18nKey),
      });
    }
  }

  private updateStageInfo({ stageTable, retroTable }: GameData, locale: string) {
    const validStages = pickBy(stageTable.stages, stage =>
      stage.stageDropInfo.displayDetailRewards.some(({ type }) => type === 'MATERIAL'),
    );

    // 主线 & 活动
    if (locale === 'cn') {
      const stageTypeSet = new Set(['MAIN', 'SUB', 'DAILY']);
      each(validStages, ({ stageType, stageId, zoneId, code, apCost }) => {
        if (!stageTypeSet.has(stageType)) return;
        if (!(zoneId in this.stageInfo.normal)) this.stageInfo.normal[zoneId] = {};
        this.stageInfo.normal[zoneId][stageId] = { code, cost: apCost };
      });
    }

    // 活动
    const existEventZoneSet = new Set(Object.keys(this.stageInfo.event));
    each(validStages, ({ stageType, stageId, zoneId, code, apCost }) => {
      if (stageType !== 'ACTIVITY' || existEventZoneSet.has(zoneId)) return;
      if (!(zoneId in this.stageInfo.event)) this.stageInfo.event[zoneId] = {};
      this.stageInfo.event[zoneId][stageId] = { code, cost: apCost };
    });

    // 插曲 & 别传
    const existRetroZoneSet = new Set(Object.keys(this.stageInfo.retro));
    each(retroTable.stageList, ({ stageId, zoneId, code, apCost, stageDropInfo: { displayDetailRewards } }) => {
      if (!displayDetailRewards.some(({ type }) => type === 'MATERIAL') || existRetroZoneSet.has(zoneId)) {
        return;
      }
      if (!(zoneId in this.stageInfo.retro)) this.stageInfo.retro[zoneId] = {};
      this.stageInfo.retro[zoneId][stageId] = { code, cost: apCost };
    });
  }

  private updateItemInfo({ itemTable, stageTable, buildingData }: GameData, locale: string) {
    if (locale !== 'cn') {
      each(
        pickBy(itemTable.items, ({ itemId }) => itemId in this.itemInfo),
        ({ itemId, sortId }) => {
          this.itemInfo[itemId].sortId[locale] = sortId;
        },
      );
      return;
    }

    // 一般道具
    each(
      pickBy(itemTable.items, ({ itemId }) => isItem(itemId)),
      ({ itemId, rarity, sortId, stageDropList, buildingProductList }) => {
        this.itemInfo[itemId] = {
          type: getItemType(itemId),
          sortId: {
            [locale]: sortId,
          },
          rare: forceEnumNum(rarity, RarityRank) + 1,
          drop: sortObjectBy(
            transform(
              stageDropList,
              (drop, { stageId, occPer }) => {
                if (!stageTable.stages[stageId]) return; // fix data bug
                const { stageType, code } = stageTable.stages[stageId];
                if (stageType === 'MAIN' || stageType === 'SUB') drop[code] = OccPercent[occPer];
              },
              {} as DataDrop,
            ),
            k =>
              k
                .replace(/^[^0-9]+/, '')
                .split('-')
                .map(c => pad(c, 3, '0'))
                .join(''),
          ),
          ...getFormula(buildingProductList, buildingData)!,
        };
      },
    );

    // 芯片、技巧概要等掉落
    each(stageTable.stages, ({ code, stageType, stageDropInfo: { displayDetailRewards } }) => {
      if (stageType !== 'DAILY') return;
      displayDetailRewards.forEach(({ id, dropType, occPercent }) => {
        dropType = forceEnumNum(dropType, StageDropType);
        if (id in this.itemInfo && dropType !== StageDropType.ONCE) {
          this.itemInfo[id].drop[code] = forceEnumNum(occPercent, OccPercent);
        }
      });
    });

    // 芯片助剂单独处理
    this.itemInfo[CHIP_ASSISTANT_ID].formula = {
      [PURCHASE_CERTIFICATE_ID]: 90,
    };
  }

  private async updateItemData({ itemTable }: GameData, locale: string) {
    const isCN = locale === 'cn';

    const itemId2Name = transform(
      pickBy(itemTable.items, ({ itemId }) => isItem(itemId)),
      (obj, { itemId, name }) => {
        obj[itemId] = name;
      },
      {} as Record<string, string>,
    );
    writeLocale(locale, 'material.json', itemId2Name);
    if (isCN && !HAS_TW_DATA) {
      writeLocale('tw', 'material.json', objS2twp(itemId2Name));
    }

    const extItemId2Name = mapValues(pick(itemTable.items, EXT_ITEM), ({ name }, id) =>
      isBattleRecord(id) ? name.replace(/作战记录|作戰記錄| Battle Record|作戦記録|작전기록/, '') : name,
    );
    writeLocale(locale, 'item.json', extItemId2Name);

    if (!isCN) return;

    // 下载材料图片
    const itemIdList = Object.keys(itemId2Name);
    if (UPDATE_FROM_ARKNTOOLS) {
      this.downloadConfig.set('item', {
        dir: ITEM_IMG_DIR,
        idList: itemIdList,
        configGetter: id => ({
          id,
          iconId: itemTable.items[id].iconId,
          rarity: forceEnumNum(itemTable.items[id].rarity, RarityRank),
        }),
      });
    } else {
      await downloadImageByList({
        idList: itemIdList,
        dirPath: ITEM_IMG_DIR,
        resPathGetter: id => `item/${itemTable.items[id].iconId}.png`,
      });
    }
  }

  private async updateSkillInfo(
    { characterTable, skillTable, uniequipTable, charPatchTable, stageTable }: GameData,
    locale: string,
  ) {
    const isCN = locale === 'cn';

    // 技能
    const opSkillTable = mapKeys(
      omitBy(skillTable, (v, k) => k.startsWith('sktok_')),
      (v, k) => idStandardization(k),
    );
    const skillId2Name = mapValues(opSkillTable, ({ levels }) => levels[0].name);
    const skillId2AddonInfo = mapValues(opSkillTable, ({ iconId }) =>
      iconId ? { icon: idStandardization(iconId) } : undefined,
    );
    writeLocale(locale, 'skill.json', skillId2Name);
    if (isCN && !HAS_TW_DATA) {
      writeLocale('tw', 'skill.json', objS2twp(skillId2Name));
    }

    // 模组
    const uniequipId2Name = mapValues(
      pickBy(
        uniequipTable ? uniequipTable.equipDict : {},
        ({ itemCost }) => itemCost && some(itemCost, cost => cost.some(({ id }) => isItem(id))),
      ),
      'uniEquipName',
    );
    writeLocale(locale, 'uniequip.json', uniequipId2Name);

    if (!isCN) return;

    // 升变
    const charPatchInfo = mapValues(charPatchTable.infos, ({ tmplIds }, id) => without(tmplIds, id));

    const cultivate = transform(
      pickBy(characterTable, isOperator),
      (obj, { phases, allSkillLvlup, skills }, id) => {
        const shortId = id.replace(/^char_/, '');

        // 升变处理
        if (id in charPatchInfo) {
          charPatchInfo[id].forEach(patchId => {
            const unlockStages = charPatchTable.unlockConds[patchId].conds.map(
              ({ stageId }) => stageTable.stages[stageId].code,
            );
            const patchSkills = charPatchTable.patchChars[patchId].skills;
            patchSkills.forEach(skill => {
              skill.isPatch = true;
              skill.unlockStages = unlockStages;
            });
            skills.push(...patchSkills);
          });
        }

        // 精英化
        const evolve = phases
          .filter(({ evolveCost }) => evolveCost?.length)
          .map(({ evolveCost }) => getMaterialListObject(evolveCost));

        // 通用技能
        const normal = allSkillLvlup.map(({ lvlUpCost }) => getMaterialListObject(lvlUpCost));

        // 精英技能
        const elite = skills
          .map(({ skillId, levelUpCostCond, isPatch, unlockStages }) => ({
            name: idStandardization(skillId),
            ...skillId2AddonInfo[skillId],
            cost: levelUpCostCond.map(({ levelUpCost }) => getMaterialListObject(levelUpCost)),
            ...(isPatch ? { isPatch, unlockStages } : {}),
          }))
          .filter(({ cost }) => cost.length);

        // 模组
        const uniequip = map(
          pickBy(uniequipTable.equipDict, ({ charId, uniEquipId }) => charId === id && uniEquipId in uniequipId2Name),
          ({ uniEquipId, itemCost }) => ({
            id: uniEquipId,
            cost: getEquipMaterialListObject(itemCost),
          }),
        );

        const final: DataCharCultivate = {
          evolve: evolve.every(obj => size(obj)) ? evolve : [],
          skills: {
            normal,
            elite,
          },
          uniequip,
        };
        if (sumBy([final.evolve, normal, elite, uniequip], 'length')) {
          obj[shortId] = final;
        }
      },
      {} as DataJsonCultivate,
    );
    writeData('cultivate.json', cultivate);

    // 下载技能图标
    const skilIdList = map(skillId2AddonInfo, (v, k) => v?.icon || k);
    if (UPDATE_FROM_ARKNTOOLS) {
      this.downloadConfig.set('skill', {
        dir: SKILL_IMG_DIR,
        resize: 72,
        idList: skilIdList,
        configGetter: id => ({ id, iconId: `skill_icon_${revIdStandardization(id)}` }),
      });
    } else {
      await downloadImageByList({
        idList: skilIdList,
        dirPath: SKILL_IMG_DIR,
        resPathGetter: id => `skill/skill_icon_${revIdStandardization(id)}.png`,
        resize: 72,
      });
    }
  }

  private async updateBuildingInfo({ buildingData, characterTable }: GameData, locale: string) {
    const isCN = locale === 'cn';
    const buffId2Name: Record<string, string> = {};
    const buffMd52Description: Record<string, string> = {};
    const roomEnum2Name = mapValues(buildingData.rooms, ({ name }) => name);

    const buffMigration = (() => {
      if (isCN) return {};
      const cnData = this.gameData.cn.buildingData.chars;
      return transform(
        buildingData.chars,
        (map, { buffChar }, cid) => {
          buffChar.forEach(({ buffData }, i) => {
            buffData.forEach(({ buffId }, j) => {
              const cnBuffId = cnData[cid]?.buffChar[i]?.buffData[j]?.buffId;
              if (cnBuffId && cnBuffId !== buffId) map[buffId] = cnBuffId;
            });
          });
        },
        {} as Record<string, string>,
      );
    })();

    const buildingBuffs = transform(
      buildingData.buffs,
      (obj, { buffId, buffName, skillIcon, roomType, description }) => {
        const stdBuffId = idStandardization(!isCN && buffId in buffMigration ? buffMigration[buffId] : buffId);
        buffId2Name[stdBuffId] = buffName;
        const descriptionMd5 = (() => {
          if (isCN) {
            const dMd5 = md5(description);
            this.buildingBuffId2DescriptionMd5[stdBuffId] = dMd5;
            return dMd5;
          } else if (stdBuffId in this.buildingBuffId2DescriptionMd5) {
            return this.buildingBuffId2DescriptionMd5[stdBuffId];
          }
          console.error(`Building buff "${buffId}" from ${locale.toUpperCase()} is not in CN`);
        })();
        if (!descriptionMd5) return;
        buffMd52Description[descriptionMd5] = description;
        if (!isCN) return;
        obj.description[stdBuffId] = descriptionMd5;
        obj.data[stdBuffId] = { icon: skillIcon, desc: '' };
        obj.info[descriptionMd5] = { building: roomType, num: {}, is: {} };
      },
      { description: {}, data: {}, info: {} } as DataJsonBuildingBuff & {
        description: Record<string, string>;
      },
    );

    if (isCN) {
      const buildingChars = transform(
        pickBy(buildingData.chars, (c, id) => isOperator(characterTable[id], id)),
        (obj, { charId, buffChar }) => {
          const shortId = charId.replace(/^char_/, '');
          const skills = buffChar.flatMap(({ buffData }) =>
            buffData.map(({ buffId, cond: { phase, level } }) => ({
              id: idStandardization(buffId),
              unlock: `${fixEnumNum(phase)}_${level}`,
            })),
          );
          if (skills.length) obj[shortId] = skills;
        },
        {} as DataJsonBuildingChar,
      );

      // 找到 MD5 最小不公共前缀以压缩
      this.buildingDescMd5MinLen = (() => {
        const md5List = Object.keys(buffMd52Description);
        let md5Len = 3;
        let tmpList: string[];
        do {
          md5Len++;
          tmpList = md5List.map(str => str.slice(0, md5Len));
        } while (md5List.length !== uniq(tmpList).length);
        return md5Len;
      })();
      buildingBuffs.description = mapValues(buildingBuffs.description, str => str.slice(0, this.buildingDescMd5MinLen));
      buildingBuffs.info = mapKeys(buildingBuffs.info, (v, k) => k.slice(0, this.buildingDescMd5MinLen));
      this.buildingBuffId2DescriptionMd5 = mapValues(this.buildingBuffId2DescriptionMd5, str =>
        str.slice(0, this.buildingDescMd5MinLen),
      );

      // 基建技能分类及数值计入
      const { info, numKey } = processBuildingSkills(
        buildingBuffs.info,
        mapKeys(buffMd52Description, (v, k) => k.slice(0, this.buildingDescMd5MinLen)),
      );
      buildingBuffs.info = info;
      buildingBuffs.numKey = numKey;

      // 合并数据
      each(buildingBuffs.data, (data, id) => {
        data.desc = buildingBuffs.description[id];
      });
      // @ts-expect-error
      delete buildingBuffs.description;

      checkObjsNotEmpty(buildingChars, ...Object.values(buildingBuffs));
      writeData('building.json', { char: buildingChars, buff: buildingBuffs });

      // 下载图标
      const buildingSkillIdList = map(buildingBuffs.data, 'icon');
      if (UPDATE_FROM_ARKNTOOLS) {
        this.downloadConfig.set('buildingSkill', {
          dir: BUILDING_SKILL_IMG_DIR,
          idList: buildingSkillIdList,
          configGetter: id => ({ id, iconId: id }),
        });
      } else {
        await downloadImageByList({
          idList: buildingSkillIdList,
          dirPath: BUILDING_SKILL_IMG_DIR,
          resPathGetter: id => `building_skill/${id}.png`,
        });
      }
    }

    checkObjsNotEmpty(roomEnum2Name, buffId2Name, buffMd52Description);
    writeLocale(locale, 'building.json', {
      name: roomEnum2Name,
      buff: {
        name: buffId2Name,
        description: mapKeys(buffMd52Description, (v, k) => k.slice(0, this.buildingDescMd5MinLen)),
      },
    });

    if (isCN && !HAS_TW_DATA) {
      writeLocale('tw', 'building.json', {
        name: objS2twp(roomEnum2Name),
        buff: {
          name: objS2twp(buffId2Name),
          description: objS2twp(mapKeys(buffMd52Description, (v, k) => k.slice(0, this.buildingDescMd5MinLen))),
        },
      });
    }
  }

  private updateUniequipInfo({ uniequipTable }: GameData) {
    const typeIconSet = new Set<string>();
    const info = transform(
      uniequipTable.equipDict,
      (obj, { uniEquipId, typeIcon }) => {
        if (typeIcon !== 'original') {
          typeIcon = typeIcon.toLowerCase();
          obj[uniEquipId] = { typeIcon };
          typeIconSet.add(typeIcon);
        }
      },
      {} as DataJsonUniequip,
    );

    writeData('uniequip.json', info);

    this.downloadConfig.set('uniequip', {
      dir: UNIEQUIP_IMG_DIR,
      idList: Array.from(typeIconSet),
      configGetter: id => ({ id, iconId: id }),
    });
  }
}
