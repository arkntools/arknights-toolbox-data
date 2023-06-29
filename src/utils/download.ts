import { writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { ensureDirSync, existsSync, writeJsonSync } from 'fs-extra';
import { size, uniqBy } from 'lodash';
import { setOutput } from '@actions/core';
import Jimp from 'jimp';
import { axios, isAxiosError } from './axios';
import { GAME_DATA_DIR } from 'constant';

interface DownloadImageParams {
  url: string;
  path: string;
  startLog?: string;
  tiny?: boolean;
  resize?: number;
}

interface DownloadImageByListParams {
  idList: string[];
  dirPath: string;
  resPathGetter: (id: string) => string;
  resize?: number;
}

const getImageResourceURL = (path: string) =>
  `https://raw.githubusercontent.com/yuanyan3060/Arknights-Bot-Resource/main/${path}`;

export const downloadImage = async ({ url, path, startLog, tiny, resize }: DownloadImageParams) => {
  if (existsSync(path)) return;
  if (startLog) console.log(startLog);

  // download
  let { data } = await axios.get<Buffer>(url.replace(/#/g, '%23'), { responseType: 'arraybuffer' });
  data = Buffer.from(data);

  // resize
  if (resize) {
    data = await (await Jimp.read(data)).resize(resize, Jimp.AUTO).deflateStrategy(0).getBufferAsync(Jimp.MIME_PNG);
  }

  // tiny
  if (tiny) {
    const {
      headers: { location: tinyResult },
    } = await axios.post('https://tinypng.com/backend/opt/shrink', data, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
    if (!tinyResult) throw new Error('Tiny png failed');
    const { data: tinyImage } = await axios.get(tinyResult, { responseType: 'arraybuffer' });
    data = Buffer.from(tinyImage);
  }

  await writeFile(path, data);
};

/**
 * @returns Failed ID list
 */
export const downloadImageByList = async ({ idList, dirPath, resPathGetter, resize }: DownloadImageByListParams) => {
  ensureDirSync(dirPath);

  const missList = idList.filter(id => !existsSync(join(dirPath, `${id}.png`)));
  const failedIdList: string[] = [];

  for (const id of missList) {
    const url = getImageResourceURL(resPathGetter(id));
    const download = async (retry = 3) => {
      try {
        await downloadImage({
          url,
          path: join(dirPath, `${id}.png`),
          startLog: `Download ${url} as ${id}.png`,
          tiny: true,
          resize,
        });
      } catch (error) {
        if (retry > 0 && isAxiosError(error) && error.response?.status !== 404) {
          console.log(String(error));
          console.log('Retry remain', retry);
          await download(retry - 1);
          return;
        }
        throw error;
      }
    };

    try {
      await download();
    } catch (error) {
      failedIdList.push(id);
      console.log(String(error));
      setOutput('need_retry', true);
    }
  }

  return failedIdList;
};

interface Config<T> {
  dir: string;
  resize?: number;
  items: T[];
}

type ItemConfig = Config<{
  id: string;
  iconId: string;
  rarity: number;
}>;

type CommonConfig = Config<{
  id: string;
  iconId: string;
}>;

interface RootConfig {
  avatar?: CommonConfig;
  buildingSkill?: CommonConfig;
  skill?: CommonConfig;
  item?: ItemConfig;
}

interface SetConfigOptions<T extends Config<any>> {
  dir: string;
  resize?: number;
  idList: string[];
  configGetter: (id: string) => T extends Config<infer P> ? P : never;
}

export class DownloadConfigBuilder {
  private config: RootConfig = {};

  public set<T extends keyof RootConfig>(
    type: T,
    { dir, resize, idList, configGetter }: SetConfigOptions<NonNullable<RootConfig[T]>>,
  ) {
    const missIdList = idList.filter(id => !existsSync(resolve(dir, `${id}.png`)));
    if (!missIdList.length) return;
    this.config[type] = {
      dir,
      resize,
      items: uniqBy(missIdList.map(configGetter), 'id'),
    } as RootConfig[T];
  }

  public write() {
    if (!size(this.config)) return;
    ensureDirSync(GAME_DATA_DIR);
    console.log('Write downloadConfig.json');
    const writePath = resolve(GAME_DATA_DIR, 'downloadConfig.json');
    writeJsonSync(writePath, this.config);
    setOutput('download_config', writePath);
  }
}
