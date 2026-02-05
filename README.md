# KeyNection 🔑🏠

[![CI](https://github.com/amindutenao-source/KeyNection/actions/workflows/ci.yml/badge.svg)](https://github.com/amindutenao-source/KeyNection/actions/workflows/ci.yml) [![codecov](https://codecov.io/gh/amindutenao-source/KeyNection/branch/main/graph/badge.svg)](https://codecov.io/gh/amindutenao-source/KeyNection) [![npm](https://img.shields.io/npm/v/@amindutenao-source/keynection.svg)](https://www.npmjs.com/package/@amindutenao-source/keynection)

**Unlock the value of unused spaces.**

---

## 🎯 La solution KeyNection

KeyNection connecte **propriétaires de biens sous-exploités** et **gestionnaires professionnels** pour transformer des espaces vides en revenus passifs — sans friction, en toute sécurité, et avec un modèle gagnant-gagnant.

👉 **Pas une conciergerie.** Pas une plateforme de location classique.  
👉 **Un tiers de confiance** qui structure la relation propriétaire ⇔ gestionnaire, avec :

- 👤 Les propriétaires monétisent sans gérer
- 🏢 Les gestionnaires développent leur activité sans acheter de biens
- 🔑 KeyNection orchestre la relation, le cadre et la confiance

---

## 🌍 Le problème

Des millions de biens restent **sous-exploités** :

- manque de temps,
- manque d'expertise,
- peur des contraintes opérationnelles.

En parallèle, des gestionnaires compétents :

- cherchent des biens,
- manquent de visibilité,
- peinent à structurer leurs partenariats.

👉 Le marché est **fragmenté, opaque et inefficace**.

---

## 🎁 Pour qui ?

### 🏠 Propriétaires

- Biens vacants, secondaires ou sous-exploités
- Envie de rentabilité **sans gestion quotidienne**
- Recherche de partenaires fiables

### 🧑‍💼 Gestionnaires & conciergeries

- Professionnels ↓, gestion courte ou moyenne durée
- Recherche de biens **sans investir**
- Besoin de visibilité et de crédibilité

---

## ✨ Ce que fait KeyNection

KeyNection **ne gère pas les biens** :  
elle **connecte, sécurise et structure les relations**.

### Pour les Propriétaires

- Publication de biens avec photos et données clés
- Réception et comparaison des candidatures
- Signature numérique des contrats
- Suivi des performances et paiements
- Notifications en temps réel

### Pour les Gestionnaires

- Accès à des biens qualifiés dans leur zone
- Candidature avec proposition de conditions
- Gestion d'un portefeuille de biens
- Reporting & statistiques
- Messagerie directe avec les propriétaires

### Fonctionnalités plateforme

- Authentification sécurisée (JWT)
- Interface responsive mobile-first
- Système d'emails automatisé
- Dashboard avec statistiques
- Recherche et filtres avancés
- Génération de contrats PDF
- Notifications push
- Validation stricte des données
- Protection CORS & rate limiting
- Uploads sécurisés
- Gestion centralisée des erreurs

---

## 💰 Modèle économique (en cours de déploiement)

KeyNection repose sur un modèle **simple et scalable** :

- 💎 **Abonnements** (propriétaires & gestionnaires)
- 💎 **Frais de service** sur les contrats conclus
- 💎 **Options premium** : visibilité, scoring, automatisations, reporting avancé

👉 **Aucun stock, aucune gestion opérationnelle, forte marge potentielle.**

---

## 🧭 Positionnement stratégique

- ❌ Pas une conciergerie
- ❌ Pas une plateforme de location type Airbnb
- ✅ **Un tiers de confiance** qui structure le marché ⇔

**Différenciation clé** :  
KeyNection ne possède ni ne gère les biens. Elle crée le cadre, la transparence et la sécurité pour que propriétaires et gestionnaires collaborent efficacement.

---

## ⚙️ Stack technologique

### Backend
- Node.js • Express • TypeScript
- Prisma ORM • PostgreSQL
- JWT • bcrypt
- Redis (cache)

---

## ✅ Tests

- Tests unitaires (server) + UI (client) :
  `npm test`
- Tests e2e (Postgres requis) :
  `npm run test:e2e`
- Pipeline CI local (lint + coverage + client) :
  `npm run test:ci`

Variables utiles :
- `DATABASE_URL` (ex. `postgresql://postgres:password@localhost:5432/keynection?schema=public`)
- `JWT_SECRET`
- Swagger (API docs)
- Tests : Jest

---

## 📦 Publication npm

- Connexion npm : `npm login`
- Publication (scope public) : `npm publish --access public`

Le paquet est publié sous `@amindutenao-source/keynection`.

### Frontend
- React 18 • TypeScript
- Vite
- TailwindCSS
- React Router v6
- React Query
- PWA (offline, notifications)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL
- Redis
- Nginx (reverse proxy en production)

---

## 🎯 Vision

KeyNection ambitionne de devenir :

- la **référence de la mise en relation propriétaire ⇔ gestionnaire**,
- d'abord en **PACA & Monaco**,
- puis à l'échelle nationale et internationale.

---

## 🤝 Contribution & statut

Le projet est en **développement actif**.  
Les contributions, partenariats et échanges stratégiques sont les bienvenus.

📧 **support@keynection.com** ↗ 
