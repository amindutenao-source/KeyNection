# 🚀 Guide de Démarrage Rapide - Keynection
[![CI](https://github.com/amindutenao-source/KeyNection/actions/workflows/ci.yml/badge.svg)](https://github.com/amindutenao-source/KeyNection/actions/workflows/ci.yml)

## Prérequis

- **Node.js** 18+ et **npm**
- **PostgreSQL** 14+ (ou Docker)
- **Git**

## Installation Rapide

### 1. Cloner le projet
```bash
git clone https://github.com/amindutenao-source/KeyNection.git
cd KeyNection
```

### 2. Installation automatique
```bash
./install.sh
```

### 3. Configuration de la base de données

#### Option A : Avec Docker (Recommandé)
```bash
docker-compose up -d postgres
```
Le conteneur expose PostgreSQL sur le port local `5433`.

#### Option B : PostgreSQL local
- Installez PostgreSQL
- Créez une base de données `keynection`
- Créez un utilisateur dédié (ex. `keynection_user`) avec les permissions appropriées

### 4. Configuration des variables d'environnement

Modifiez `server/.env` :
```env
DATABASE_URL="postgresql://keynection_user:keynection_password@localhost:5433/keynection?schema=public"
JWT_SECRET="votre-secret-jwt-super-securise"
EMAIL_HOST="smtp.gmail.com"
EMAIL_USER="votre-email@gmail.com"
EMAIL_PASS="votre-mot-de-passe-app"
FRONTEND_URL="http://localhost:3000"
```

### 5. Initialisation de la base de données
```bash
npm run setup
```

### 6. Lancement de l'application
```bash
npm run dev
```

## Accès à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **PgAdmin** (si Docker) : http://localhost:5050

## Première utilisation

1. **Créer un compte** sur http://localhost:3000/register
2. **Choisir un rôle** : Propriétaire ou Exploitant
3. **Compléter votre profil**
4. **Commencer à utiliser la plateforme**

## Fonctionnalités principales

### Pour les Propriétaires
- ✅ Publier des biens immobiliers
- ✅ Recevoir des candidatures
- ✅ Accepter/refuser des exploitants
- ✅ Générer des contrats numériques

### Pour les Exploitants
- ✅ Rechercher des biens disponibles
- ✅ Postuler pour des biens
- ✅ Suivre vos candidatures
- ✅ Signer des contrats

## Structure du projet

```
keynection/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   ├── contexts/      # Contextes React
│   │   └── services/      # Services API
│   └── public/
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── routes/        # Routes API
│   │   ├── middleware/    # Middleware
│   │   ├── utils/         # Utilitaires
│   │   └── templates/     # Templates d'emails
│   ├── prisma/            # Schéma de base de données
│   └── uploads/           # Fichiers uploadés
└── docs/                  # Documentation
```

## Commandes utiles

```bash
# Développement
npm run dev              # Lance frontend + backend
npm run server           # Lance uniquement le backend
npm run client           # Lance uniquement le frontend

# Base de données
npm run db:generate      # Génère le client Prisma
npm run db:push          # Pousse le schéma vers la DB
npm run db:studio        # Ouvre Prisma Studio

# Production
npm run build            # Build du frontend
npm start                # Lance en production
```

## Dépannage

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est démarré
- Vérifiez les paramètres dans `server/.env`
- Testez la connexion : `psql -h localhost -U keynection_user -d keynection`

### Erreur de port déjà utilisé
- Changez les ports dans les fichiers de configuration
- Ou arrêtez les services qui utilisent ces ports

### Erreur de dépendances
```bash
rm -rf node_modules package-lock.json
npm install
```

## Support

- 📧 Email : support@keynection.com
- 📖 Documentation : [docs.keynection.com](https://docs.keynection.com)
- 🐛 Issues : [GitHub Issues](https://github.com/amindutenao-source/KeyNection/issues)

---

**Keynection** - Unlock the value of unused spaces 🏠✨ 
