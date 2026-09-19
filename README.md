# Ji — front-end da Sprint 1

Interface de cadastro, login, recuperação/redefinição de senha e logout do Ji. Nesta sprint, a aplicação usa um adaptador de autenticação em memória e não envia requisições para um back-end.

## Executar

```bash
npm install
npm run dev
```

Conta de demonstração:

- e-mail: `filipe.lopes@email.com`
- senha: `Ji@12345`

As credenciais de contas cadastradas são resumidas somente na memória do mock. A aplicação nunca
grava senhas em texto claro, CPF ou data de nascimento no armazenamento do navegador.
Esse resumo local serve apenas à demonstração; na integração real, o hash bcrypt será responsabilidade
do back-end.

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
