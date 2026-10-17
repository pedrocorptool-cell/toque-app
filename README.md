# Toqué — prototype mobile

Prototype cliquable de l'app Toqué, en React Native avec Expo (SDK 58, Expo Router, TypeScript),
construit à partir de la maquette Figma.

## Lancer le prototype sur ton téléphone

1. Installe **Expo Go** sur ton téléphone (App Store ou Google Play).
2. Sur ton Mac, il faut Node.js 20 ou plus récent (`node -v` pour vérifier, sinon https://nodejs.org).
3. Dans un terminal :

   ```bash
   cd ~/"Projets Claude"/toque-app
   npm install
   npx expo start
   ```

4. Scanne le QR code affiché : avec l'appareil photo sur iPhone, depuis Expo Go sur Android.
   Le téléphone et le Mac doivent être sur le même Wi‑Fi. Sinon : `npx expo start --tunnel`.

Pour voir l'app dans le navigateur : `npx expo start --web`.

## Organisation du code

```
src/
  app/                    écrans (Expo Router : un fichier = une route)
    (tabs)/               onglets Recettes, Liste, Profil
  components/
    icons/                icônes exportées de la planche Figma « Icônes »
    ui/                   composants du design system (un fichier par famille)
    screens/              morceaux d'écrans partagés
  theme/tokens.ts         couleurs, espacements, rayons, typo, ombres
docs/ecarts-figma.md      différences entre la maquette et le code
```

Règle : un composant n'utilise que les tokens sémantiques de `theme/tokens.ts`, jamais une couleur en dur.

## Avancement

- [x] Étape 1 : socle et design system (écran « Design system » dans l'onglet Recettes)
- [ ] Étape 2 : flow principal (accueil, liste, recette, filtres, import, enregistrement)
- [ ] Étape 3 : minuteur et modification de recette par l'IA (réponses simulées)
- [ ] Étape 4 : test sur téléphone et corrections
