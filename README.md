# DIY-StreamDeck

![DIY-StreamDeck Logo](https://raw.githubusercontent.com/Boubix88/DIY-StreamDeck/master/Documentation/logo_streamdeck.png)

> [!WARNING]
> Ce projet est en cours de développement. La version Electron est en cours d'implémentation.

## Table des matières
- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Développement](#développement)
- [Compilation](#compilation)
- [Build pour production](#build-pour-production)
- [Structure du projet](#structure-du-projet)
- [Contribution](#contribution)
- [Licence](#licence)

## Présentation

DIY-StreamDeck est un projet de contrôleur de médias personnalisé pour Windows. Il offre une interface matérielle et logicielle pour contrôler le volume, gérer la lecture multimédia, surveiller les performances système et plus encore.

## Fonctionnalités

- **Contrôle du volume** : Ajustez le volume de votre PC Windows directement depuis le StreamDeck.
- **Contrôle des médias** : Jouez, mettez en pause et naviguez entre les pistes précédentes et suivantes.
- **Surveillance système** : Affichez les températures du CPU et du GPU, l'utilisation de la RAM et plus encore.
- **Interface personnalisable** : Interface moderne et réactive construite avec React et Tailwind CSS.
- **Communication série** : Communication avec le matériel Arduino via le port série.
- **RGB personnalisable** : Contrôlez les lumières RGB du StreamDeck.

## Prérequis

- Node.js 16+ et npm 7+
- Python 3.8+ (pour certaines fonctionnalités)
- Un environnement de développement (VS Code recommandé)

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/Boubix88/DIY-StreamDeck.git
   cd DIY-StreamDeck
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

## Développement

Pour lancer l'application en mode développement :

```bash
npm run dev
```

Cela lancera à la fois le serveur de développement React et l'application Electron.

## Compilation

Pour compiler l'application pour le développement :

```bash
npm run build
```

## Build pour production

Pour créer un package d'installation pour votre système d'exploitation :

```bash
npm run electron:build
```

Les fichiers de sortie seront disponibles dans le dossier `dist/`.

DIY-StreamDeck est un projet de contrôleur de médias personnalisé pour Windows. Il offre une interface matérielle et logicielle pour contrôler le volume, jouer/pauser le son, naviguer entre les pistes précédentes/suivantes et lancer des logiciels.

## Fonctionnalités

- **Contrôle du volume** : Ajustez le volume de votre PC Windows directement depuis le StreamDeck grâce à sa molette.
- **Contrôle des médias** : Jouez, mettez en pause et naviguez entre les pistes précédentes et suivantes.
- **Touches mécaniques assignables** : Le StreamDeck est équipé d'une grille de 4x3 touches mécaniques que vous pouvez assigner pour lancer des logiciels.
- **Affichage des températures** : Un écran rond sur le StreamDeck affiche les températures du CPU et du GPU.
- **Ruban RGB** : Le StreamDeck est équipé d'un ruban RGB que vous pouvez paramétrer depuis le logiciel.

## Images

![Image du logiciel](https://raw.githubusercontent.com/Boubix88/DIY-StreamDeck/master/Documentation/capture_logiciel.png)

![Image du matériel](https://raw.githubusercontent.com/Boubix88/DIY-StreamDeck/master/Documentation/capture_materiel.jpg)

![Image du diagramme](https://raw.githubusercontent.com/Boubix88/DIY-StreamDeck/master/Documentation/Schematic_DIY-Streamdeck.png)

## Comment ça marche

Le DIY-StreamDeck est conçu pour être facile à utiliser. Il suffit d'assigner les touches mécaniques à vos logiciels préférés depuis l'interface du logiciel, et vous pouvez ensuite les lancer directement depuis le StreamDeck. L'écran rond affiche les températures du CPU et du GPU, ou le volume lorsque vous le changez.

## Conclusion

Le DIY-StreamDeck est un outil puissant pour contrôler votre PC Windows. Que vous soyez un gamer, un créateur de contenu ou simplement quelqu'un qui aime avoir un contrôle total sur son environnement informatique, le DIY-StreamDeck est fait pour vous.
