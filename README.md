# Barbearia

Sistema de agendamento para barbearia: cliente agenda sem pagamento e o administrador acompanha o serviço no painel `/admin`.

## Stack

- Frontend: React, Vite, TypeScript e Tailwind CSS
- Backend: Next.js com Bun
- Dados: PostgreSQL e Redis
- Infraestrutura: Docker Compose

## Começar localmente

1. Gere o hash administrativo, sem colocar a senha em arquivos versionados:

   ```bash
   bun --cwd backend scripts/generate-password-hash.ts 'sua-senha'
   ```

2. Copie `.env.example` para `.env` e preencha `ADMIN_PASSWORD_HASH` com o resultado.
   Defina também `ADMIN_SESSION_SECRET`, `POSTGRES_PASSWORD` e `DATABASE_URL`; nenhum deles deve ser versionado.
3. Suba os serviços:

   ```bash
   docker compose up -d --build
   ```

O site abre em `http://localhost:5173`; a API em `http://localhost:3000`.

O relógio e o status de funcionamento usam sempre o fuso `America/Sao_Paulo`.

## Migração de segurança

Em instalações já existentes, execute `database/V2__security_hardening.sql` uma vez no PostgreSQL antes de publicar esta versão. A migração invalida o cancelamento de agendamentos já criados, pois o sistema anterior não armazenava um token de posse seguro.
