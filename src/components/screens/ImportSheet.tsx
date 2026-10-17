import { type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, BottomSheet } from '@/components/ui';
import { SOURCES } from '@/data/recipes';
import { color, radius, space } from '@/theme/tokens';

export type ImportMethod = 'social' | 'photo' | 'web';

type ImportSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (method: ImportMethod) => void;
};

const SOCIAL_LOGOS = (['facebook', 'instagram', 'tiktok'] as const).map((id) => SOURCES.find((s) => s.id === id)!);

/** Figma : « Bottom Sheet/ Import » — ouvert par le bouton + de la home. */
export function ImportSheet({ visible, onClose, onPick }: ImportSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Importer une recette">
      <View style={styles.options}>
        <Option onPress={() => onPick('social')} style={styles.social}>
          <View style={styles.logos}>
            {SOCIAL_LOGOS.map((s, i) => (
              <Image key={s.id} source={s.logo!} style={[styles.logo, i > 0 && styles.logoOverlap]} />
            ))}
          </View>
          <AppText>Réseaux sociaux</AppText>
        </Option>
        <View style={styles.row}>
          <IconOption icon="camera" label="Photo" onPress={() => onPick('photo')} />
          <IconOption icon="link" label="Lien Web" onPress={() => onPick('web')} />
        </View>
      </View>
    </BottomSheet>
  );
}

function IconOption({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Option onPress={onPress} style={styles.half}>
      <Icon name={icon} color={color.actionSecondaryIcon} />
      <AppText>{label}</AppText>
    </Option>
  );
}

function Option({ onPress, style, children }: { onPress: () => void; style: object; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.option, style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: space[16],
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  pressed: {
    opacity: 0.7,
  },
  social: {
    gap: space[8],
    paddingVertical: space[16],
  },
  logos: {
    flexDirection: 'row',
  },
  logo: {
    width: 24,
    height: 24,
  },
  logoOverlap: {
    marginLeft: -space[8],
  },
  row: {
    flexDirection: 'row',
    gap: space[16],
  },
  half: {
    flex: 1,
    height: 80,
    flexDirection: 'row',
    gap: space[8],
  },
});
