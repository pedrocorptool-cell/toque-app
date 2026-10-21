import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { ProfileScreen } from '@/components/screens/profile/ProfileScreen';
import { ServingsSheet } from '@/components/screens/profile/ServingsSheet';
import { ListCard, ListRow, Radio, useToast } from '@/components/ui';
import { partsLabel, SERVING_PRESETS } from '@/data/profile';
import { useProfile } from '@/data/ProfileContext';
import { color, space } from '@/theme/tokens';

/** Valeur proposée à la première personnalisation (Figma « Sheet/Parts »). */
const FIRST_CUSTOM = 6;

/** Figma : « Profil/ Parts » et « Profil/ Parts/ Perso » — parts avec lesquelles s'ouvrent les recettes. */
export default function PartsScreen() {
  const { defaultServings, setDefaultServings } = useProfile();
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const custom = !SERVING_PRESETS.includes(defaultServings);

  return (
    <>
      <ProfileScreen title="Parts par défaut" back toast={toast}>
        <ListCard>
          {SERVING_PRESETS.map((count) => (
            <ListRow
              key={count}
              label={String(count)}
              accessibilityLabel={partsLabel(count)}
              accessibilityRole="radio"
              selected={count === defaultServings}
              trailing={<Radio selected={count === defaultServings} />}
              onPress={() => setDefaultServings(count)}
            />
          ))}
          <ListRow
            label={custom ? String(defaultServings) : 'Personnaliser'}
            accessibilityLabel={
              custom ? `${partsLabel(defaultServings)}, modifier` : 'Personnaliser le nombre de parts'
            }
            accessibilityRole="radio"
            selected={custom}
            trailing={
              <View style={styles.trailing}>
                {custom && <Icon name="edit" color={color.actionSecondaryIcon} />}
                <Radio selected={custom} />
              </View>
            }
            onPress={() => setSheetOpen(true)}
          />
        </ListCard>
      </ProfileScreen>

      <ServingsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initial={custom ? defaultServings : FIRST_CUSTOM}
        onSave={(count) => {
          setDefaultServings(count);
          setSheetOpen(false);
          toast.show(`Tes recettes s’ouvriront pour ${partsLabel(count)}`);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
});
