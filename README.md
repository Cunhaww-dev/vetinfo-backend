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

```bash
# 5. Sobe o Postgres (espere ficar healthy, leva uns segundos)
docker compose up -d
docker compose ps

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

| Método | Rota        | O que faz                                             |
| ------ | ----------- | ----------------------------------------------------- |
| GET    | `/health`   | Verificação de saúde                                  |
| POST   | `/users`    | Cadastro de veterinário (`professional` ou `student`) |
| POST   | `/sessions` | Login, devolve o JWT                                  |

## Decisões tomadas durante o desenvolvimento

Separando app.ts e server.ts pois quando tivermos testes E2E com vitest o teste vai importar o app direto e disparar uma request sem precisar abrir porta, se o listen estiver junto do app.ts todo teste vai subir um servidor de verdade, e com isso os testes vão brigar pela mesma porta. Decisão tomada no início para poupar futura refatoração.

**Imports terminando em `.ts` e sempre relativos.** O TypeScript reescreve a extensão no build através do `rewriteRelativeImportExtensions`, então o código fonte fica honesto (o arquivo é `.ts` mesmo) e o `dist/` sai com `.js` funcionando no Node. A parte importante é que essa reescrita **só acontece em caminho relativo**: com alias `@/` o import é emitido intacto e quebra em runtime, e o TS 7 removeu o `baseUrl` de qualquer forma. Como a organização é por domínio, a maioria dos imports é dentro do próprio módulo, e precisar muito de alias entre módulos seria sintoma de acoplamento e não falta de atalho.

**Portas 3334 para a API e 5433 para o Postgres.** Não são as portas padrão de propósito: existe outro projeto rodando na mesma máquina ocupando 3333 e 5432. Todo exemplo de `DATABASE_URL` que se acha na internet vem com 5432, e apontar para o banco errado é um erro que se disfarça de "container quebrado" por uns bons quarenta minutos.

**Erro de regra de negócio é retorno, não exceção.** Os use cases devolvem `Either<DomainError, Resultado>` em vez de lançar. O motivo é que "esse email já está em uso" não é excepcional, é um resultado previsto, e `throw` esconde do tipo de retorno tudo que pode dar errado, o que empurra o controller para um `try/catch` genérico que traduz o mundo inteiro em 500. Com `Either` o compilador obriga quem chama a tratar os dois caminhos.

**A classe base de erro de domínio não estende o `Error` nativo e não carrega `statusCode`.** Não estende porque esses erros nunca são lançados, são devolvidos dentro do `Left`, e o `stack` do `Error` descreve onde um `throw` aconteceu, informação que aqui não existe. E não carrega status code porque quem traduz para HTTP é o controller: se o erro nascesse com um 404 dentro, o domínio teria decidido uma questão de transporte, e o mesmo use case chamado por um worker ou por um CLI carregaria um número que não significa nada ali. O mapa de erro para status vive em `user.controller.ts`, que conhece HTTP e tem todo o direito de conhecer.

**A entidade tem construtor privado e dois métodos estáticos com propósitos diferentes.** O `create()` julga dados novos, valida a invariante e devolve `Either`. O `restore()` remonta um registro que o banco já guardou, recebe o id pronto e devolve a entidade direto, sem revalidar. Não revalidar é intencional: aquela linha já passou pela validação quando nasceu, e se a regra endurecer amanhã os registros antigos ainda precisam conseguir ser carregados. Com o construtor privado, `create()` é a única porta de entrada, e "não existe usuário inválido em memória" passa a ser uma garantia e não uma intenção.

**A regra do CRMV mora na entidade, não no schema de validação.** Dava para resolver "profissional exige CRMV" com um `.refine()` do Zod e teria funcionado para as requisições HTTP. Mas um seed, uma importação de planilha ou um script de migração passariam por cima e criariam profissional sem CRMV direto no banco. A entidade é o único lugar por onde todo mundo passa. Isso aparece na resposta da API: **400 vem da validação de borda, 422 vem da invariante de domínio.**

**O id é gerado pela entidade, com `crypto.randomUUID()`.** Vale registrar porque a intuição engana: o `@default(uuid())` do Prisma não é um default do Postgres, a migration sai sem `DEFAULT` nenhum e o UUID é gerado em JavaScript pelo próprio Prisma na hora do insert. Então a escolha nunca foi entre banco e aplicação, era entre infra e domínio. Com a entidade gerando, ela nasce completa antes de tocar no banco e pode ser testada sem subir container.

**O hash da senha acontece no use case e o JWT é assinado no controller.** Se a entidade chamasse o bcrypt, o domínio importaria uma biblioteca de infraestrutura, e como hash é lento de propósito o `create()` teria que virar assíncrono, ou seja, uma invariante de domínio precisando de `await`. O token seguiu o mesmo raciocínio invertido: ele é detalhe de transporte, um CLI chamando o mesmo "autenticar" não quer token nenhum, quer saber se as credenciais batem. O use case responde "são válidas, e este é o usuário", e o controller decide o que fazer com isso.

**Login com email inexistente e login com senha errada devolvem exatamente a mesma resposta.** Mesmo status, mesmo código, mesma mensagem. Diferenciar os dois entregaria de graça a lista de quem tem conta no sistema para qualquer um disposto a testar emails, e num produto que guarda dado clínico isso é problema sério.

**Zod fica na borda e em nenhum lugar além dela.** A validação de formato vive em `user.schema.ts`, na raiz do módulo, aplicada por um middleware genérico em `shared/http/` que qualquer módulo novo reusa passando o próprio schema. Nenhum arquivo de `domain/` ou `application/` importa Zod, e os tipos `z.infer<...>` foram deliberadamente não exportados: se um use case tipasse sua entrada com `z.infer`, a biblioteca de validação teria vazado para a camada de aplicação por via de tipo, sem ninguém perceber no diff. Os tipos de entrada dos use cases são escritos à mão porque são o contrato da aplicação, não subproduto da ferramenta.

**O CLI do Prisma está pinado em `7.10.0` e não deve ser atualizado com `@latest`.** Na época da instalação a tag `latest` do CLI apontava para um release candidate do 8 enquanto o `@prisma/client` apontava para o 7 estável, o que deixa os dois em majors diferentes e faz flags do CLI sumirem sem aviso. Vale ignorar o banner de update que aparece no terminal até o 8 sair de RC.
