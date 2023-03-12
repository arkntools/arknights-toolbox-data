import { map } from 'lodash';
import { pinyin, customPinyin } from 'pinyin-pro';

customPinyin({
  薄: 'bo',
  栎: 'li',
  重: 'chong',
  仇白: 'qiu bai',
});

const joinPinyin = (arr: string[]) => arr.join('');

export const getPinyin = (text: string) => {
  if (/^[\w\s-]*$/.test(text)) return { full: '', head: '' };
  const py = pinyin(text, {
    toneType: 'none',
    type: 'array',
    v: true,
  });
  return {
    full: joinPinyin(py),
    head: joinPinyin(map(py, 0)),
  };
};
