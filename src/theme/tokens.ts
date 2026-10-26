/**
 * Design tokens Toqué, repris des variables du fichier Figma
 * (collections « Primitives », « Semantic » et « Space »).
 *
 * Règle : les composants n'utilisent que `color` (sémantique), `space`, `radius`,
 * `text` et `shadow`. Les primitives ne servent qu'à définir les sémantiques.
 */

// Collection Figma « Primitives »
export const palette = {
  neutral0: '#FFFFFF',
  neutral0A64: 'rgba(255, 255, 255, 0.64)',
  neutral800: '#282725',
  neutral800A64: 'rgba(40, 39, 37, 0.64)',
  neutral800A24: 'rgba(40, 39, 37, 0.24)',
  brown50: '#F5F4F1',
  brown75: '#EEECE7',
  brown75A32: 'rgba(238, 236, 231, 0.32)',
  brown100: '#DDDACF',
  brown400: '#A68D78',
  brown600: '#826A56',
  brown700: '#645044',
  orange100: '#F5E9C9',
  orange600: '#CA401C',
  blue50: '#E0F3FF',
  blue100: '#E5F0F9',
  blue200: '#B1D7EE',
  blue800: '#1B5071',
  green100: '#D1FAB8',
  green900: '#243B16',
  /** Vert plus sombre que le fond de marque, pour les surfaces posées dessus (Tests vert 461:2852). */
  green950: '#192A0F',
  neutral0A24: 'rgba(255, 255, 255, 0.24)',
  neutral0A08: 'rgba(255, 255, 255, 0.08)',
  // Couleurs de catégorie de « Créer une catégorie », sans variable dans Figma.
  grey300: '#C8C7C3',
  purple400: '#777ED0',
  pink300: '#F9AEF2',
} as const;

// Collection Figma « Semantic » (mode Light)
export const color = {
  textPrimary: palette.neutral800,
  textSecondary: palette.neutral800A64,
  textOnBrandPrimary: palette.neutral0,
  textOnBrandSecondary: palette.neutral0A64,

  bgPage: palette.brown50,
  bgSurface: palette.neutral0,
  // Fond de marque brun (l'essai vert de « Tests vert » 461:2852 a été abandonné).
  bgBrandPage: palette.brown600,
  bgBrandSurface: palette.brown700,

  borderDefault: palette.brown100,
  borderDivider: palette.neutral800A24,
  borderOnBrand: palette.brown400,
  /** Champ posé sur le fond de marque (recherche, onglets de la fiche) : teinte d'avant l'essai vert. */
  bgBrandField: palette.neutral800A24,

  actionPrimaryBg: palette.orange600,
  actionPrimaryText: palette.orange100,
  actionSecondaryIcon: palette.orange600,
  actionIconBg: palette.neutral800A24,

  overlayScrim: palette.neutral800A24,
  feedbackDanger: palette.orange600,
  chipBg: palette.orange100,

  aiBg: palette.blue200,
  aiSubtle: palette.blue100,
  aiStrong: palette.blue800,

  premiumBg: palette.green100,
  premiumText: palette.green900,

  tagBg: palette.blue100,
  tagText: palette.blue800,
  // Étiquettes des cartes et de la fiche sans couleur de catégorie (Figma « V2 Sheet » 713:2413).
  tagTimeBg: palette.blue50,
  tagTimeText: palette.blue800,
  tagCategoryBg: palette.brown75,
  tagCategoryText: palette.neutral800,
  tagOnBrandBg: palette.brown75A32,

  controlSelectedBg: palette.neutral800,
  controlSelectedIcon: palette.neutral0,
  controlDefaultBorder: palette.neutral800,

  listBullet: palette.orange600,

  accentBlue: palette.blue200,
  accentGreen: palette.green900,
  accentOrange: palette.orange600,
  accentCreme: palette.orange100,

  accentLime: palette.green100,
  accentGrey: palette.grey300,
  accentPurple: palette.purple400,
  accentPink: palette.pink300,

  // Absents de Figma : valeurs codées en dur dans la maquette,
  // proposées ici comme tokens (voir docs/ecarts-figma.md).
  actionPrimaryBgPressed: '#B33919',
  actionIconBgPressed: 'rgba(40, 39, 37, 0.32)',
  /** Filets des cartes « papier » de la fiche recette (#927760 dans Figma). */
  borderPaper: '#927760',
  /** Coin plié de la carte « Astuce » (#2C5F7D dans Figma). */
  tipCorner: '#2C5F7D',
  /** Liseré de la photo du hero recette (#EAE6E1 dans Figma). */
  borderPhoto: '#EAE6E1',
  /** Chiffres secondaires du hero recette (blanc à 80 %). */
  textOnBrandMuted: 'rgba(255, 255, 255, 0.8)',
} as const;

// Collection Figma « Space »
export const space = {
  0: 0,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  56: 56,
  64: 64,
  72: 72,
  80: 80,
} as const;

// Les rayons de la maquette réutilisent les valeurs de « Space ».
export const radius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  sheet: 24,
  pill: 80,
} as const;

export const font = {
  light: 'ZalandoSans_300Light',
  regular: 'ZalandoSans_400Regular',
  medium: 'ZalandoSans_500Medium',
  /** Titre de recette. Figma utilise « Avoin Demo » (non libre) : remplacé par Rubik Black. */
  display: 'Rubik_900Black',
  /** Mention manuscrite « Fais maison! » de l'écran de fin. */
  handwritten: 'Kalam_400Regular',
} as const;

// Styles de texte relevés dans la maquette (Figma n'a pas de styles de texte déclarés).
export const text = {
  display: { fontFamily: font.display, fontSize: 40, lineHeight: 44, letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontFamily: font.medium, fontSize: 20 },
  cardTitle: { fontFamily: font.medium, fontSize: 18 },
  /** Titre des écrans vides et d'attente (« Aucune recette », « Import en cours »). */
  headline: { fontFamily: font.medium, fontSize: 24, lineHeight: 32 },
  body: { fontFamily: font.regular, fontSize: 16 },
  button: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: font.regular, fontSize: 14 },
  caption: { fontFamily: font.regular, fontSize: 12 },
  overline: { fontFamily: font.regular, fontSize: 12, textTransform: 'uppercase' },
  badge: { fontFamily: font.medium, fontSize: 12 },
  timer: { fontFamily: font.light, fontSize: 24, lineHeight: 28 },
  timerSmall: { fontFamily: font.light, fontSize: 16, lineHeight: 28 },
  stat: { fontFamily: font.medium, fontSize: 24 },
  step: { fontFamily: font.medium, fontSize: 18, lineHeight: 20 },
} as const;

/** Valeurs « Layer blur » des maquettes (photo floutée derrière la fiche et en mode étape par étape). */
export const blur = {
  hero: 140,
  glow: 100,
} as const;

export const shadow = {
  // FAB : halo orange 0 0 25 rgba(202,64,28,.32)
  fab: {
    shadowColor: palette.orange600,
    shadowOpacity: 0.32,
    shadowRadius: 12.5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  // Toast, champ IA : 0 0 120 rgba(40,39,37,.16)
  floating: {
    shadowColor: palette.neutral800,
    shadowOpacity: 0.16,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  // Onglet actif : 0 0 60 rgba(0,0,0,.25)
  tab: {
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
} as const;
