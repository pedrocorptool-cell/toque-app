import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { AppText } from '@/components/ui';
import { domainOf, type ImportRequest } from '@/data/imports';
import { SOURCES } from '@/data/recipes';
import { color, radius, space } from '@/theme/tokens';

const STEPS = ['Lecture de la recette', 'Ingrédients', 'Étapes'];
const STEP_MS = 800;

/** Hors maquette : ce que Toqué importe, puis les trois étapes de lecture cochées une à une. */
export function ImportProgress({ request, onDone }: { request: ImportRequest; onDone: () => void }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done === STEPS.length) {
      const id = setTimeout(onDone, 300);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setDone((n) => n + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [done, onDone]);

  return (
    <View style={styles.body}>
      <Source request={request} />
      <View style={styles.steps}>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.step}>
            <View style={styles.status}>
              {i < done ? (
                <Icon name="check" size={16} color={color.accentGreen} />
              ) : i === done ? (
                <ActivityIndicator size="small" color={color.actionSecondaryIcon} />
              ) : null}
            </View>
            <AppText color={i <= done ? color.textPrimary : color.textSecondary}>{label}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function Source({ request }: { request: ImportRequest }) {
  if (request.method === 'photo') {
    return <Image source={{ uri: request.uri }} style={styles.photo} />;
  }
  const social = request.method === 'social' ? SOURCES.find((s) => s.id === request.network)! : null;
  return (
    <View style={styles.source}>
      {social ? (
        <Image source={social.logo!} style={styles.logo} />
      ) : (
        <Icon name="link" color={color.actionSecondaryIcon} />
      )}
      <AppText numberOfLines={1} style={styles.sourceLabel}>
        {social ? `Publication ${social.label}` : domainOf((request as { url: string }).url)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    gap: space[24],
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    maxWidth: '100%',
    paddingVertical: space[12],
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    backgroundColor: color.bgSurface,
  },
  logo: {
    width: 24,
    height: 24,
  },
  sourceLabel: {
    flexShrink: 1,
  },
  steps: {
    alignSelf: 'stretch',
    gap: space[16],
    paddingHorizontal: space[16],
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
  },
  status: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
