## Decisões tomadas durante o desenvolvimento
Separando app.ts e server.ts pois quando tivermos testes E2E com vitest o teste vai importar o app direto e disparar uma request sem precisar abrir porta, se o listen estiver junto do app.ts todo teste vai subir um servidor de verdade, e com isso os testes vão brigar pela mesma porta. Decisão tomada no início para poupar futura refatoração.

