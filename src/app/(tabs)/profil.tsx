import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, ChefButton, Dialog, Logo, TextButton, Toast } from '@/components/ui';
import { useRecipes } from '@/data/RecipesContext';
import { useShopping } from '@/data/ShoppingContext';
import { color, radius, space } from '@/theme/tokens';

// Prototype : pas de compte, une identité de démo.
const USER = { name: 'Alex Martin', email: 'alex.martin@exemple.fr' };
const SOON = 'Cette option arrive bientôt';
const CHEF = 'L’offre Toqué Chef arrive bientôt';

/** Hors maquette : page Profil construite avec les composants et les styles des autres onglets. */
export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, categories } = useRecipes();
  const { items } = useShopping();
  const toBuy = items.filter((i) => !i.checked && i.label.trim()).length;

  const [timerAlerts, setTimerAlerts] = useState(true);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space[24] }]}>
        <View style={styles.topRow}>
          <Logo />
          <ChefButton onPress={() => setToast(CHEF)} />
        </View>
        <AppText variant="title" color={color.textOnBrandPrimary}>
          Profil
        </AppText>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${USER.name}, modifier le profil`}
          onPress={() => setToast(SOON)}
          style={({ pressed }) => [styles.card, styles.identity, pressed && styles.pressed]}>
          <View style={styles.avatar}>
            <AppText variant="cardTitle" color={color.tagText}>
              {initials(USER.name)}
            </AppText>
          </View>
          <View style={styles.identityText}>
            <AppText variant="cardTitle" numberOfLines={1}>
              {USER.name}
            </AppText>
            <AppText variant="label" color={color.textSecondary} numberOfLines={1}>
              {USER.email}
            </AppText>
          </View>
          <Icon name="edit" color={color.actionSecondaryIcon} />
        </Pressable>

        <View style={styles.stats}>
          <Stat value={recipes.length} label={plural(recipes.length, 'recette')} onPress={() => router.navigate('/')} />
          <Stat
            value={categories.length}
            label={plural(categories.length, 'catégorie')}
            onPress={() => setToast(SOON)}
          />
          <Stat
            value={toBuy}
            label="à acheter"
            onPress={() => router.navigate('/liste')}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setToast(CHEF)}
          style={({ pressed }) => [styles.card, styles.chef, pressed && styles.pressed]}>
          <Icon name="flame" color={color.premiumText} />
          <View style={styles.chefText}>
            <AppText variant="cardTitle" color={color.premiumText}>
              Passe à Toqué Chef
            </AppText>
            <AppText variant="label" color={color.premiumText}>
              Imports illimités et modification de tes recettes par l’IA.
            </AppText>
          </View>
          <Icon name="caretRight" size={16} color={color.premiumText} />
        </Pressable>

        <Section title="Cuisine">
          <Row
            icon="bookmark"
            label="Mes catégories"
            value={String(categories.length)}
            onPress={() => setToast(SOON)}
          />
          <Row icon="users" label="Parts par défaut" value="2 parts" onPress={() => setToast(SOON)} />
          <Row icon="scales" label="Unités" value="Métriques" onPress={() => setToast(SOON)} />
        </Section>

        <Section title="Application">
          <Row
            icon="bell"
            label="Alertes des minuteurs"
            control={
              <Switch
                accessibilityLabel="Alertes des minuteurs"
                value={timerAlerts}
                onValueChange={setTimerAlerts}
                trackColor={{ false: color.borderDefault, true: color.controlSelectedBg }}
                thumbColor={color.bgSurface}
                ios_backgroundColor={color.borderDefault}
                // Sur le web, le pouce prend sinon la couleur par défaut de react-native-web.
                {...(Platform.OS === 'web' && { activeThumbColor: color.bgSurface })}
              />
            }
          />
          <Row icon="question" label="Aide et contact" onPress={() => setToast(SOON)} />
          <Row icon="swatches" label="Design system" onPress={() => router.push('/design-system')} />
        </Section>

        <View style={styles.footer}>
          <TextButton tone="danger" icon="signOut" label="Se déconnecter" onPress={() => setLogoutOpen(true)} />
          <AppText variant="caption" color={color.textSecondary}>
            Toqué · prototype
          </AppText>
        </View>
      </ScrollView>

      {toast && (
        <View style={styles.toast}>
          <Toast message={toast} onClose={() => setToast(null)} />
        </View>
      )}

      <Dialog
        visible={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Se déconnecter"
        message="Tes recettes restent liées à ton compte : tu les retrouveras à ta prochaine connexion."
        confirmLabel="Oui, me déconnecter"
        onConfirm={() => {
          setLogoutOpen(false);
          setToast('La déconnexion n’existe pas dans le prototype');
        }}
      />
    </View>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function plural(count: number, word: string) {
  return `${word}${count > 1 ? 's' : ''}`;
}

function Stat({ value, label, onPress }: { value: number; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.stat, pressed && styles.pressed]}>
      <AppText variant="stat">{value}</AppText>
      <AppText variant="label" color={color.textSecondary} numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const rows = Array.isArray(children) ? children : [children];
  return (
    <View style={styles.section}>
      <AppText variant="overline" color={color.textSecondary}>
        {title}
      </AppText>
      <View style={styles.card}>
        {rows.map((row, i) => (
          <View key={i} style={i > 0 && styles.divided}>
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

type RowProps = {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  /** Contrôle à droite (interrupteur) à la place de la valeur et du chevron. */
  control?: ReactNode;
};

function Row({ icon, label, value, onPress, control }: RowProps) {
  const content = (
    <>
      <Icon name={icon} color={color.actionSecondaryIcon} />
      <AppText style={styles.rowLabel} numberOfLines={1}>
        {label}
      </AppText>
      {control ?? (
        <>
          {value && (
            <AppText variant="label" color={color.textSecondary}>
              {value}
            </AppText>
          )}
          <Icon name="caretRight" size={16} color={color.textSecondary} />
        </>
      )}
    </>
  );
  if (control) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label} : ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
  header: {
    gap: space[24],
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: color.bgPage,
  },
  content: {
    gap: space[24],
    padding: space[16],
  },
  card: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: color.bgSurface,
  },
  pressed: {
    opacity: 0.7,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    padding: space[16],
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.tagBg,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: space[4],
  },
  stats: {
    flexDirection: 'row',
    gap: space[8],
  },
  stat: {
    flex: 1,
    gap: space[4],
    padding: space[16],
  },
  chef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    padding: space[16],
    backgroundColor: color.premiumBg,
  },
  chefText: {
    flex: 1,
    gap: space[4],
  },
  section: {
    gap: space[8],
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.borderDefault,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingHorizontal: space[16],
  },
  rowPressed: {
    backgroundColor: color.bgPage,
  },
  rowLabel: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    gap: space[16],
    paddingVertical: space[8],
  },
  toast: {
    position: 'absolute',
    left: space[16],
    right: space[16],
    bottom: space[16],
  },
});
