# Landing Page — Denise Ribeiro Soluções Contábeis LTDA

Landing page responsiva mantendo a identidade visual original do projeto: fundo escuro, contraste em dourado, tipografia elegante, blocos minimalistas, navegação fixa e animações discretas.


## Estrutura

- `public/index.html` — conteúdo e seções da página.
- `public/styles.css` — identidade visual, responsividade e animações.
- `public/script.js` — menu mobile, animações por scroll e envio do formulário.
- `server.js` — servidor Express, validação do formulário e geração do link do WhatsApp.
- `.env` — configurações usadas localmente.
- `data/submissions.json` — armazenamento local das solicitações recebidas.

## Rodando localmente

Requer Node.js 18+.

```bash
npm install
npm start
```

Abra `http://localhost:3000`.

## Contato

O formulário registra a solicitação e abre o WhatsApp da profissional com os dados preenchidos para que o usuário conclua o atendimento.

Os dados de contato utilizados no projeto são os informados pela cliente no documento de requisitos.
