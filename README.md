# Recouvria

Recouvria est une application web de gestion du recouvrement client avec interface métier, authentification et base SQLite locale.

Versions publiques :

```text
Admin : https://propose-moi-une-application-de-reco.vercel.app/administration
Client : https://propose-moi-une-application-de-reco.vercel.app/client
```

## Fonctionnalites

- Tableau de bord des creances et encaissements
- Portefeuille debiteurs modifiable
- Base SQLite locale via API Node.js
- Authentification par session
- Gestion des clients et contacts
- Gestion des agents de recouvrement
- Relances par appel, SMS, email, WhatsApp et mise en demeure
- Generation de lettres de relance et mises en demeure
- Scenarios de relance J+1, J+7, J+15 et J+30
- Engagements et plans de paiement
- Encaissement partiel ou total
- Cloture automatique des dossiers soldes
- Suivi des commandes clients et generation de dossiers impayes
- Rapports et exports Excel
- Sauvegarde locale dans le navigateur

## Lancer l'application

```powershell
npm start
```

Puis ouvrir :

```text
http://localhost:4173/
```

Compte administrateur local :

```text
Email : admin@recouvria.local
Mot de passe : recouvria2026
```

Compte client public :

```text
Email : client@kfnpharma.local
Mot de passe : client2026
```

Ces identifiants verrouillent les versions publiques partageables quand le backend local n'est pas disponible.

La base est creee automatiquement dans `data/recouvria.sqlite`. Ce dossier est ignore par Git.

## Supabase

Pour connecter le lien client au lien administration :

1. Créer un projet Supabase.
2. Exécuter le script SQL `supabase/schema.sql` dans SQL Editor.
3. Ajouter ces variables dans Vercel, environnement Production :

```text
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Une fois configuré, les boutons du lien client créent des demandes dans Supabase et l'administration les affiche dans le tableau de bord.

Pour préparer la version professionnelle multi-admin, le fichier `supabase/professional_schema.sql` ajoute les tables métier structurées :

- organisations
- comptes et rôles utilisateurs
- clients
- dossiers
- factures
- paiements
- lettres
- audit des actions

Les liens clients générés depuis l'administration utilisent maintenant un token sécurisé quand il est disponible, tout en conservant la compatibilité avec les anciens liens par numéro de dossier.

## Resend

Pour envoyer les emails depuis l'application :

1. Créer une clé API Resend.
2. Ajouter ces variables dans Vercel :

```text
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Recouvria KFN Pharma <onboarding@resend.dev>
```

`RESEND_FROM_EMAIL` peut rester sur `onboarding@resend.dev` pendant les tests. Quand le domaine sera acheté et validé dans Resend, utiliser une adresse professionnelle comme `recouvrement@recouvrement-kfn.com`.

## Structure

- `index.html` : structure de l'interface
- `styles.css` : design responsive
- `app.js` : logique front, synchronisation API, dossiers, clients, agents, lettres, commandes et rapports
- `server.mjs` : serveur Node.js, API, authentification et persistance SQLite
