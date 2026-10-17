import { Text, type TextProps } from 'react-native';

import { color, text } from '@/theme/tokens';

export type TextVariant = keyof typeof text;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
};

export function AppText({ variant = 'body', color: tint = color.textPrimary, style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[text[variant], { color: tint }, style]} />;
}
