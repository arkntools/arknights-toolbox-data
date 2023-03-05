import { axios, isAxiosError } from './axios';

export const retryGet = async <T = any>(url: string, retry = 10): Promise<T | undefined> => {
  try {
    const { data } = await axios.get<T>(url);
    console.log(`GET ${url}`);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      console.log(`NOT FOUND ${url}`);
      return;
    }
    if (retry <= 0) {
      console.error(`ERROR ${url}`);
      throw error;
    }
    console.log(`RETRY ${url}`);
    return await retryGet<T>(url, retry - 1);
  }
};
