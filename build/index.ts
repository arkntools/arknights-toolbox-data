import { resolve, basename, extname } from 'path';
import {
  copySync,
  createReadStream,
  createWriteStream,
  emptyDirSync,
  ensureDirSync,
  existsSync,
  readFileSync,
  readJsonSync,
  renameSync,
  writeFileSync,
  writeJsonSync,
} from 'fs-extra';
import { globSync } from 'glob';
import { minify as minifyCss } from 'csso';
import calcMd5 from 'js-md5';
import calcFileMd5 from 'md5-file';
import JSZip from 'jszip';
import { version } from '../package.json';
import itemTable from '../assets/data/item.json';
import { DATE_FILE_LAST_MOD, ITEM_IMG_DIR, ITEM_PKG_ZIP } from 'constant';

const DIST_DIR = resolve(__dirname, '../dist');
const ASSETS_DIR = resolve(__dirname, '../assets');
const PUBLIC_DIR = resolve(__dirname, './public');

ensureDirSync(DIST_DIR);
emptyDirSync(DIST_DIR);

const minifyFile = (filePath: string) => {
  switch (extname(filePath)) {
    case '.json':
      writeJsonSync(filePath, readJsonSync(filePath));
      break;
    case '.css':
      writeFileSync(filePath, minifyCss(readFileSync(filePath).toString()).css);
      break;
  }
};

const normalizeDistFilePath = (filePath: string) =>
  filePath.replace(DIST_DIR, '').replaceAll('\\', '/').replace(/^\//, '');

const zipItemImgs = async () => {
  const zip = new JSZip();
  const itemImgs = Object.keys(itemTable)
    .map(id => `${id}.png`)
    .sort();
  itemImgs.forEach(filename => {
    const filepath = resolve(ITEM_IMG_DIR, filename);
    if (!existsSync(filepath)) return;
    zip.file(filename, createReadStream(filepath), { date: DATE_FILE_LAST_MOD });
  });
  await new Promise((resolve, reject) => {
    zip.generateNodeStream().pipe(createWriteStream(ITEM_PKG_ZIP)).on('finish', resolve).on('error', reject);
  });
  console.log('Item images have been packaged.');
};

(async () => {
  await zipItemImgs();

  copySync(ASSETS_DIR, DIST_DIR, { filter: src => !basename(src).startsWith('.') });

  const fileMap: Record<string, string> = {};

  for (const filePath of globSync(resolve(DIST_DIR, '**/*.{json,css,zip}'), { windowsPathsNoEscape: true })) {
    minifyFile(filePath);
    const md5 = (await calcFileMd5(filePath)).slice(0, 8);
    const newFilePath = filePath.replace(/\..*?$/, `.${md5}$&`);
    renameSync(filePath, newFilePath);
    fileMap[normalizeDistFilePath(filePath)] = md5;
    console.log(normalizeDistFilePath(newFilePath));
  }

  const mapContent = JSON.stringify(fileMap);
  const mapMd5 = calcMd5(mapContent).slice(0, 8);
  const mapFilename = `map.${mapMd5}.json`;
  writeFileSync(resolve(DIST_DIR, mapFilename), mapContent);
  console.log(mapFilename);

  writeJsonSync(resolve(DIST_DIR, 'check.json'), { mapMd5, timestamp: Date.now(), version });
  console.log('check.json');
})();

copySync(PUBLIC_DIR, DIST_DIR);
