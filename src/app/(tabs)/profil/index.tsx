import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { ImportError } from '@/components/screens/import/ImportError';
import { ImportLoading } from '@/components/screens/import/ImportLoading';
import { useSimulatedImport } from '@/components/screens/import/useSimulatedImport';
import { ImportSheet } from '@/components/screens/ImportSheet';
import { ProfileScreen } from '@/components/screens/profile/ProfileScreen';
import { AppText, Avatar, Dialog, ListCard, ListRow, TextButton, useToast, Tappable } from '@/components/ui';
import { partsLabel, TIMER_SOUNDS } from '@/data/profile';
import { useProfile } from '@/data/ProfileContext';
import { useRecipes } from '@/data/RecipesContext';
import { color, radius, space } from '@/theme/tokens';

/** Figma : « Profil » — identité, paramètres, import et déconnexion. */
export default function ProfilScreen() {
  const { account, avatar, defaultServings, timerSound } = useProfile();
  const { categories } = useRecipes();
  const toast = useToast();
  const [guideOpen, setGuideOpen] = useState(false);
  const [importing, setImporting, importFailed, setImportFailed] = useSimulatedImport();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <>
      <ProfileScreen title="Profil" toast={toast}>
        <Tappable
          feedback="surface"
          accessibilityRole="button"
          accessibilityLabel={`${account.name}, modifier le compte`}
          onPress={() => router.push('/profil/compte')}
          style={styles.identity}>
          <Avatar avatar={avatar} size={80} />
          <View style={styles.identityText}>
            <AppText variant="cardTitle" numberOfLines={1}>
              {account.name}
            </AppText>
            <AppText variant="label" color={color.textSecondary} numberOfLines={1}>
              {account.email}
            </AppText>
          </View>
          <Icon name="edit" color={color.actionSecondaryIcon} />
        </Tappable>

        <ListCard title="Paramètres" divider="line">
          <SettingRow
            icon="bookmark"
            label="Mes catégories"
            value={String(categories.length)}
            onPress={() => router.push('/profil/categories')}
          />
          <SettingRow
            icon="users"
            label="Parts par défaut"
            value={partsLabel(defaultServings)}
            onPress={() => router.push('/profil/parts')}
          />
          <SettingRow
            icon="bell"
            label="Son des minuteurs"
            value={TIMER_SOUNDS.find((s) => s.id === timerSound)!.label}
            onPress={() => router.push('/profil/sons')}
          />
        </ListCard>

        <ListCard title="Import" divider="line">
          <SettingRow icon="bookOpen" label="Guide d’import" onPress={() => setGuideOpen(true)} />
          <SettingRow icon="magic" label="Revoir la présentation" onPress={() => router.push('/onboarding')} />
        </ListCard>

        <View style={styles.footer}>
          <TextButton tone="danger" icon="signOut" label="Se déconnecter" onPress={() => setLogoutOpen(true)} />
        </View>
      </ProfileScreen>

      <ImportSheet
        visible={guideOpen}
        initialStep="social"
        onClose={() => setGuideOpen(false)}
        onStart={(request) => {
          setGuideOpen(false);
          setImporting(request);
        }}
      />
      <ImportLoading visible={!!importing} onCancel={() => setImporting(null)} />
      <ImportError
        visible={!!importFailed}
        onRetry={() => {
          setImportFailed(null);
          setImporting(importFailed);
        }}
        onClose={() => setImportFailed(null)}
      />

      <Dialog
        visible={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Se déconnecter"
        message="Tes recettes restent liées à ton compte : tu les retrouveras à ta prochaine connexion."
        confirmLabel="Oui, me déconnecter"
        onConfirm={() => {
          setLogoutOpen(false);
          toast.show('La déconnexion n’existe pas dans le prototype');
        }}
      />
    </>
  );
}

type SettingRowProps = { icon: IconName; label: string; value?: string; onPress: () => void };

/** Figma : « Profil/ Ligne » — icône orange, libellé, valeur et chevron. */
function SettingRow({ icon, label, value, onPress }: SettingRowProps) {
  return (
    <ListRow
      leading={<Icon name={icon} color={color.actionSecondaryIcon} />}
      label={label}
      value={value}
      trailing={<Icon name="caretRight" size={16} color={color.textSecondary} />}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    padding: space[16],
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: space[4],
  },
  footer: {
    alignItems: 'center',
    paddingVertical: space[8],
  },
});
