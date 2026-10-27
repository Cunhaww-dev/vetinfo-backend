# VetInfo API

Prontuário clínico digital para veterinários autônomos.

## Rodando local

Pré-requisitos: Node 24, Docker e pnpm. Os comandos abaixo estão na ordem em que devem ser executados.

```bash
# 1. Node na versão do projeto (o .nvmrc aponta pra lts/krypton)
nvm use

# 2. pnpm via corepack, não instale global
corepack enable

# 3. Dependências
pnpm install

# 4. Variáveis de ambiente
cp .env.example .env
```

Antes de seguir, **preencha o `.env`**. Os campos `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` são lidos pelo Docker Compose ao criar o banco, e a `DATABASE_URL` é lida pela aplicação e pelo Prisma. Os dois precisam concordar: se o usuário do compose for `vetinfo` e a `DATABASE_URL` disser `postgres`, o container sobe normalmente e a aplicação não conecta. A porta na `DATABASE_URL` é a **5433**, e o motivo está explicado nas decisões abaixo.

O `BETTER_AUTH_SECRET` assina as sessões e não pode ficar vazio. Gere um valor com o comando abaixo e cole no `.env`. O `BETTER_AUTH_URL` já vem certo para rodar local.

```bash
openssl rand -base64 32
```

```bash
# 5. Sobe o Postgres (espere ficar healthy, leva uns segundos)
docker compose up -d
docker ps

# 6. Cria as tabelas e gera o Prisma Client
pnpm exec prisma migrate dev

# 7. Sobe a API em modo watch
pnpm dev
```

Se estiver clonando o projeto do zero, o passo 6 não é opcional. A pasta `src/generated/prisma` está no `.gitignore` porque é código gerado, então em uma cópia nova ela não existe e a aplicação não sobe sem ela. O `migrate dev` já roda o `generate` no fim; se precisar apenas regerar o client sem mexer no banco, use `pnpm exec prisma generate`.

Para conferir se está tudo de pé:

```bash
curl http://localhost:3334/health
```

### Outros comandos

```bash
pnpm typeCheck                      # tsc --noEmit, não emite arquivo
pnpm build                          # compila para dist/
pnpm start                          # roda o build
pnpm exec prisma migrate reset      # apaga e recria o banco local, útil antes de uma demo
docker compose down                 # derruba o container, o volume nomeado preserva os dados
```

## Endpoints

| Método | Rota                      | O que faz                                             |
| ------ | ------------------------- | ----------------------------------------------------- |
| GET    | `/health`                 | Verificação de saúde                                  |
| POST   | `/users`                  | Cadastro de veterinário (`professional` ou `student`) |
| POST   | `/api/auth/sign-in/email` | Login, cria a sessão e devolve o token                |
| GET    | `/api/auth/get-session`   | Devolve a sessão e o usuário logado                   |
| POST   | `/api/auth/sign-out`      | Encerra a sessão                                      |

As rotas `/api/auth/*` são do better-auth. O cadastro **só** acontece por `POST /users`: a rota `POST /api/auth/sign-up/email` do better-auth responde 404, e o motivo está nas decisões abaixo.

## Decisões tomadas durante o desenvolvimento

Separando app.ts e server.ts pois quando tivermos testes E2E com vitest o teste vai importar o app direto e disparar uma request sem precisar abrir porta, se o listen estiver junto do app.ts todo teste vai subir um servidor de verdade, e com isso os testes vão brigar pela mesma porta. Decisão tomada no início para poupar futura refatoração.

**Imports terminando em `.ts` e sempre relativos.** O TypeScript reescreve a extensão no build através do `rewriteRelativeImportExtensions`, então o código fonte fica honesto (o arquivo é `.ts` mesmo) e o `dist/` sai com `.js` funcionando no Node. A parte importante é que essa reescrita **só acontece em caminho relativo**: com alias `@/` o import é emitido intacto e quebra em runtime, e o TS 7 removeu o `baseUrl` de qualquer forma. Como a organização é por domínio, a maioria dos imports é dentro do próprio módulo, e precisar muito de alias entre módulos seria sintoma de acoplamento e não falta de atalho.

**Portas 3334 para a API e 5433 para o Postgres.** Não são as portas padrão de propósito: existe outro projeto rodando na mesma máquina ocupando 3333 e 5432. Todo exemplo de `DATABASE_URL` que se acha na internet vem com 5432, e apontar para o banco errado é um erro que se disfarça de "container quebrado" por uns bons quarenta minutos.

**Erro de regra de negócio é retorno, não exceção.** Os use cases devolvem `Either<DomainError, Resultado>` em vez de lançar. O motivo é que "esse email já está em uso" não é excepcional, é um resultado previsto, e `throw` esconde do tipo de retorno tudo que pode dar errado, o que empurra o controller para um `try/catch` genérico que traduz o mundo inteiro em 500. Com `Either` o compilador obriga quem chama a tratar os dois caminhos.

**A classe base de erro de domínio não estende o `Error` nativo e não carrega `statusCode`.** Não estende porque esses erros nunca são lançados, são devolvidos dentro do `Left`, e o `stack` do `Error` descreve onde um `throw` aconteceu, informação que aqui não existe. E não carrega status code porque quem traduz para HTTP é o controller: se o erro nascesse com um 404 dentro, o domínio teria decidido uma questão de transporte, e o mesmo use case chamado por um worker ou por um CLI carregaria um número que não significa nada ali. O mapa de erro para status vive em `user.controller.ts`, que conhece HTTP e tem todo o direito de conhecer.

**A entidade tem construtor privado e dois métodos estáticos com propósitos diferentes.** O `create()` julga dados novos, valida a invariante e devolve `Either`. O `restore()` remonta um registro que o banco já guardou, recebe o id pronto e devolve a entidade direto, sem revalidar. Não revalidar é intencional: aquela linha já passou pela validação quando nasceu, e se a regra endurecer amanhã os registros antigos ainda precisam conseguir ser carregados. Com o construtor privado, `create()` é a única porta de entrada, e "não existe usuário inválido em memória" passa a ser uma garantia e não uma intenção.

**A regra do CRMV mora na entidade, não no schema de validação.** Dava para resolver "profissional exige CRMV" com um `.refine()` do Zod e teria funcionado para as requisições HTTP. Mas um seed, uma importação de planilha ou um script de migração passariam por cima e criariam profissional sem CRMV direto no banco. A entidade é o único lugar por onde todo mundo passa. Isso aparece na resposta da API: **400 vem da validação de borda, 422 vem da invariante de domínio.**

**A autenticação é do better-auth, e não mais bcrypt com JWT escrito à mão.** A primeira versão do cadastro e do login foi escrita à mão, com `bcryptjs` e `jsonwebtoken`. A troca veio cedo de propósito: hoje só o módulo de usuários depende do auth, e cada módulo novo (pacientes, atendimentos, compartilhamentos) deixaria a troca mais cara. Sessão, refresh, recuperação de senha e verificação de email passam a vir prontos, em vez de virar código de segurança mantido na mão.

**O better-auth fica só na camada `infra/`.** O domínio declara a porta `AuthProvider` com um `signUp()`, e o `BetterAuthProvider` é o único arquivo do módulo que importa a lib. O `RegisterUser` continua o mesmo de antes: valida o email, chama `User.create()` e só então chama `signUp()`. A ligação entre porta e adaptador acontece em `user.routes.ts`, então trocar o better-auth por outra coisa é mudar uma linha ali.

**A rota de cadastro do better-auth é fechada para HTTP.** O `POST /api/auth/sign-up/email` grava o usuário sem passar pela entidade, ou seja, um `professional` conseguiria se cadastrar sem CRMV. Um hook `before` no `auth.ts` devolve 404 quando a chamada vem por HTTP, e deixa passar quando vem do nosso código pelo `auth.api.signUpEmail()`. A diferença entre os dois é o `ctx.request`, que só existe na chamada HTTP. A opção `disableSignUp` não serve aqui porque bloqueia as duas.

**O id do usuário é gerado pelo better-auth, não pela entidade.** O `create()` da entidade ainda gera um UUID, mas o cadastro do better-auth gera o próprio id e não aceita um de fora. Por isso o `signUp()` devolve o usuário como o banco gravou, montado com `restore()`, e é esse id que a API devolve. Vale registrar porque a intuição engana: o `@default(uuid())` do Prisma também não é um default do Postgres, o UUID é gerado em JavaScript na hora do insert.

**O `crmvActivatedAt` não usa `input: false`.** Essa opção do better-auth bloqueia o campo em qualquer chamada, até nas do próprio servidor, e quem calcula a data é a entidade. Sem ela, o campo ficaria aberto na rota pública de cadastro, e é mais um motivo para essa rota estar fechada.

**Login com email inexistente e login com senha errada devolvem exatamente a mesma resposta.** O better-auth já faz isso: mesmo status, mesmo código, mesma mensagem. Diferenciar os dois entregaria de graça a lista de quem tem conta no sistema para qualquer um disposto a testar emails, e num produto que guarda dado clínico isso é problema sério.

**Zod fica na borda e em nenhum lugar além dela.** A validação de formato vive em `user.schema.ts`, na raiz do módulo, aplicada por um middleware genérico em `shared/http/` que qualquer módulo novo reusa passando o próprio schema. Nenhum arquivo de `domain/` ou `application/` importa Zod, e os tipos `z.infer<...>` foram deliberadamente não exportados: se um use case tipasse sua entrada com `z.infer`, a biblioteca de validação teria vazado para a camada de aplicação por via de tipo, sem ninguém perceber no diff. Os tipos de entrada dos use cases são escritos à mão porque são o contrato da aplicação, não subproduto da ferramenta.

**O CLI do Prisma está pinado em `7.10.0` e não deve ser atualizado com `@latest`.** Na época da instalação a tag `latest` do CLI apontava para um release candidate do 8 enquanto o `@prisma/client` apontava para o 7 estável, o que deixa os dois em majors diferentes e faz flags do CLI sumirem sem aviso. Vale ignorar o banner de update que aparece no terminal até o 8 sair de RC.
