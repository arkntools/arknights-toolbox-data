import { map } from 'lodash-es';
import { stringify } from 'css';

const getCssObj = (className2color: Record<string, string>) => ({
  type: 'stylesheet',
  stylesheet: {
    rules: [
      {
        type: 'rule',
        selectors: [':root'],
        declarations: map(className2color, (value, className) => ({
          type: 'declaration',
          property: `--color-${className}`,
          value,
        })),
      },
      ...Object.keys(className2color).flatMap(className => [
        {
          type: 'rule',
          selectors: [`.${className}`],
          declarations: [
            {
              type: 'declaration',
              property: 'color',
              value: `var(--color-${className})`,
            },
          ],
        },
        {
          type: 'rule',
          selectors: [`.riic-term .${className}:before`],
          declarations: [
            {
              type: 'declaration',
              property: 'background-color',
              value: `var(--color-${className})`,
            },
          ],
        },
      ]),
    ],
  },
});

export const getRichTextCss = (className2color: Record<string, string>) => stringify(getCssObj(className2color));
