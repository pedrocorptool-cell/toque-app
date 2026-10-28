import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View, type AccessibilityRole } from 'react-native';

import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Tappable } from './Tappable';

type ListCardProps = {
  children: ReactNode;
  /**
   * gap : lignes séparées par 1 px du fond de page, coins de 12 (listes « Profil/ Catégories », « Parts »…).
   * line : filet « border/default » entre les lignes, coins de 16 (réglages de « Profil »).
   */
  divider?: 'gap' | 'line';
  /** Surtitre en capitales au-dessus de la carte (« Paramètres »). */
  title?: string;
};

/** Carte blanche qui empile des `ListRow`. */
export function ListCard({ children, divider = 'gap', title }: ListCardProps) {
  const rows = Children.toArray(children).filter(Boolean);
  const card = (
    <View style={[styles.card, divider === 'line' && styles.cardLine]}>
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={divider === 'line' ? styles.line : styles.gap} />}
          {row}
        </Fragment>
      ))}
    </View>
  );
  if (!title) return card;
  return (
    <View style={styles.section}>
      <AppText variant="overline" color={color.textSecondary}>
        {title}
      </AppText>
      {card}
    </View>
  );
}

type ListRowProps = {
  label: string;
  /** Pastille, icône ou avatar avant le libellé. */
  leading?: ReactNode;
  /** Texte secondaire aligné à droite (« 2 parts », « 6 recettes »). */
  value?: string;
  /** Chevron, radio, crayon… après la valeur. */
  trailing?: ReactNode;
  /** Élément à une place fixe sur chaque ligne, 72 px avant la fin (onde du son en cours de lecture). */
  inline?: ReactNode;
  onPress?: () => void;
  accessibilityRole?: AccessibilityRole;
  selected?: boolean;
  accessibilityLabel?: string;
  /** Libellé rouge des actions destructrices (« Supprimer »). */
  danger?: boolean;
};

/** Ligne de 56 px des listes du profil. */
export function ListRow({
  label,
  leading,
  value,
  trailing,
  inline,
  onPress,
  accessibilityRole = 'button',
  selected,
  accessibilityLabel,
  danger,
}: ListRowProps) {
  const content = (
    <>
      {leading}
      <View style={styles.labelBox}>
        <AppText style={styles.label} color={danger ? color.feedbackDanger : undefined} numberOfLines={1}>
          {label}
        </AppText>
        {inline && <View style={styles.inline}>{inline}</View>}
      </View>
      {value !== undefined && (
        <AppText variant="label" color={color.textSecondary}>
          {value}
        </AppText>
      )}
      {trailing}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Tappable
      feedback="surface"
      accessibilityRole={accessibilityRole}
      accessibilityState={selected === undefined ? undefined : { selected, checked: selected }}
      accessibilityLabel={accessibilityLabel ?? (value ? `${label} : ${value}` : label)}
      onPress={onPress}
      style={styles.row}>
      {content}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space[8],
  },
  card: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  cardLine: {
    borderRadius: radius.xl,
  },
  gap: {
    height: 1,
    backgroundColor: color.bgPage,
  },
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.borderDefault,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[16],
    backgroundColor: color.bgSurface,
  },
  labelBox: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  label: {
    flex: 1,
  },
  // Position relevée sur la maquette de Pierre : l'onde ne bouge pas d'un son à l'autre.
  inline: {
    marginRight: space[72],
  },
});
