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

## Limites connues

- Seules deux photos de plats existent dans Figma : les six recettes fictives les réutilisent.
- Les filtres d'un même type s'additionnent (Végé OU Dessert), les différents filtres se combinent
  (Végé ET Jow). Le compteur « Voir les résultats (n) » se met à jour à chaque case cochée.
