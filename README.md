# 🖥️ Monitor de Equipamentos

Sistema de monitoramento de equipamentos em **tempo real**, com dashboard reativo, controle de acesso por papéis (RBAC), abertura automática de chamados com SLA, relatórios de disponibilidade e integração com dispositivos via **MQTT**.

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss" />
  <img alt="MQTT" src="https://img.shields.io/badge/MQTT-Bridge-orange?logo=mqtt" />
</p>

---

## 📋 Sobre o projeto

O **Monitor de Equipamentos** permite acompanhar o status de equipamentos (online, offline, atenção) em um dashboard atualizado em tempo real. Quando um equipamento fica offline, um **chamado é aberto automaticamente** com SLA de 48 horas. Operadores podem abrir chamados manuais, e administradores gerenciam o ciclo completo de atendimento.

Os dados podem ser atualizados manualmente pela interface ou **automaticamente por dispositivos IoT** através de um broker MQTT.

---

## ✨ Funcionalidades

### 📊 Dashboard em tempo real
- Cards coloridos por status (🟢 online, 🟡 atenção, 🔴 offline)
- Atualização instantânea via **Supabase Realtime** (entre abas e via MQTT)
- Contadores clicáveis que filtram por status
- Notificações **toast** quando um equipamento muda de status

### 🔐 Autenticação e RBAC
- Login com Supabase Auth
- Dois papéis: **Admin** (controle total) e **Operador** (somente leitura + abertura de chamados)
- Rotas protegidas por middleware/proxy
- Permissões garantidas no banco via **Row Level Security (RLS)**

### 🛠️ Gestão de equipamentos (Admin)
- Cadastro, edição e exclusão de equipamentos
- Campo `mqtt_id` para vincular dispositivos IoT
- Histórico de todas as mudanças de status

### 🎫 Chamados com SLA
- **Abertura automática** quando um equipamento fica offline
- Abertura manual por operadores
- SLA de **48 horas** com indicador de atraso
- Fluxo: `aberto` → `andamento` → `fechado`
- Admin informa verificação em campo e previsão de resolução
- Ordenação por proximidade do fim do SLA
- Chamados fechados ficam ocultos por padrão

### 📈 Relatórios
- Histórico completo de mudanças de status
- Relatório de disponibilidade por equipamento (% online, tempo em cada status)

### 👤 Gestão de usuários (Admin)
- Criar usuários, definir papéis, redefinir senhas e excluir

### 📡 Integração MQTT
- Bridge que recebe mensagens de dispositivos e atualiza o banco
- Abertura automática de chamados quando um dispositivo fica offline

---

## 🏗️ Arquitetura

```
┌──────────────┐    MQTT     ┌─────────────┐
│  Dispositivo │ ─────────▶ │   Broker    │
│   (sensor)   │  publish   │ (Mosquitto) │
└──────────────┘             └──────┬──────┘
                                    │ subscribe
                                    ▼
┌──────────────┐  realtime  ┌─────────────┐   service_role   ┌────────────┐
│  Dashboard   │ ◀───────── │ mqtt-bridge │ ───────────────▶ │  Supabase  │
│   (Next.js)  │            │  (Node.js)  │     UPDATE       │ (Postgres) │
└──────────────┘            └─────────────┘                  └────────────┘
       ▲                                                          ▲
       └──────────── Supabase Realtime (websocket) ───────────────┘
```

**Fluxo de dados:**
1. Dispositivos publicam status no broker MQTT
2. O `mqtt-bridge` consome as mensagens e atualiza o Supabase
3. Triggers no banco abrem chamados automaticamente e registram histórico
4. O dashboard recebe as mudanças em tempo real via websocket

---

## 🧰 Stack tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | Next.js 16 (App Router) + TypeScript |
| **Estilização** | Tailwind CSS |
| **Banco de dados** | Supabase (PostgreSQL) |
| **Autenticação** | Supabase Auth |
| **Tempo real** | Supabase Realtime |
| **Segurança** | Row Level Security (RLS) |
| **IoT** | MQTT (broker Mosquitto) |
| **Bridge MQTT** | Node.js + `mqtt` + `tsx` |

---

## 📁 Estrutura do projeto

```
monitor-equipamentos/
├── app/
│   ├── layout.tsx                # Layout global + providers
│   ├── page.tsx                  # Dashboard
│   ├── login/                    # Autenticação
│   ├── equipamentos/             # CRUD de equipamentos
│   ├── chamados/                 # Chamados com SLA
│   ├── historico/                # Histórico de status
│   ├── relatorio/                # Relatório de disponibilidade
│   └── usuarios/                 # Gestão de usuários (admin)
├── components/
│   ├── Navbar.tsx
│   ├── EquipamentoCard.tsx
│   ├── StatusModal.tsx
│   ├── EquipamentoFormModal.tsx
│   ├── ChamadoCard.tsx
│   ├── ChamadoModal.tsx
│   ├── ChamadoFormModal.tsx
│   └── Toasts.tsx
├── context/
│   ├── AuthContext.tsx           # Estado de autenticação + papel
│   └── ToastContext.tsx          # Notificações
├── hooks/
│   ├── useEquipamentos.ts        # Realtime de equipamentos
│   └── useChamados.ts            # Realtime de chamados
├── lib/
│   ├── supabase/                 # Clients (browser, server, admin)
│   ├── status.ts                 # Config de status de equipamentos
│   ├── chamado.ts                # Lógica de SLA
│   └── utils.ts
├── types/
│   ├── equipamento.ts
│   ├── chamado.ts
│   ├── profile.ts
│   └── statusLog.ts
├── proxy.ts                      # Proteção de rotas (Next.js 16)
└── .env.local                    # Variáveis (não versionado)
```

---

## 🚀 Como executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- Uma conta e projeto no [Supabase](https://supabase.com)
- (Opcional) [Docker](https://docker.com) para o broker MQTT

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/monitor-equipamentos.git
cd monitor-equipamentos
npm install
```

### 2️⃣ Configure o banco no Supabase

No painel do Supabase, abra **SQL Editor** e execute o script completo da seção [🗄️ Schema do banco](#️-schema-do-banco-completo) abaixo.

### 3️⃣ Configure as variáveis de ambiente

Copie o template e preencha:

```bash
cp .env.example .env.local
```

| Variável | Descrição | Onde encontrar |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto | Supabase → Settings → API → *Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública | Supabase → Settings → API → *anon public* |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave administrativa (uso interno) | Supabase → Settings → API → *service_role* |

> ⚠️ A `service_role` **bypassa o RLS** e nunca deve ser exposta ao navegador ou versionada.

### 4️⃣ Crie seu usuário admin

1. No Supabase: **Authentication → Users → Add user** (marque *Auto Confirm User*)
2. Promova a admin no SQL Editor:

```sql
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where email = 'seu_email@exemplo.com'
on conflict (id) do update set role = 'admin';
```

### 5️⃣ Execute o projeto

```bash
npm run dev
```

Acesse **http://localhost:3000** e faça login.

---

## 🗄️ Schema do banco (completo)

Execute no **SQL Editor** do Supabase:

```sql
-- ══════════════════════════════════════════
-- EQUIPAMENTOS
-- ══════════════════════════════════════════
create table if not exists public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  localizacao text not null,
  status text not null default 'offline'
    check (status in ('online', 'offline', 'atencao')),
  mqtt_id text unique,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_equipamentos_mqtt_id on public.equipamentos (mqtt_id);

create or replace function public.set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end; $$;

drop trigger if exists trg_equipamentos_atualizado_em on public.equipamentos;
create trigger trg_equipamentos_atualizado_em
  before update on public.equipamentos
  for each row execute function public.set_atualizado_em();

-- ══════════════════════════════════════════
-- PERFIS (papéis)
-- ══════════════════════════════════════════
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'operador' check (role in ('admin', 'operador')),
  criado_em timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'operador');
  return new;
end; $$;

alter function public.handle_new_user() owner to postgres;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql
security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ══════════════════════════════════════════
-- HISTÓRICO DE STATUS
-- ══════════════════════════════════════════
create table if not exists public.status_logs (
  id bigint generated always as identity primary key,
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  equipamento_nome text not null,
  status_anterior text,
  status_novo text not null,
  alterado_por uuid references auth.users(id) on delete set null,
  alterado_por_email text not null default 'sistema',
  criado_em timestamptz not null default now()
);

create or replace function public.registrar_mudanca_status()
returns trigger language plpgsql
security definer set search_path = public as $$
declare v_email text;
begin
  if old.status is distinct from new.status then
    select email into v_email from auth.users where id = auth.uid();
    insert into public.status_logs
      (equipamento_id, equipamento_nome, status_anterior, status_novo, alterado_por, alterado_por_email)
    values
      (new.id, new.nome, old.status, new.status, auth.uid(), coalesce(v_email, 'sistema'));
  end if;
  return new;
end; $$;

drop trigger if exists trg_registrar_mudanca_status on public.equipamentos;
create trigger trg_registrar_mudanca_status
  after update on public.equipamentos
  for each row execute function public.registrar_mudanca_status();

-- ══════════════════════════════════════════
-- CHAMADOS (com SLA)
-- ══════════════════════════════════════════
create table if not exists public.chamados (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  equipamento_nome text not null,
  titulo text not null,
  descricao text,
  status text not null default 'aberto' check (status in ('aberto', 'andamento', 'fechado')),
  origem text not null default 'manual' check (origem in ('manual', 'automatico')),
  sla_horas integer not null default 48,
  aberto_em timestamptz not null default now(),
  prazo_sla timestamptz not null default (now() + interval '48 hours'),
  previsao_resolucao timestamptz,
  verificado_em_campo text,
  aberto_por uuid references auth.users(id) on delete set null,
  aberto_por_email text,
  fechado_em timestamptz,
  fechado_por uuid references auth.users(id) on delete set null,
  fechado_por_email text,
  atualizado_em timestamptz not null default now()
);

drop trigger if exists trg_chamados_atualizado_em on public.chamados;
create trigger trg_chamados_atualizado_em
  before update on public.chamados
  for each row execute function public.set_atualizado_em();

-- Abertura automática de chamado quando equipamento fica offline
create or replace function public.abrir_chamado_offline()
returns trigger language plpgsql
security definer set search_path = public as $$
declare v_email text;
begin
  if old.status is distinct from new.status and new.status = 'offline' then
    if not exists (
      select 1 from public.chamados
      where equipamento_id = new.id and status in ('aberto', 'andamento')
    ) then
      select email into v_email from auth.users where id = auth.uid();
      insert into public.chamados
        (equipamento_id, equipamento_nome, titulo, descricao, status, origem, aberto_por, aberto_por_email)
      values
        (new.id, new.nome, 'Equipamento offline',
         'Chamado aberto automaticamente: o equipamento ficou offline.',
         'aberto', 'automatico', auth.uid(), coalesce(v_email, 'sistema'));
    end if;
  end if;
  return new;
end; $$;

alter function public.abrir_chamado_offline() owner to postgres;

drop trigger if exists trg_abrir_chamado_offline on public.equipamentos;
create trigger trg_abrir_chamado_offline
  after update on public.equipamentos
  for each row execute function public.abrir_chamado_offline();

-- ══════════════════════════════════════════
-- REALTIME
-- ══════════════════════════════════════════
do $$
begin
  alter publication supabase_realtime add table public.equipamentos;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.status_logs;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.chamados;
exception when duplicate_object then null;
end $$;

-- Essencial para o realtime propagar UPDATE/DELETE entre clientes
alter table public.equipamentos replica identity full;
alter table public.chamados    replica identity full;
alter table public.status_logs replica identity full;

-- ══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════
alter table public.equipamentos enable row level security;
alter table public.profiles     enable row level security;
alter table public.status_logs  enable row level security;
alter table public.chamados     enable row level security;

-- Equipamentos: leitura p/ autenticados, escrita p/ admin
create policy "select_autenticado" on public.equipamentos
  for select to authenticated using (true);
create policy "insert_admin" on public.equipamentos
  for insert to authenticated with check (public.is_admin());
create policy "update_admin" on public.equipamentos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "delete_admin" on public.equipamentos
  for delete to authenticated using (public.is_admin());

-- Profiles: ver o próprio, admin gerencia
create policy "ver_proprio_perfil" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "admin_gerencia_perfis" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "insert_pelo_trigger" on public.profiles
  for insert to public with check (true);

-- Histórico: leitura p/ autenticados (escrita só via trigger)
create policy "select_logs_autenticado" on public.status_logs
  for select to authenticated using (true);

-- Chamados: leitura p/ autenticados, insert sempre "aberto", update/delete p/ admin
create policy "select_chamados" on public.chamados
  for select to authenticated using (true);
create policy "insert_chamados" on public.chamados
  for insert to authenticated with check (status = 'aberto');
create policy "update_chamados" on public.chamados
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "delete_chamados" on public.chamados
  for delete to authenticated using (public.is_admin());

-- ══════════════════════════════════════════
-- DADOS DE EXEMPLO (opcional)
-- ══════════════════════════════════════════
insert into public.equipamentos (nome, localizacao, status, mqtt_id) values
  ('Servidor Principal',  'Sala de TI · Rack 01',  'online',  'servidor-01'),
  ('Nobreak Entrada',     'Sala de TI',            'online',  'nobreak-01'),
  ('Impressora HP 4055',  'Escritório · 2º andar', 'offline', 'impressora-01'),
  ('Câmera Portaria',     'Portaria',              'online',  'camera-01'),
  ('Ar-condicionado CPD', 'Sala de TI',            'atencao', 'ar-01');
```

---

## 📡 Integração MQTT

O projeto se integra ao [`mqtt-bridge`](https://github.com/SEU_USUARIO/mqtt-bridge), um serviço Node.js que consome mensagens do broker e atualiza o Supabase.

### Protocolo

| Item | Valor |
|---|---|
| **Tópico** | `equipamentos/{mqtt_id}/status` |
| **Payload** | `{"status": "online" \| "offline" \| "atencao"}` |
| **QoS** | 1 |

### Broker local (Mosquitto via Docker)

```bash
docker run -d --name mosquitto -p 1883:1883 \
  eclipse-mosquitto:2 mosquitto -c /mosquitto-no-auth.conf
```

### Testando

```bash
# No repositório do mqtt-bridge
npm run simulate servidor-01 offline
```

O equipamento muda de cor no dashboard e um chamado é aberto automaticamente.

---

## 👥 Papéis e permissões

| Ação | Operador | Admin |
|---|:---:|:---:|
| Ver dashboard, histórico e relatórios | ✅ | ✅ |
| Ver chamados | ✅ | ✅ |
| Abrir chamado manual | ✅ | ✅ |
| Alterar status de equipamento | ❌ | ✅ |
| Cadastrar/editar/excluir equipamentos | ❌ | ✅ |
| Editar/iniciar/fechar chamados | ❌ | ✅ |
| Gerenciar usuários | ❌ | ✅ |

> 🔒 As permissões são aplicadas em **duas camadas**: na interface (UX) e no banco (RLS). Mesmo burlando a UI, o banco bloqueia operações não autorizadas.

---

## 🔒 Segurança

- **Row Level Security (RLS)** em todas as tabelas
- **`service_role`** usada apenas no servidor (gestão de usuários e bridge MQTT)
- Verificação de papel **server-side** em todas as ações administrativas
- Proteção de rotas via `proxy.ts` (Next.js 16)
- Histórico de status imutável pela UI (escrita apenas via trigger)
- Variáveis sensíveis fora do versionamento (`.gitignore`)

---

## 📜 Scripts disponíveis

```bash
npm run dev       # Ambiente de desenvolvimento
npm run build     # Build de produção
npm run start     # Servidor de produção
npm run lint      # Análise de código
```

---

## 🗺️ Roadmap

- [ ] Testes automatizados (Vitest + Playwright)
- [ ] Notificações push / e-mail para chamados críticos
- [ ] Gráficos de disponibilidade por período
- [ ] Suporte a múltiplos ambientes/sites
- [ ] Autenticação em duas etapas (2FA)
- [ ] Exportação de relatórios (CSV/PDF)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um **fork** do projeto
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um **Pull Request**

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Desenvolvido com ❤️ usando Next.js + Supabase
</p>