# Recouvria

Recouvria est une application web locale de gestion du recouvrement client.

## Fonctionnalites

- Tableau de bord des creances et encaissements
- Portefeuille debiteurs modifiable
- Relances par appel, SMS, email, WhatsApp et mise en demeure
- Scenarios de relance J+1, J+7, J+15 et J+30
- Engagements et plans de paiement
- Encaissement partiel ou total
- Cloture automatique des dossiers soldes
- Rapports et export CSV
- Sauvegarde locale dans le navigateur

## Lancer l'application

```powershell
node server.mjs
```

Puis ouvrir :

```text
http://localhost:4173/
```

## Structure

- `index.html` : structure de l'interface
- `styles.css` : design responsive
- `app.js` : logique de gestion des dossiers, relances, paiements et rapports
- `server.mjs` : serveur local Node.js

