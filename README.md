diff --git a/README.md b/README.md
index 18bc70ebe277fbfe6e55e6f9a0ae7e2c3e4bdd83..d63960099882c2c11b83f5aaad3329335dbd2dd0 100644
--- a/README.md
+++ b/README.md
@@ -1,16 +1,47 @@
-# React + Vite
+# StockFlow
 
-This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
+App React + Vite no frontend e Express no backend (mesmo repositório).
 
-Currently, two official plugins are available:
+## Rodando local
 
-- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
-- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
+1. Instale dependências:
 
-## React Compiler
+```bash
+npm ci
+```
 
-The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
+2. Em um terminal, suba a API:
 
-## Expanding the ESLint configuration
+```bash
+npm run dev:api
+```
 
-If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
+3. Em outro terminal, suba o frontend:
+
+```bash
+npm run dev:front
+```
+
+- Frontend: `http://localhost:5173`
+- API: `http://localhost:3001`
+
+O `vite.config.js` já faz proxy de `/products` e `/cash` para a API local.
+
+## Deploy no Render (Web Service)
+
+Use estas configurações no serviço:
+
+- **Build Command**: `npm ci && npm run build`
+- **Start Command**: `npm start`
+
+O servidor Express serve os arquivos de `dist/` e também expõe as rotas de API.
+
+## Solução para erro comum
+
+Se aparecer erro de instalação com `npm ci` dizendo que `package.json` e `package-lock.json` estão fora de sincronia, execute:
+
+```bash
+npm install
+```
+
+e faça commit dos arquivos atualizados.
