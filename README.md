# ShowroomBaby Mobile

Application mobile de marketplace pour produits de bébé développée avec React Native et Expo.

## Technologies utilisées

- React Native avec Expo
- TypeScript
- NativeWind (TailwindCSS)
- React Navigation
- Zustand
- React Query
- Axios

## Prérequis

- Node.js (v16 ou supérieur)
- npm ou yarn
- Expo CLI
- iOS Simulator (pour macOS) ou Android Studio (pour Android)

## Installation

1. Cloner le repository

```bash
git clone https://github.com/votre-username/showroombaby-mobile.git
cd showroombaby-mobile
```

2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

3. Lancer l'application

```bash
npm start
# ou
yarn start
```

## Structure du projet

```
src/
├── api/        # Configuration API et services
├── assets/     # Images, fonts et autres ressources
├── components/ # Composants réutilisables
├── hooks/      # Hooks personnalisés
├── navigation/ # Configuration de la navigation
├── screens/    # Écrans de l'application
├── store/      # État global (Zustand)
├── types/      # Types TypeScript
└── utils/      # Fonctions utilitaires
```

## Fonctionnalités

- Authentification JWT
- Liste des produits avec filtres
- Détail des produits
- Messagerie entre utilisateurs
- Système de favoris
- Upload de photos
- Notifications push
- Géolocalisation

## Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'feat: add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## License

MIT
