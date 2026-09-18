# Ji — front-end da Sprint 1

Interface de cadastro, login, recuperação/redefinição de senha e logout do Ji. Nesta sprint, a aplicação usa um adaptador de autenticação em memória e não envia requisições para um back-end.

## Executar

```bash
npm install
npm run dev
```

Conta de demonstração:

- e-mail: `filipe.lopes@email.com`
- senha: qualquer valor não vazio (o mock nunca persiste senhas)

Na recuperação, a ação **Modo demonstração** abre o link mockado sem envio real de e-mail. Também podem ser conferidos diretamente os tokens `token-demonstracao-expirado` e `token-demonstracao-utilizado` na rota `/redefinir-senha?token=...`.

## Verificações

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Com “Lembrar-me”, somente o token fictício, a expiração, o resumo do usuário e o contexto ativo são guardados por sete dias no `localStorage`. Sem essa opção, os mesmos dados ficam apenas no `sessionStorage`. CPF e senha nunca são persistidos.
