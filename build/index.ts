import { resolve, basename, extname } from 'path';
import {
  copySync,
  emptyDirSync,
  ensureDirSync,
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
import { version } from '../package.json';

const DIST_DIR = resolve(__dirname, '../dist');
const ASSETS_DIR = resolve(__dirname, '../assets');
const PUBLIC_DIR = resolve(__dirname, './public');

ensureDirSync(DIST_DIR);
emptyDirSync(DIST_DIR);
copySync(ASSETS_DIR, DIST_DIR, { filter: src => !basename(src).startsWith('.') });

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

(async () => {
  const fileMap: Record<string, string> = {};

  for (const filePath of globSync(resolve(DIST_DIR, '**/*.{json,css,zip}'), { windowsPathsNoEscape: true })) {
    minifyFile(filePath);
    const md5 = (await calcFileMd5(filePath)).slice(0, 8);
    const newFilePath = filePath.replace(/\..*?$/, `.${md5}$&`);
    renameSync(filePath, newFilePath);
    fileMap[normalizeDistFilePath(filePath)] = md5;
    console.log(normalizeDistFilePath(newFilePath));
  }

  const sumMd5 = calcMd5(Object.values(fileMap).sort().join());
  console.log(sumMd5);

  writeJsonSync(resolve(DIST_DIR, 'map.json'), fileMap);
  writeJsonSync(resolve(DIST_DIR, 'check.json'), { md5: sumMd5, timestamp: Date.now(), version });
})();

copySync(PUBLIC_DIR, DIST_DIR);
