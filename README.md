# 🌟 Agenda Fácil — Salão de Beleza & Estética

> **Disciplina:** Programação para Internet — 2º Bimestre
> **Instituição:** Multivix (2026)
> **Stack:** HTML5 Semântico · CSS Variables · Vanilla JavaScript ES6+ · Node.js · Express · Microsoft SQL Server (`mssql`)

---

## 📋 Sumário

1. [Visão Geral](#-visão-geral)
2. [Estrutura do Repositório](#-estrutura-do-repositório)
3. [Pré-requisitos](#-pré-requisitos)
4. [Configuração do Banco de Dados (SQL Server)](#-configuração-do-banco-de-dados-sql-server)
5. [Configuração do Ambiente (`.env`)](#-configuração-do-ambiente-env)
6. [Executando o Projeto](#-executando-o-projeto)
   - [Modo 1 — Completo (Node.js + SQL Server)](#modo-1--completo-nodejs--sql-server)
   - [Modo 2 — Node.js com Fallback em Memória](#modo-2--nodejs-com-fallback-em-memória-sem-sql-server)
   - [Modo 3 — Live Server 100% Offline](#modo-3--live-server-100-offline-no-vs-code)
7. [Endpoints da API REST](#-endpoints-da-api-rest)
8. [Funcionalidades & Regras de Negócio](#-funcionalidades--regras-de-negócio)

---

## 💡 Visão Geral

O **Agenda Fácil** é uma solução completa de agendamentos e gestão para salões de beleza e clínicas de estética. A aplicação conta com:

- **Interface Visual Moderna (UI/UX):** Paleta sofisticada em tons de violeta, púrpura, rose gold e teal, modo claro/escuro persistente via CSS Variables, microinterações, cards interativos e sistema de feedback flutuante (Toast de 3 segundos).
- **Frontend ES6+ Reativo:** Manipulação fluida do DOM com tratamento de 3 estados assíncronos: *Loading Skeleton*, *Sucesso* (10 serviços) e *Erro* com botão de retentativa.
- **CRUD Completo:** Criação, Listagem, Atualização via Modal com backdrop blur e Exclusão com confirmação dinâmica.
- **Painel de Métricas em Tempo Real:** Total de agendamentos visíveis, faturamento estimado, serviço mais procurado e proporção de confirmados/pendentes.
- **Resiliência e Fallback Transparente:** Opera com SQL Server nativo, com Node.js em contingência (memória), ou 100% no cliente via `localStorage` + `data/servicos.json`.

---

## 📁 Estrutura do Repositório

```
/
├── public/
│   ├── index.html              # Interface HTML5 semântica e acessível
│   ├── style.css               # Design moderno, responsivo com CSS Variables
│   ├── script.js               # Lógica DOM, Fetch assíncrono e CRUD
│   └── data/
│       └── servicos.json       # 10 serviços para fallback offline
├── server/
│   ├── server.js               # API REST em Node.js (Express)
│   ├── config/
│   │   └── db.js               # Conexão com Microsoft SQL Server (mssql)
│   ├── database/
│   │   └── schema.sql          # Script de criação de tabelas e dados iniciais
│   └── routes/
│       ├── servicos.js         # Endpoints de Serviços
│       └── agendamentos.js     # Endpoints de Agendamentos (CRUD)
├── index.html                  # Redirect shim → public/index.html
├── .env.example                # Template de variáveis de ambiente
├── package.json
└── README.md
```

---

## 🔧 Pré-requisitos

| Ferramenta | Versão Recomendada |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Microsoft SQL Server | 2019 / 2022 (Express ou superior) |
| SQL Server Management Studio (SSMS) | Qualquer versão atual |

---

## 🗄️ Configuração do Banco de Dados (SQL Server)

1. Abra o **SQL Server Management Studio (SSMS)**.
2. Conecte-se à sua instância local.
3. Abra o arquivo `server/database/schema.sql`.
4. Execute o script completo (**F5**).

O script irá:
- Criar o banco `AgendaFacilDB`
- Criar as tabelas `Servicos` e `Agendamentos`
- Inserir os 10 serviços iniciais

> **Atenção:** Certifique-se de que a **autenticação mista (SQL Server + Windows)** está habilitada e que o login `sa` está ativo — ou crie um login SQL Server dedicado e atualize o `.env`.

---

## ⚙️ Configuração do Ambiente (`.env`)

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Conteúdo do `.env`:

```env
DB_SERVER=127.0.0.1
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=SuaSenhaAqui
DB_DATABASE=AgendaFacilDB
PORT=3000
```

> **Dica:** Se o seu SQL Server usa uma porta dinâmica (instância nomeada), verifique a porta real no **SQL Server Configuration Manager** → *SQL Server Network Configuration* → *TCP/IP* → aba *IP Addresses* → campo `TCP Dynamic Ports`.

---

## ▶️ Executando o Projeto

### Modo 1 — Completo (Node.js + SQL Server)

```bash
# 1. Instale as dependências
npm install

# 2. Configure o .env com suas credenciais

# 3. Execute o schema.sql no SSMS

# 4. Inicie o servidor
npm start

# 5. Acesse no navegador
# http://localhost:3000
```

### Modo 2 — Node.js com Fallback em Memória (sem SQL Server)

Se o SQL Server não estiver acessível, o servidor **detecta automaticamente** a falha e opera em modo de memória volátil (os dados são perdidos ao reiniciar o servidor).

```bash
npm install
npm start
# Acesse: http://localhost:3000
```

### Modo 3 — Live Server 100% Offline (no VS Code)

Sem Node.js ou SQL Server. Abra a pasta `public/` no VS Code e inicie o **Live Server** apontando para `public/index.html`. Os serviços são carregados de `data/servicos.json` e os agendamentos persistem no `localStorage`.

---

## 🌐 Endpoints da API REST

Base URL: `http://localhost:3000/api`

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/servicos` | Lista todos os serviços |
| `GET` | `/api/servicos/:id` | Retorna um serviço pelo ID |
| `GET` | `/api/agendamentos` | Lista todos os agendamentos |
| `POST` | `/api/agendamentos` | Cria um novo agendamento |
| `PUT` | `/api/agendamentos/:id` | Atualiza um agendamento existente |
| `DELETE` | `/api/agendamentos/:id` | Remove um agendamento |

**Exemplo de corpo para `POST /api/agendamentos`:**

```json
{
  "cliente_nome": "Ana Clara",
  "cliente_telefone": "(27) 99999-0000",
  "servico_id": 1,
  "data_agendamento": "2026-11-10",
  "horario_agendamento": "10:00",
  "observacoes": "Preferência por produtos veganos",
  "status": "pendente"
}
```

---

## ✅ Funcionalidades & Regras de Negócio

### CRUD de Agendamentos
- **Criar** via formulário com validação completa e feedback visual (Toast).
- **Listar** em tabela com badges de status (Pendente / Confirmado / Cancelado).
- **Editar** via modal com backdrop blur e dados pré-preenchidos.
- **Excluir** com confirmação dinâmica inline.

### Validações do Formulário
1. **Conflito de Horário:** Impede dois agendamentos no mesmo dia e horário.
2. **Antecedência Mínima & Horário Comercial:** Rejeita datas passadas ou com menos de 1 hora de antecedência. Horário permitido: 08:00–18:00.
3. **Duração do Serviço:** Verifica se o bloco de tempo necessário (baseado na duração do serviço escolhido) está completamente livre.

### Filtros & Métricas
- Busca em tempo real por nome do cliente ou nome do serviço.
- Ordenação por data (crescente/decrescente) ou por valor do serviço.
- Painel de métricas calculado dinamicamente:
  - Total de agendamentos visíveis
  - Faturamento total estimado (R\$)
  - Serviço mais procurado
  - Proporção Confirmados / Pendentes

### Catálogo de Serviços
- 10 serviços organizados em categorias: Cabelo, Unhas e Estética.
- Filtro por categoria com contagem dinâmica.
- Clique no card seleciona o serviço automaticamente no formulário de agendamento.
