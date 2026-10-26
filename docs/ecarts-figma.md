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
  (illustration, « Aucune recette trouvée », bouton « Réinitialiser les filtres »).
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
  pause). La fin est signalée par la sheet « Minuteur » (voir plus bas).
  L'étape 3 de « Pasta alla zozzona » a un minuteur de 10 s pour tester.
- **Minuteurs** (section Figma « Feature minuteur ») : le premier appui sur une pastille lance le minuteur,
  les suivants ouvrent « Bottom Sheet/ Minuteur » (pause, recommencer, supprimer). Les minuteurs tournent
  même hors de la fiche. Quand l'un arrive à zéro, la sheet « Minuteur » s'ouvre où que l'on soit, à la place
  de « Dialogue/ Minuteur » (décision de Pierre, pour garder un seul composant d'alarme) ; « Arrêter » le
  retire, la croix arrête les minuteurs terminés et laisse tourner les autres.
- **Minuteurs entre recettes** (règles de Pierre, maquette 639:17832) : une seule pastille compacte, toujours
  en bas à gauche dans les onglets (absente de la fiche recette ; dans sa barre en pas à pas), qui
  ouvre la sheet avec tous les minuteurs. Sur la fiche de l'unique recette en cours : étapes seules. Ailleurs, ou
  dès que plusieurs recettes ont des minuteurs : nom de la recette + chevron ; un appui sur la carte rouvre la
  fiche sur l'onglet Recette, à l'étape du minuteur (pas de chevron pour la recette à l'écran).
- **Onglets Ingrédients / Recette** : l'icône de l'onglet actif est orange (`actionSecondaryIcon`) et la
  pastille blanche glisse d'un onglet à l'autre (250 ms).

- **Catégories enregistrées** (pas de maquette) : quand la recette est classée, « Enregistrer » laisse place à ses
  hashtags sur une ligne, coupée par « … » (#CheatMeal #Végé). Comme sur la home, « Plat principal » n'apparaît
  que s'il est la seule catégorie. Les toucher rouvre la sheet « Enregistrer » ; tout décocher fait revenir
  « Enregistrer ». Les catégories créées dans la sheet sont partagées avec la home (filtres, hashtags des cartes)
  jusqu'au redémarrage. Hashtag « #CheatMeal » au lieu de « #Cheatmeal » (Figma), à la demande de Pierre.

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
  Quand il arrive à zéro dans ce mode, la sheet « Minuteur » s'ouvre.
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
  parts choisi. Les articles cochés s'ajoutent à l'onglet Liste (sans doublon parmi ceux encore à acheter).
- **Suppression** : la recette disparaît de la home jusqu'au redémarrage de l'app (données en mémoire).

- **Minuteurs lancés** (maquette d'exploration 442:849) : une fois lancé, le minuteur quitte l'étape et devient une
  pastille parmi les actions du bas (icône réveil, temps du minuteur qui sonne le plus tôt, « (n) » à partir de deux,
  clignote à zéro). Elle ouvre la sheet « Minuteur » avec tous les minuteurs de la recette. Arrêté depuis la sheet,
  le minuteur revient sur son étape. Un minuteur de la recette qui se termine ouvre cette sheet, comme partout
  ailleurs. Au lancement depuis l'étape, la carte se resserre et glisse jusqu'à la pastille
  (450 ms), seulement si aucun minuteur ne tourne déjà. « Arrêter » sur un minuteur terminé referme la sheet.

- **Écran de fin** (Figma 452:1752) : la flèche suivante de la dernière étape l'ouvre. Toucher la photo du timbre
  ou le bouton appareil photo ouvre l'appareil (ou la galerie s'il n'est pas disponible) ; la photo, recadrée au
  carré, remplace la vignette de la recette (fiche, home, flous) jusqu'au redémarrage. Après la photo, seul le
  texte change (« Ta photo est maintenant la vignette de la recette. »), pas de maquette pour cet état.
  « Terminer » ramène à la fiche par un fondu, « Retour » à la dernière étape. Le titre est en Rubik Black comme les
  autres titres (Avoin Demo dans Figma). Le timbre est dessiné en SVG (masque de trous de 12 px tous les 24 px).
  Ajouts au DS : `Button` variante `secondary` (blanc, libellé orange), `TextButton` ton `onBrand`, police Kalam
  pour « Fais maison! ».

- **Onglet Liste** (Figma 244:3444) : cinq articles de démo au lancement. Toucher un article le modifie sur place
  (croix pour le supprimer, la saisie passe alors à la ligne du dessous, ou du dessus pour la dernière ;
  « Entrée » crée l'article suivant ; les lignes laissées vierges disparaissent quand on quitte l'onglet). Cocher l'envoie en
  haut des articles cochés, décocher le remet en bas de la liste. La poignée déplace l'article (glisser vertical).
  Pas d'écran vide : sans article à acheter, une ligne vierge « Nouvel article » attend la saisie (sans croix). Elle passe en saisie, clavier ouvert, à l'arrivée sur l'onglet et après « Tout supprimer »,
  pas quand on coche le dernier article. Une ligne vierge ne se coche pas. Ajouts hors maquette : confirmation
  avant « Tout supprimer », masqué quand il n'y a rien à supprimer.

- **Import de recette** (Figma 260:563, 257:373 et 622:16839) : tout se passe dans la même sheet, la flèche revient
  au premier écran. Chaque réseau a sa carte dans le premier écran et ouvre directement l'app du réseau (choix de Pierre :
  le tutoriel « Importer via » ne s'ouvre que depuis « Guide d'import » du profil). Tutoriel (Figma 622:16535) : les trois captures du tutoriel (« Insta 01 » à « TikTok 03 », exportées en
  ×3 dans `assets/images/guide`) défilent seules, et le bouton orange à toucher clignote par-dessus (fixe si
  « Réduire les animations » est activé) ; ouvert depuis le profil, l'écran n'a que la croix ; « Ouvrir … » ouvre l'app du réseau (ou son site, dans un nouvel onglet sur le web). Le partage
  vers Toqué ne peut pas exister dans le prototype : au retour dans l'app, on fait comme si une publication venait
  d'être partagée. Lien web : le CTA reste grisé tant que le champ est vide, et un message d'erreur (hors maquette)
  apparaît si le texte n'est pas une adresse web. La photo n'a pas de maquette : appareil photo ou galerie. Puis l'écran plein écran « Import en cours » (Figma 493:2221) et ouverture de la
  recette importée avec un toast. Chaque mode crée une recette de démo (la photo choisie sert de vignette pour
  l'import par photo). Icônes réseaux, partage, coller, galerie et coche prises chez Phosphor (famille des icônes
  Figma). La poignée apparaît aussi au-dessus des en-têtes avec flèche retour, comme dans Figma.

- **Import en cours** (Figma 493:2221) : les trois ingrédients tombent l'un après l'autre dans l'assiette et s'y
  enfoncent, puis la boucle reprend après une pause. L'écran reste un peu plus de 4 s (l'import est simulé).
  « Annuler » revient à la home sans rien importer. Texte corrigé : « elle sera prête d'ici un instant ! ».
- **Aucune recette** (Figma 493:2104) : affiché quand la home n'a plus aucune recette. Même illustration pour une
  recherche ou des filtres sans résultat : « Aucune recette trouvée », « Nous n'avons trouvé aucune recette.
  Modifie les filtres ou essaye un autre mot clé. » et « Réinitialiser les filtres » (efface aussi la recherche). Texte passé au tutoiement comme le reste de l'app :
  « Tu n'as encore aucune recette enregistrée. Importe ta première recette avec le bouton + ! ».
- Illustrations exportées de Figma en PNG ×3 (grain compris), dans `assets/images/illus`.

- **Profil** (Figma, section « Profil » 536:7387) : écrans Profil, Compte, choix d'avatar, Mes catégories,
  Parts par défaut, Son des minuteurs et leurs sheets. Écarts :
  - Les sous-écrans gardent tous le bouton retour rond, y compris « Compte » qui n'en a pas dans la maquette.
  - Son des minuteurs (Figma 536:7644) : Timer, Den-Den, Ultra Instinct, Outro, fichiers de Pierre dans
    `assets/sounds` (expo-audio). Toucher une ligne la choisit et joue le son une fois, l'onde reste pendant la
    lecture. « Timer » est le son par défaut (Den-Den est coché dans la maquette). Quand un minuteur arrive à
    zéro, le son choisi boucle avec 1,5 s de silence entre deux passages, jusqu'à ce qu'il soit arrêté.
  - Icône « Guide d'import » (livre ouvert) : la maquette reprend celle de « Mes catégories ». Onde du son en
    cours et livre pris chez Phosphor.
  - « Guide d'import » ouvre le tutoriel « Importer via ». « Ajouter le raccourci » est retiré (pas faisable
    sur Android pour l'instant).
  - Textes corrigés : « Choisis un avatar Toqué ! », « choisis une couleur de fond », « galerie »,
    « florent.outan@exemple.fr ».
  - Choix d'avatar : « Enregistrer » est le bouton blanc existant, libellé orange (sombre dans la maquette).
  - Avatars de la page « Avatar » (1:4) : oignon, tomate, olive, biscuit (la tarte a disparu). Le carrousel
    tourne en boucle : un avatar sorti par la gauche revient par la droite. Il est partagé avec l'onboarding.
  - Le champ et les pastilles de « Créer une catégorie » suivent la nouvelle maquette (liseré, écart de 16) : la
    sheet « Enregistrer » de la fiche recette en profite aussi.
  - Parts personnalisées de 1 à 12, les bornes de la fiche recette, qui s'ouvre désormais sur ce nombre de parts.
  - Le prototype n'embarque pas les sons : toucher un son le choisit et affiche l'onde pendant 2,4 s.
  - Le lien vers le design system a disparu de la page (toujours sur /design-system en web).
- **Import en cours** : avec « Réduire les animations » activé, les ingrédients restent posés comme dans Figma.
- **Onboarding** (« Onbarding », 578:7999) : illustrations exportées en calques pour les animer pendant que
  l'étape est affichée (icônes qui tombent dans l'assiette, fiches qui entrent dans le trieur, cases cochées une à une).
  Une 3e et une 4e coche ont été ajoutées pour l'animation ; au repos, seules les deux de la maquette restent.
  « filtres » corrigé en « filtre ». Montré au lancement de chaque session du prototype (rien n'est sauvegardé),
  rejouable depuis Profil > Revoir la présentation. Sans paywall.
  4e étape : choix de l'avatar Toqué, même carrousel et mêmes couleurs que le profil. « Valider » l'enregistre,
  « Ignorer » garde l'avatar actuel. Le CTA « Importer ma première recette » a disparu avec cette étape.

- **Animations ajoutées** (analyse « find-animation-opportunities », absentes de Figma) : toast qui monte en fondu
  et repart par le même chemin, articles de la liste de courses qui changent de section en fondu (iOS et Android),
  coche qui grandit en 140 ms, trait qui barre l'article coché tracé de gauche à droite, timbre de l'écran de fin
  qui se pose avec un léger rebond puis « Fais maison! » souligné au stylo, fondu enchaîné quand la photo prise remplace la vignette. Avec « Réduire les animations » :
  fondus seulement.

## Limites connues

- Seules deux photos de plats existent dans Figma : les six recettes fictives les réutilisent.
- Les filtres d'un même type s'additionnent (Végé OU Dessert), les différents filtres se combinent
  (Végé ET Jow). Le compteur « Voir les résultats (n) » se met à jour à chaque case cochée.
