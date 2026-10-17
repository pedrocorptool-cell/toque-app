import Svg, { Circle, Path } from 'react-native-svg';

import { color as tokens } from '@/theme/tokens';

import { type IconName, iconShapes } from './shapes';

export type { IconName };

type IconProps = {
  name: IconName;
  size?: 14 | 16 | 24;
  color?: string;
};

export function Icon({ name, size = 24, color = tokens.textPrimary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {iconShapes[name].map((shape, i) => {
        if (shape.t === 'circle') {
          return <Circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} fill={color} />;
        }
        if (shape.t === 'stroke') {
          return (
            <Path
              key={i}
              d={shape.d}
              stroke={color}
              strokeWidth={shape.w}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }
        return <Path key={i} d={shape.d} fill={color} />;
      })}
    </Svg>
  );
}
