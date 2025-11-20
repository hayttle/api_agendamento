# API de Agendamento v2 - MVP

Sistema de agendamento completo com API REST e painel administrativo. Este MVP permite validar o fluxo completo: criação de companies → admins → geração de API Keys → consumo da API via API Key (ex.: com n8n).

## 🚀 Tecnologias

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth (painel) + API Key (consumo da API)
- **Hash de API Keys**: Argon2

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- npm ou yarn

## 🔧 Configuração

### 1. Clone o repositório e instale as dependências

```bash
npm install
```

### 2. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations SQL no SQL Editor do Supabase (na ordem):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_fix_rls_policies.sql`
3. Obtenha as credenciais do seu projeto:
   - URL do projeto
   - Anon Key
   - Service Role Key (⚠️ **NUNCA exponha esta chave no frontend**)

#### 2.1. Configuração de Convites por Email

Para que os convites funcionem corretamente, configure no Supabase Dashboard:

1. **Authentication → URL Configuration**:

   - Adicione sua URL de redirecionamento em "Redirect URLs":
     - Para desenvolvimento local: `http://localhost:3000/auth/accept-invite`
     - Para produção/ngrok: `https://seu-dominio.com/auth/accept-invite`
     - Exemplo com ngrok: `https://f92f950e884c.ngrok-free.app/auth/accept-invite`
   - ⚠️ **Importante**: Adicione todas as URLs que você vai usar (localhost, ngrok, produção)

2. **Authentication → Email Templates** (opcional):

   - Personalize o template "Invite user" se desejar
   - O template padrão já funciona, mas você pode customizar a mensagem

3. **Authentication → Providers → Email**:
   - Certifique-se de que "Enable email provider" está ativado
   - Configure SMTP customizado (opcional) se não quiser usar o SMTP padrão do Supabase

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Key Settings (opcional)
API_KEY_PREFIX=sk_
API_KEY_RANDOM_LENGTH=32
```

### 4. Execute a aplicação

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 👤 Criando o primeiro usuário

⚠️ **Importante**: Você precisa criar o primeiro usuário `super_admin` manualmente no Supabase:

1. Acesse o Supabase Dashboard → Authentication → Users
2. Crie um novo usuário manualmente (ou via SQL)
3. Execute este SQL para criar o registro na tabela `users`:

```sql
INSERT INTO users (auth_user_id, role, name, email)
VALUES (
  'UUID_DO_USUARIO_CRIADO_NO_AUTH',
  'super_admin',
  'Seu Nome',
  'seu@email.com'
);
```

## 📚 Estrutura do Projeto

```
api_agendamento_v2/
├── app/
│   ├── (auth)/              # Rotas de autenticação
│   ├── (dashboard)/        # Rotas protegidas
│   │   ├── super-admin/    # Painel Super Admin
│   │   └── admin/          # Painel Company Admin
│   ├── api/v1/             # Endpoints da API REST
│   └── page.tsx             # Página inicial (redireciona)
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── forms/               # Formulários reutilizáveis
│   ├── modals/              # Modais
│   └── layout/              # Componentes de layout
├── lib/
│   ├── supabase/           # Clientes Supabase
│   ├── auth/               # Helpers de autenticação
│   ├── api-key/            # Lógica de API Key
│   ├── logger/             # Sistema de logging
│   └── services/           # Serviços backend
├── supabase/
│   └── migrations/         # Migrations SQL
└── types/                   # TypeScript types
```

## 🔐 Autenticação

### Painel Administrativo

- **Método**: Supabase Auth (JWT)
- **Roles**: `super_admin` ou `admin`
- **Login**: `/login`

### API REST

- **Método**: API Key via header `Authorization: Bearer <API_KEY>`
- **Formato da Key**: `sk_<apiClientId>_<random>`
- **⚠️ IMPORTANTE**: A API **NÃO aceita JWT**. Apenas API Keys são válidas para consumo da API.

## 📡 Endpoints da API

### Base URL

```
http://localhost:3000/api/v1
```

### Autenticação

Todos os endpoints de agendamento requerem o header:

```
Authorization: Bearer <API_KEY>
```

### Endpoints Administrativos (JWT - Painel)

#### Criar Company (Super Admin)

```bash
curl -X POST http://localhost:3000/api/v1/companies \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project>-auth-token=<jwt_token>" \
  -d '{
    "name": "Minha Empresa",
    "slug": "minha-empresa"
  }'
```

#### Criar Usuário Admin (Super Admin)

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project>-auth-token=<jwt_token>" \
  -d '{
    "email": "admin@empresa.com",
    "name": "Admin User",
    "role": "admin",
    "companyId": "uuid-da-company",
    "password": "senha123"
  }'
```

#### Listar API Keys (Admin)

```bash
curl -X GET http://localhost:3000/api/v1/api-keys \
  -H "Cookie: sb-<project>-auth-token=<jwt_token>"
```

#### Gerar API Key (Admin)

```bash
curl -X POST http://localhost:3000/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project>-auth-token=<jwt_token>" \
  -d '{
    "label": "Produção"
  }'
```

**Resposta** (mostra a key completa apenas uma vez):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "sk_abc123_def456...",
    "label": "Produção",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Revogar API Key (Admin)

```bash
curl -X PATCH http://localhost:3000/api/v1/api-keys/<key_id>/revoke \
  -H "Cookie: sb-<project>-auth-token=<jwt_token>"
```

### Endpoints de Agendamento (API Key)

#### Criar Professional

```bash
curl -X POST http://localhost:3000/api/v1/professionals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_abc123_def456..." \
  -d '{
    "name": "Dr. João Silva",
    "email": "joao@example.com",
    "phone": "+5511999999999"
  }'
```

#### Criar Service

```bash
curl -X POST http://localhost:3000/api/v1/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_abc123_def456..." \
  -d '{
    "name": "Consulta Médica",
    "durationMinutes": 30,
    "price": 150.00
  }'
```

#### Criar Availability

```bash
curl -X POST http://localhost:3000/api/v1/availabilities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_abc123_def456..." \
  -d '{
    "professionalId": "uuid-do-professional",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "18:00"
  }'
```

**dayOfWeek**: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

#### Buscar Slots Disponíveis

```bash
curl -X GET "http://localhost:3000/api/v1/professionals/<professional_id>/slots?serviceId=<service_id>&from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer sk_abc123_def456..."
```

#### Criar Booking

```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_abc123_def456..." \
  -d '{
    "professionalId": "uuid-do-professional",
    "serviceId": "uuid-do-service",
    "slotId": "uuid-do-slot",
    "customerName": "Maria Santos",
    "customerEmail": "maria@example.com",
    "customerPhone": "+5511888888888"
  }'
```

## 🔄 Testando com n8n

### Passo 1: Gerar API Key no Painel

1. Faça login como `admin` no painel (`http://localhost:3000`)
2. Acesse `/admin/api-keys`
3. Clique em "Gerar API Key"
4. **Copie a key imediatamente** (ela só será exibida uma vez)

### Passo 2: Configurar n8n

1. Crie um novo workflow no n8n
2. Adicione um nó **HTTP Request**
3. Configure:
   - **Method**: POST
   - **URL**: `http://localhost:3000/api/v1/professionals`
   - **Authentication**: None
   - **Headers**:
     - `Content-Type`: `application/json`
     - `Authorization`: `Bearer <sua-api-key>`
   - **Body** (JSON):
     ```json
     {
       "name": "Dr. João Silva",
       "email": "joao@example.com",
       "phone": "+5511999999999"
     }
     ```

### Passo 3: Testar outros endpoints

Repita o processo para:

- Criar services (`/api/v1/services`)
- Criar availabilities (`/api/v1/availabilities`)
- Buscar slots (`/api/v1/professionals/:id/slots`)
- Criar bookings (`/api/v1/bookings`)

## 🔒 Segurança

- **API Keys**: Armazenadas apenas como hash (Argon2) no banco
- **Service Role Key**: Nunca exposta no frontend
- **RLS**: Row Level Security habilitado no Supabase
- **Validação**: Todos os endpoints validam entrada com Zod
- **Logging**: Todas as requisições são logadas (server-side)

## 📝 Formato da API Key

As API Keys seguem o formato:

```
sk_<apiClientId>_<32_caracteres_aleatórios>
```

Exemplo: `sk_123e4567-e89b-12d3-a456-426614174000_a1b2c3d4e5f6...`

O prefixo `sk_` e o `apiClientId` permitem lookup rápido no banco antes de verificar o hash.

## 🐛 Logs de Depuração

Todos os endpoints logam (server-side):

- Request (método, path, payload)
- Response (status, duration, dados)
- Erros

Os logs são exibidos no console do servidor em formato JSON estruturado.

## 📊 Estrutura do Banco de Dados

Principais tabelas:

- `companies`: Empresas
- `users`: Usuários (vinculados ao Supabase Auth)
- `api_clients`: Clientes de API
- `api_keys`: Chaves de API (hash)
- `professionals`: Profissionais
- `services`: Serviços
- `availabilities`: Disponibilidades
- `slots`: Horários disponíveis
- `bookings`: Agendamentos
- `activity_logs`: Logs de atividades

## 🚨 Troubleshooting

### Erro 401 ao consumir API

- Verifique se está usando o header `Authorization: Bearer <key>`
- Confirme que a API Key não foi revogada
- Verifique se a key está no formato correto

### Erro ao criar usuário

- Certifique-se de que a company existe (para role `admin`)
- A senha deve ter no mínimo 8 caracteres

### Erro ao criar booking

- O slot deve estar disponível (`is_available = true`)
- O slot deve pertencer ao professional e service especificados

## 📄 Licença

Este é um projeto MVP para validação. Use conforme necessário.

## 🤝 Contribuindo

Este é um MVP mínimo. Para melhorias e extensões, considere:

- Adicionar testes automatizados
- Implementar paginação nos endpoints de listagem
- Adicionar filtros e busca
- Implementar webhooks
- Adicionar rate limiting
