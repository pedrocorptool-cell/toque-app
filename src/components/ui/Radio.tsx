import { StyleSheet, View } from 'react-native';

import { color } from '@/theme/tokens';

/** Figma : bouton radio des écrans « Profil/ Parts » et « Profil/ Sonneries » — rond de 18 px, point orange. */
export function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={styles.box}>
      <View style={[styles.ring, selected && styles.ringSelected]}>{selected && <View style={styles.dot} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: color.textPrimary,
  },
  ringSelected: {
    borderColor: color.actionSecondaryIcon,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.actionSecondaryIcon,
  },
});
