# Recouvria

Recouvria est une application web de gestion du recouvrement client avec interface métier, authentification et base SQLite locale.

Versions publiques :

```text
https://kadioboniyves-dot.github.io/recouvria/
https://propose-moi-une-application-de-reco.vercel.app/
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

Le meme mot de passe verrouille aussi la version publique partageable quand le backend local n'est pas disponible.

La base est creee automatiquement dans `data/recouvria.sqlite`. Ce dossier est ignore par Git.

## Structure

- `index.html` : structure de l'interface
- `styles.css` : design responsive
- `app.js` : logique front, synchronisation API, dossiers, clients, agents, lettres, commandes et rapports
- `server.mjs` : serveur Node.js, API, authentification et persistance SQLite
