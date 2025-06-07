import { readJsonSync } from 'fs-extra';
import { size } from 'lodash';
import { resolve } from 'path';

const curDir: string = (import.meta as any).dirname;

const buildingJson = readJsonSync(resolve(curDir, '../assets/data/building.json'));
const buildingLocale = readJsonSync(resolve(curDir, '../assets/locales/cn/building.json'));
const ignoreSet = new Set(readJsonSync(resolve(curDir, './checkBuildingBuffIgnore.json')));

const notProcessedDescMd5List = Object.keys(buildingJson.buff.info).filter(
  k => !ignoreSet.has(k) && !size(buildingJson.buff.info[k].num),
);
const notProcessedDescList = notProcessedDescMd5List.map(k => buildingLocale.buff.description[k]);

console.log(JSON.stringify(notProcessedDescMd5List));
notProcessedDescList.forEach(desc => {
  console.log(desc);
});
