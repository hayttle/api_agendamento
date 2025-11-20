Contexto:
Temos uma API de agendamento que será o único motor de agendamento (slots, bookings, profissionais, serviços). Queremos gerar um MVP MÍNIMO que permita validar o fluxo company → admin → gerar API Key → consumir a API via API Key (ex.: com n8n). O SaaS (front para clientes finais) não será feito agora.

Objetivo do prompt:
Gere um projeto completo (scaffold + código) para um MVP da **API de agendamento + Painel Administrativo** conforme abaixo. Entregue arquivos prontos para rodar localmente (Next.js ou Node + React mínimo para painel), README e .env.example. Seja conciso, claro e prático. Produza código TypeScript.

Requisitos funcionais (obrigatórios)

1. Autenticação do painel: usar Supabase Auth (login/email+senha).

   - Após login identificar role do usuário: `super_admin` ou `admin` (cada usuário criado é associado a uma company).
   - Redirecionar para telas adequadas conforme role.

2. Super Admin Panel (UI mínima)

   - Tela para criar Company (nome + slug).
   - Tela para criar usuário admin atrelado à Company (email + nome + role=admin) — pode criar usuário no Supabase (server-side).
   - Listagem simples de companies e seus admins.
   - **O super_admin NÃO pode gerar API Keys**.

3. Company Admin Panel (UI mínima)

   - Tela de login via Supabase (mesma aplicação).
   - Página "API Keys": listar chaves existentes (apenas label/id, criado_em, revoked flag). Nunca mostrar o valor completo novamente.
   - Botão "Gerar API Key" para criar uma nova chave para a company (gera `sk_...`, mostra valor **apenas 1 vez** na resposta).
   - Botão "Revogar" para revogar uma key (marca `revoked=true`).
   - Observação: O painel **NÃO precisa** incluir CRUD de profissionais/serviços — estes serão testados via n8n usando a API Key.

4. Autenticação da API (consumo)

   - **Todas** as requisições para os endpoints de agendamento (profissionais, serviços, availabilities, slots, bookings) devem autenticar **apenas** via header:
     `Authorization: Bearer <API_KEY>`
   - Não suportar JWT para consumo da API. (JWT apenas para painel de login.)
   - API valida API*KEY consultando hash no banco (use argon2/bcrypt). Recomenda-se formato do token com prefixo para lookup, ex: `sk*<apiClientId>\_<random>`. Se implementar prefix, explique o formato no README.

5. Endpoints mínimos a implementar (REST, v1)

   - POST `/v1/companies` — (acesso: super_admin panel) criar company
   - POST `/v1/users` — (acesso: super_admin panel) criar usuário admin (associar a company)
   - POST `/v1/api-clients` — criar api_client para company (server-side, created when admin generates key)
   - POST `/v1/api-keys` — gera API Key (acesso: admin da company via painel). Retorna o valor completo **uma vez**.
   - PATCH `/v1/api-keys/:id/revoke` — revoga key (acesso: admin)
   - GET `/v1/api-keys` — listar keys da company (acesso: admin)
   - POST `/v1/professionals` — cria professional (autenticação por API Key)
   - POST `/v1/services` — cria service (autenticação por API Key)
   - POST `/v1/availabilities` — cria availability (autenticação por API Key)
   - GET `/v1/professionals/:id/slots?serviceId=&from=&to=` — retorna slots disponíveis (autenticação por API Key)
   - POST `/v1/bookings` — cria booking (deve usar RPC create_booking_safely no DB ou lógica atômica) (autenticação por API Key)

6. Regras de autorização

   - Apenas admin da company pode acessar endpoints do painel relacionados a API Keys.
   - API Keys só podem atuar sobre dados da company à qual pertencem.
   - Super_admin pode criar companies e users, listar companies, mas não pode criar API Keys em nome das empresas.

7. Painel: UX/Fluxo importantes

   - Ao gerar api_key: mostrar modal com **api_key completa** + botão copiar. Aviso "este valor será exibido apenas uma vez".
   - Na listagem de keys: exibir label, id, created_at, revoked flag, e uma versão mascarada do valor (ex.: `sk_abcde****...`) — sem possibilidade de ver o valor novamente.
   - Revogação: confirmação modal "Deseja revogar esta key?".

8. Segurança e práticas

   - Armazenar apenas hash das chaves no DB.
   - Expor apenas `.env.example` e README com instruções sobre `SUPABASE_SERVICE_ROLE_KEY` e variáveis sensíveis que devem ficar no server.
   - Implementar logging básico (activity_logs) para criação/revogação de keys e criação de bookings.

9. Testes e validação com n8n

   - Documente no README exemplos curl e um passo-a-passo para testes no n8n:
     - Gerar api_key no painel
     - Usar HTTP Request node com header `Authorization: Bearer <api_key>` para criar professional, service, availability
     - Consultar slots e criar booking
   - Inclua scripts de seed (opcional) para criar um super_admin inicial e facilitar login.

10. Entregáveis esperados (arquivos que o Cursor deve gerar)
    - Backend (TypeScript) com rotas e middleware de autenticação por API Key
    - Frontend simples (Next.js / React) com telas de login, super_admin panel e company admin panel (API Keys)
    - README.md com instruções de setup local, variáveis de ambiente e passo-a-passo de teste com n8n e curl
    - .env.example
    - Testes básicos (smoke) mostrando: geração de key (via painel) → uso da key para criar professional via curl
    - Activity logs básicos persistidos no DB (ou endpoint para consultar)

Restrições e notas

- Mantenha o MVP o mais enxuto possível: se alguma UI (ex.: CRUD de profissionais) reduzir o tempo de entrega, substitua por instruções no README para usar n8n nesse primeiro momento.
- Todos os endpoints de agendamento devem recusar requisições sem API Key válida com HTTP 401/403.
- Documente claramente no README que a API aceita somente API Key e que JWT não serve para consumo da API.

Prioridade

1. Autenticação do painel (Supabase) + rota para super_admin criar company e user admin
2. Fluxo geração/mostra API Key (apenas 1 vez) e armazenamento seguro (hash)
3. Middleware de autenticação por API Key e endpoints de agendamento (profissionais, services, availabilities, slots, bookings)
4. README com passo-a-passo de testes via n8n
5. Smoke tests e scripts de seed

Entregue já: tree de arquivos gerados + principais arquivos de código (backend routes, frontend pages para login / super_admin / admin API Keys), README e .env.example.

Fim do prompt.
