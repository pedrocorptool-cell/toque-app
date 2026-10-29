import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PAPER_EDGE_PATH } from '@/components/art/paths';
import { AppText } from '@/components/ui';
import { color, space } from '@/theme/tokens';

type PaperCardProps = {
  title: string;
  /** Contrôle aligné à droite du titre (sélecteur de parts). */
  headerRight?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/** Figma : cartes « Ingrédients » et « Étapes » — feuille blanche au bord perforé. */
export function PaperCard({ title, headerRight, children, footer }: PaperCardProps) {
  return (
    <View>
      <Svg width="100%" height={12} viewBox="0 0 361 12" preserveAspectRatio="none" style={styles.edge}>
        <Path d={PAPER_EDGE_PATH} fill={color.bgSurface} />
      </Svg>
      <View style={styles.paper}>
        <View style={styles.header}>
          <AppText variant="title">{title}</AppText>
          {headerRight}
        </View>
        <View style={styles.body}>{children}</View>
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Le bord chevauche la feuille d'1 px : sans ça, une fine ligne du fond apparaît entre les deux sur téléphone.
  edge: {
    marginBottom: -1,
  },
  paper: {
    backgroundColor: color.bgSurface,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space[16],
    borderBottomWidth: 1,
    borderBottomColor: color.borderPaper,
  },
  body: {
    gap: space[12],
    padding: space[16],
  },
  footer: {
    alignItems: 'center',
    padding: space[16],
    borderTopWidth: 1,
    borderTopColor: color.borderPaper,
  },
});
