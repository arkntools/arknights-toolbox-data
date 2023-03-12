import { writeFile } from 'fs/promises';
import { join } from 'path';
import { ensureDirSync, existsSync } from 'fs-extra';
import { random, range } from 'lodash';
import sharp from 'sharp';
import { setOutput } from '@actions/core';
import { axios, isAxiosError } from './axios';

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

const getRandomIP = () =>
  range(4)
    .map(() => random(1, 254))
    .join('.');

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
    data = await sharp(data).resize(resize).png().toBuffer();
  }

  // tiny
  if (tiny) {
    const { data: tinyResult } = await axios.post('https://tinypng.com/web/shrink', data, {
      headers: {
        'Content-Type': 'image/png',
        'X-Forwarded-For': getRandomIP(),
      },
    });
    const { data: tinyImage } = await axios.get(tinyResult.output.url, { responseType: 'arraybuffer' });
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
