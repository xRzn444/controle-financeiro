# Backend - Controle Financeiro

## Setup

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo `.env.example` para `.env` e preencha com os dados do Railway/PostgreSQL e sua chave JWT:

```bash
cp .env.example .env
```

3. Crie as tabelas no PostgreSQL (veja abaixo).

4. Inicie o servidor:

```bash
npm run dev
```

## Endpoints

- `POST /api/register` — Cadastro de usuário
- `POST /api/login` — Login (retorna JWT)
- `GET /api/transactions` — Listar transações (JWT)
- `POST /api/transactions` — Criar transação (JWT)
- `PUT /api/transactions/:id` — Editar transação (JWT)
- `DELETE /api/transactions/:id` — Excluir transação (JWT)

## SQL para criar tabelas

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- income, expense, savings
  name VARCHAR(100) NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

## Observações
- Use o token JWT retornado no login no header `Authorization: Bearer <token>` para acessar as rotas protegidas.
- O backend roda por padrão na porta 4000 (ou a definida em `PORT`). 