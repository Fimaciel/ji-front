# Ji Front — Sprints 1 e 2

Interface React e TypeScript do Gerenciador Financeiro Pessoal Ji. A aplicação
consome a API REST por padrão e inclui autenticação, recuperação de senha,
layout interno responsivo e a tela unificada de configurações da Sprint 2.

## Configuração e execução

```bash
npm install
VITE_API_URL=http://localhost:8080 npm run dev
```

Variáveis disponíveis:

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | origem da API REST, sem `/api/v1` |
| `VITE_USAR_MOCK` | `false` | use `true` somente para teste ou demonstração local |

Para iniciar sem o back-end:

```bash
VITE_USAR_MOCK=true npm run dev
```

Conta do mock:

- e-mail: `filipe.lopes@email.com`;
- senha: `Ji@12345`.

O adaptador mock mantém contas somente na memória. O front-end persiste apenas
o token, a expiração, o resumo do usuário e o contexto ativo. Senhas, CPF e
data de nascimento não são gravados no armazenamento do navegador. No modo
REST, senhas e encerramento lógico da conta são responsabilidades exclusivas
da API.

## Sprint 2

A rota protegida `/app/configuracoes` reúne:

- perfil e CPF somente para leitura;
- confirmação por senha atual e troca opcional de senha;
- salário em BRL e notificações;
- temas claro, escuro e automático, aplicados imediatamente;
- restauração das preferências;
- encerramento lógico mediante a confirmação `EXCLUIR`.

O tema fica em um cache local independente da sessão para evitar flash visual.
No modo automático, a aplicação acompanha `prefers-color-scheme` em tempo
real e reconcilia o cache com a preferência retornada pelo servidor.

## Verificações

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm run test:e2e` usa o mock explicitamente e executa os fluxos em Chromium
1440 px, Firefox 820 px e WebKit 390 px. Com back-end e Mailpit ativos, execute
o fluxo REST integrado assim:

```bash
VITE_API_URL=http://localhost:8080 \
MAILPIT_URL=http://localhost:8025 \
npm run test:e2e:integrado
```

A matriz consolidada de requisitos e evidências está no repositório do
back-end, em
[`docs/sprint-2-rastreabilidade.md`](https://github.com/Fimaciel/ji-backend/blob/main/docs/sprint-2-rastreabilidade.md).
