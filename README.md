# Ji Front — Implementação funcional completa

Interface React e TypeScript do Gerenciador Financeiro Pessoal Ji. A aplicação
consome a API REST por padrão e inclui autenticação, recuperação de senha,
layout interno responsivo, a tela unificada de configurações da Sprint 2 e o
gerenciamento de categorias e transações da Sprint 3, além do dashboard e dos
orçamentos mensais por categoria da Sprint 4, os contextos compartilhados da
Sprint 5 e a colaboração da Sprint 6. As rotas finais cobrem importação
revisável de PDF/XLSX e relatórios gerais com exportação.

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

## Sprint 3

As rotas protegidas `/app/transacoes` e `/app/categorias` oferecem:

- cadastro, edição e exclusão de entradas e saídas;
- filtros por descrição, período, tipo e categoria, com paginação;
- categorias padrão protegidas e categorias personalizadas editáveis;
- validação de valor positivo, data não futura, categoria e descrição;
- adaptação para desktop, tablet e celular, nos temas claro e escuro.

O modo mock possui dados demonstrativos para essas telas. No modo REST, todas
as operações usam o contexto ativo informado pela sessão autenticada.

## Sprint 4

As rotas protegidas `/app` e `/app/orcamentos` oferecem:

- saldo, entradas e saídas do mês no dashboard;
- gráfico do fluxo acumulado, principais categorias e transações recentes;
- atualização automática do dashboard a cada dois segundos;
- criação, edição e exclusão de um limite mensal por categoria;
- consumo calculado pelas saídas do mês, com alerta visual a partir de 80% e
  destaque quando o limite é excedido;
- estados vazios e adaptação para desktop, tablet e celular.

O mock inclui transações e orçamentos demonstrativos. No modo REST, os dados
são sempre calculados no contexto ativo e o mês é enviado no formato
`AAAA-MM`.

## Sprint 5

Os fluxos de contexto incluem:

- escolha obrigatória após o login quando a conta participa de mais de um contexto;
- seletor fixo no cabeçalho, com atualização das telas financeiras;
- criação e listagem de contextos pessoais e compartilhados;
- lista de convites pendentes, aceite e recusa;
- abertura do convite por link público e resposta após autenticação.

As rotas protegidas são `/selecionar-contexto`, `/app/contextos` e
`/app/convites`. O link externo usa `/convite/:token`. O mock começa com um
convite demonstrativo e permite validar o fluxo completo sem o back-end.

## Sprint 6

A rota protegida `/app/colaboracao` reúne a gestão do contexto compartilhado:

- convite, reenvio e cancelamento de acesso de colaborador;
- listagem de participantes ativos e do histórico de saídas;
- troca entre os papéis de administrador e colaborador;
- remoção de participante e saída voluntária, mantendo ao menos um administrador;
- cadastro, edição e exclusão de dependentes passivos;
- convite de dependente com acesso de leitura, sem mudança manual para esse papel.

As ações administrativas aparecem apenas para administradores. Em contexto
pessoal, a tela orienta a selecionar ou criar um contexto compartilhado.

## Importações e relatórios

As rotas protegidas `/app/importacoes` e `/app/relatorios` oferecem:

- seleção ou arraste de PDF/XLSX com limite de 10 MB;
- revisão dos lançamentos, indicação de duplicados e ajuste de categoria;
- histórico e desfazimento da última importação concluída;
- filtros por período, tipo, categoria e contextos acessíveis;
- resumo de entradas, saídas, saldo e distribuição por categoria;
- download dos relatórios em PDF e XLSX.

O dependente pode consultar relatórios, mas não confirma nem desfaz
importações. O modo mock mantém o mesmo contrato para testes e demonstração.

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
[`docs/sprint-3-rastreabilidade.md`](https://github.com/Fimaciel/ji-backend/blob/main/docs/sprint-3-rastreabilidade.md).
A Sprint 4 está registrada em
[`docs/sprint-4-rastreabilidade.md`](https://github.com/Fimaciel/ji-backend/blob/main/docs/sprint-4-rastreabilidade.md).
A Sprint 6 está registrada em
[`docs/sprint-6-rastreabilidade.md`](https://github.com/Fimaciel/ji-backend/blob/main/docs/sprint-6-rastreabilidade.md).
A entrega final está registrada em
[`docs/sprint-7-rastreabilidade.md`](https://github.com/Fimaciel/ji-backend/blob/main/docs/sprint-7-rastreabilidade.md).
