import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, TextButton } from '@/components/ui';
import { color, font, space } from '@/theme/tokens';

const CORNER = 24;

type TipCardProps = {
  text: string;
  title?: string;
  icon?: IconName;
  action?: { label: string; icon?: IconName; onPress: () => void };
};

/** Figma : bloc « Astuce » de la carte Ingrédients, coin supérieur droit replié. */
export function TipCard({ text, title = 'Astuce', icon = 'wine', action }: TipCardProps) {
  return (
    <View style={styles.tip}>
      <Svg width={CORNER} height={CORNER} style={styles.corner}>
        <Rect width={CORNER} height={CORNER} fill={color.bgSurface} />
        <Path d={`M0 0L${CORNER} ${CORNER}H0Z`} fill={color.tipCorner} />
      </Svg>
      <View style={styles.badge}>
        <Icon name={icon} size={16} color={color.textOnBrandPrimary} />
      </View>
      <AppText variant="button" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="button">{text}</AppText>
      {action && (
        <View style={styles.action}>
          <TextButton label={action.label} icon={action.icon} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tip: {
    gap: space[12],
    marginTop: space[4],
    padding: space[16],
    backgroundColor: color.aiBg,
  },
  corner: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  badge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: color.controlSelectedBg,
  },
  title: {
    fontFamily: font.medium,
  },
  action: {
    alignItems: 'flex-start',
  },
});
