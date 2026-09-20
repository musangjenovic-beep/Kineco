# DOCUMENTATION TECHNIQUE — Plateforme Numérique de Gestion Scolaire (RDC)

## 1. Vue d'ensemble de l'architecture

La plateforme est une application web et mobile responsive (compatible PWA), conçue pour les écoles de la République Démocratique du Congo (Kinshasa, Lubumbashi, Goma, etc.).
Elle adopte une architecture **multi-tenant (multi-écoles)** avec isolation stricte des données par `school_id`.

- **Frontend** : React 19 + TypeScript + Tailwind CSS + Lucide Icons + Motion
- **Backend / Serveur d'API** : Node.js / Express (compatible Vercel Serverless Functions ou Cloud Run / Docker)
- **Base de données & Stockage** : PostgreSQL / Supabase avec Row Level Security (RLS)
- **Paiements** : Passerelle Mobile Money (M-Pesa Vodacom, Airtel Money, Orange Money, Cash) avec délivrance de reçus numérotés et vérifiables
- **SMS & Alertes** : Passerelle SMS autonome (templates dynamiques d'absence, retard, rappel de frais scolaires)

---

## 2. Rôles et Matrice des Permissions

| Rôle | Périmètre | Permissions Clés |
|---|---|---|
| **Super Administrateur** | Entreprise | Gestion des établissements, abonnements (Basic/Standard/Premium), configuration globale |
| **Directeur** | Établissement | Tableau de bord exécutif, statistiques générales, validation et alertes critiques |
| **Admin Scolaire** | Établissement | Configuration des années, périodes, filières, classes, matières, création des comptes |
| **Directeur des Études** | Établissement | Pédagogie, affectation des enseignants, validation des notes et bulletins officiels RDC |
| **Directeur de Discipline** | Établissement | Pointage d'assiduité, incidents, sanctions, convocations et alertes SMS aux parents |
| **Comptable / Caissier** | Établissement | Fixation des frais (USD/CDF), encaissement Mobile Money & Cash, impression des reçus |
| **Secrétaire** | Établissement | Enregistrement des élèves, attribution des matricules, dossiers et attestations |
| **Surveillant** | Établissement | Pointage rapide des présences/retards, signalement d'incidents |
| **Enseignant** | Ses classes | Interface mobile simplifiée : appel de présence dynamique, saisie des notes (Brouillon/Publié) |
| **Parent / Tuteur** | Ses enfants | Vue multi-enfants (Enfant 1/2/3), suivi des notes, moyennes, bulletins, paiement des frais |
| **Élève** | Son compte | Consultation personnelle des notes, absences, bulletins et emploi du temps |

---

## 3. Déploiement et Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com).
2. Ouvrez l'éditeur SQL de Supabase (**SQL Editor**) et exécutez le script complet situé dans `/supabase/schema.sql`.
3. Le script configure :
   - L'ensemble des 18 tables relationnelles.
   - Les clés étrangères et contraintes d'intégrité.
   - L'activation de **Row Level Security (RLS)** sur toutes les tables sensibles.
   - Les politiques de sécurité garantissant qu'aucun utilisateur d'une école A ne peut accéder aux données d'une école B.
4. Récupérez vos clés dans les paramètres API de Supabase (`URL`, `anon key`, `service_role key`).
5. Configurez vos variables d'environnement dans `.env` ou sur le tableau de bord Vercel.

---

## 4. Déploiement sur Vercel

1. Connectez votre dépôt Git à Vercel.
2. Définissez les variables d'environnement dans Vercel :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Le framework détectera automatiquement la configuration Vite/React ou Node.js.
4. Commande de build : `npm run build`
5. Répertoire de sortie : `dist`

---

## 5. Spécificités RDC Intégrées

1. **Système de devises bivalente** : Montants en Dollars américains (USD) et Francs Congolais (CDF) avec taux de change configurable par école (ex: 2850 CDF = 1 USD).
2. **Bulletins Officiels RDC** : Conformité aux normes du Ministère de l'EPST (Maxima de période, Maxima d'examens, totaux semestriels, pourcentages, classements/rangs, Conduite & Application, et décision du jury).
3. **Paiement Mobile Money** : Intégration M-Pesa (Vodacom), Airtel Money et Orange Money avec reçu officiel numéroté (ex: `REC-2026-0042`).
4. **Dates 100% dynamiques** : Aucune date statique codée en dur. L'année scolaire, les trimestres/semestres et les dates d'appel s'adaptent automatiquement au calendrier en cours.
