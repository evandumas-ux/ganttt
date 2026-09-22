# STORK IV — IRIS

Application statique React / Vite, sans backend. `npm run build` génère le site dans `dist`.

Les tâches et leurs modifications sont enregistrées automatiquement dans le stockage local du navigateur, y compris après ajout ou suppression de tâches. Cette sauvegarde est propre au navigateur et à l'adresse du site : elle n'est pas partagée entre appareils et disparaît si les données du site sont effacées. Utiliser Import/Export en JSON pour transférer ou sauvegarder le planning.

Dans le Gantt, le bouton calendrier de chaque ligne ouvre « Reporter / déplacer » : choisir une date, ajouter un jour ou une semaine, puis déplacer la tâche seule ou ses dépendantes avec elle. Les barres peuvent aussi être glissées ; leurs bords permettent de modifier les dates de début et de fin.

Vérification de la persistance : `node test_storage.mjs` (Node 24).

## Informations du modèle Vite initial  

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
