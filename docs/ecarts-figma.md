# Écarts entre la maquette Figma et le code

Les tokens de couleur et d'espacement sont déclarés dans Figma mais pas appliqués dans les écrans
(les calques utilisent des valeurs en dur). Dans le code, chaque valeur a été rattachée au token
sémantique de même valeur. Ce qui suit n'avait pas d'équivalent exact.

## Valeurs sans token

| Où dans Figma | Valeur en dur | Choix dans le code |
|---|---|---|
| CTA Primary / FAB, état Pressed | `#B33919` | nouveau token `actionPrimaryBgPressed` |
| CTA Navigation, état Pressed | `rgba(40,39,37,0.32)` | nouveau token `actionIconBgPressed` |
| Navbar, icône de l'onglet actif | `#C9411D` | `actionSecondaryIcon` (`#CA401C`), écart d'un point de teinte |
| Navbar, bordure haute | `#F5F4F1` | `bgPage` (même valeur) |
| Ombres (FAB, toast, champ IA, onglet actif) | effets locaux | 3 ombres dans `shadow` (`fab`, `floating`, `tab`) |

À faire côté Figma : créer `action/primary/bg-pressed` et `action/icon/bg-pressed`, et rebrancher
l'icône active de la navbar sur `action/secondary/icon`.

## Ce qui manque dans le design system Figma

- **Styles de texte** : aucun n'est déclaré. Dix styles ont été relevés dans les écrans
  (`title` 20 Medium, `cardTitle` 18 Medium, `body` 16, `button` 16/24, `label` 14, `caption` 12,
  `overline` 12 majuscules, `badge` 12 Medium, `timer` 24 Light, `timerSmall` 16 Light).
- **Rayons** : pas de collection dédiée, la maquette réutilise les variables d'espacement
  (4, 8, 12, 16, 24, 80) plus 2 px pour la checkbox. Le code a une échelle `radius` à part.
- **Icône « Recettes » de la navbar** (le livre) : absente de la planche Icônes, exportée depuis la navbar.

## Nommage à clarifier

- « CTA/ Round/ Dark » a un fond blanc et « CTA/ Round/ Light » un fond orange : les noms semblent
  inversés. Dans le code, un seul composant `IconButton` avec les variantes `surface` (blanc),
  `primary` (orange), `onBrand` (translucide sur fond brun) et `plain` (sans fond).
- « CTA/ Navigation » et « Bouton/ navigation » décrivent le même bouton rond de 40 px : fusionnés.

## Corrections de contenu

- Dialogue de suppression : « Es-tu sur » corrigé en « Es-tu sûr ».

## Home et filtres (étape 2a)

- **Fond des bottom sheets** : Figma floute l'écran derrière (flou + voile). Le code pose seulement un
  voile `overlayScrim`, le flou natif demanderait une dépendance de plus. À rediscuter si c'est important.
- **Filtre actif** : Figma ne montre pas de chip avec une sélection. Le code reprend l'état « Actif » de
  « Chip/ Filtre » (fond foncé, sans chevron) et ajoute le nombre de choix : « Catégorie (2) ».
- **Champ de recherche du filtre Créateur** : fond blanc sans loupe, ajouté comme variante `surface` de `SearchField`.
- **Bouton effacer** dans les champs de recherche : croix ajoutée dès qu'un texte est saisi (absente de Figma).
- **État vide** (aucune recette ne correspond) : pas d'écran Figma, proposé dans le code
  (loupe, « Aucune recette trouvée », bouton « Tout effacer »).
- **Créateur** : la carte Figma écrit « Marmitton », le filtre « Marmiton ». Le code garde « Marmiton ».

## Fiche recette (étape 2b)

- **Police du titre** : Figma utilise « Avoin Demo Bold », qui n'est pas libre. Le code la remplace par
  Rubik Black (Google Fonts). Si tu as une licence Avoin, il suffit de remplacer `font.display`.
- **Couleurs codées en dur dans la maquette**, passées en tokens : `borderPaper` (#927760),
  `tipCorner` (#2C5F7D), `borderPhoto` (#EAE6E1), `textOnBrandMuted` (blanc 80 %), et les pastilles
  de « Créer une catégorie » (`accentLime`, `accentGrey`, `accentPurple`, `accentPink`).
- **Fond flouté du hero** : valeur exacte de Figma (« Layer blur » 140, token `blur.hero`), sans fondu de couleur.
  Rendu avec Skia sur mobile (le `blurRadius` natif garde des bords nets) et le filtre CSS `blur()` sur le web.
  Le rendu varie un peu entre iOS, Android et le web.
- **Pastille d'étape et minuteur** : un appui lance ou met en pause le compte à rebours (icône lecture /
  pause). La fin est signalée par la sheet ou le dialogue « Minuteurs » (voir plus bas).
  L'étape 3 de « Pasta alla zozzona » a un minuteur de 10 s pour tester.
- **Minuteurs** (section Figma « Feature minuteur ») : le premier appui sur une pastille lance le minuteur,
  les suivants ouvrent « Bottom Sheet/ Minuteur » (pause, recommencer, supprimer). Les minuteurs tournent
  même hors de la fiche. Quand l'un arrive à zéro, « Dialogue/ Minuteur » s'ouvre où que l'on soit
  (« Arrêter » le retire ; la croix arrête les minuteurs terminés et laisse tourner les autres).
  Exception : sur la fiche de la recette concernée, c'est la sheet qui s'ouvre. À zéro, les chiffres
  pulsent doucement (opacité 100 % ↔ 30 %, 1 s) dans la sheet, le dialogue et la pastille d'étape.
- **Onglets Ingrédients / Recette** : l'icône de l'onglet actif est orange (`actionSecondaryIcon`) et la
  pastille blanche glisse d'un onglet à l'autre (250 ms).

## Mode étape par étape (étape 3)

- Ouvert par « Démarrer la recette ». Figma : « Recette/ Stepp/ Minuteur off / on ». Transition proposée par
  Pierre (absente de Figma) : la photo de la fiche rétrécit jusqu'à la miniature et le flou pleine largeur
  devient le halo du coin, pendant que le fond brun recouvre la fiche (0,5 s) ; le contenu de l'étape
  apparaît ensuite en fondu. La croix et le retour Android jouent l'animation à l'envers.
- Halo flouté : 194 × 120 dans le coin haut gauche, flou 100 comme dans Figma (token `blur.glow`), sans fondu.
  Pendant la transition, le flou 140 de la fiche et le halo 100 se croisent en fondu en se redimensionnant.
- Flèches précédent / suivant : grisées à la première et à la dernière étape (pas d'écran de fin dans Figma).
  Le texte de l'étape glisse depuis le côté de la flèche touchée.
- Bouton IA (baguette) : gardé en V1 comme point d'entrée de « Modifier avec l'IA », sans action pour
  l'instant (message d'attente), sur décision de Pierre.
- Le minuteur de l'étape est le même que sur la fiche (lancé ici, il apparaît aussi dans la sheet).
  Quand il arrive à zéro dans ce mode, le dialogue « Minuteurs » s'ouvre.
- Icônes ajoutées depuis Figma : `magic`, `caretLeft`, `caretRight`.
  Sur l'onglet Ingrédients, le rappel « Minuteurs (n) » ouvre la même sheet. Pas de son ni de
  notification système dans le prototype.
- **« Démarrer la recette »** : Figma le pose dans une barre fixe pleine largeur. Sur retour de Pierre, le
  code en fait un bouton flottant centré, à la largeur de son texte, avec le halo orange du FAB
  (`shadow.fab`) : plus de coupure de l'écran. En fin de défilement, la carte « Étapes » s'arrête 16 px
  sous le bouton, qui reste sur fond blanc, et laisse une bande de fond brun en bas de l'écran.
- **Icône vin de l'astuce** : 19 px dans Figma, 16 px dans le code (tailles d'icône 14 / 16 / 24).
- **Nom du créateur souligné** : pas de page créateur dans Figma, le lien ne mène nulle part pour l'instant.
- **« Modifier avec l'IA »** (menu …) : affiche un toast, prévu avec le chat IA de l'étape 3.
- **Liste de courses** : toutes les cases sont cochées à l'ouverture, les quantités suivent le nombre de
  parts choisi. Les articles sont gardés en mémoire pour l'onglet Liste, pas encore affichés.
- **Suppression** : la recette disparaît de la home jusqu'au redémarrage de l'app (données en mémoire).

- **Minuteurs lancés** (maquette d'exploration 442:849) : une fois lancé, le minuteur quitte l'étape et devient une
  pastille parmi les actions du bas (icône réveil, temps du minuteur qui sonne le plus tôt, « (n) » à partir de deux,
  clignote à zéro). Elle ouvre la sheet « Minuteur » avec tous les minuteurs de la recette. Arrêté depuis la sheet,
  le minuteur revient sur son étape. Un minuteur de la recette qui se termine ouvre cette sheet, comme sur la fiche,
  au lieu du dialogue global. Au lancement depuis l'étape, la carte se resserre et glisse jusqu'à la pastille
  (450 ms), seulement si aucun minuteur ne tourne déjà. « Arrêter » sur un minuteur terminé referme la sheet.

- **Écran de fin** (Figma 452:1752) : la flèche suivante de la dernière étape l'ouvre. Toucher la photo du timbre
  ou le bouton appareil photo ouvre l'appareil (ou la galerie s'il n'est pas disponible) ; la photo, recadrée au
  carré, remplace la vignette de la recette (fiche, home, flous) jusqu'au redémarrage. Après la photo, seul le
  texte change (« Ta photo est maintenant la vignette de la recette. »), pas de maquette pour cet état.
  « Terminer » ramène à la fiche par un fondu, « Retour » à la dernière étape. Le titre est en Rubik Black comme les
  autres titres (Avoin Demo dans Figma). Le timbre est dessiné en SVG (masque de trous de 12 px tous les 24 px).
  Ajouts au DS : `Button` variante `secondary` (blanc, libellé orange), `TextButton` ton `onBrand`, police Kalam
  pour « Fais maison! ».

## Limites connues

- Seules deux photos de plats existent dans Figma : les six recettes fictives les réutilisent.
- Les filtres d'un même type s'additionnent (Végé OU Dessert), les différents filtres se combinent
  (Végé ET Jow). Le compteur « Voir les résultats (n) » se met à jour à chaque case cochée.
