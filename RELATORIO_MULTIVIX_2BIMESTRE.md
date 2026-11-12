# CENTRO UNIVERSITÁRIO MULTIVIX
## CURSO DE ANÁLISE E DESENVOLVIMENTO DE SISTEMAS / SISTEMAS DE INFORMAÇÃO
### DISCIPLINA: PROGRAMAÇÃO PARA INTERNET — 2º BIMESTRE / 2026

---

\
\
\
\
\

# RELATÓRIO TÉCNICO E DE EVIDÊNCIAS DE EXECUÇÃO
## AGENDA FÁCIL: EVOLUÇÃO FUNCIONAL DE UMA APLICAÇÃO WEB COM MANIPULAÇÃO DO DOM, ASSINCRONIA E PERSISTÊNCIA INTEGRADA

\
\
\
\
\

**Autor:** Henrique Galimberti  
*(Espaço para demais integrantes do grupo, até 5 estudantes)*  

**Professor Orientador:** Me. Elionai Magalhães  

\
\
\
\
\

**Vitória – ES**  
**2026**

---

\newpage

## FOLHA DE ROSTO

\
\
\

**Henrique Galimberti**  
*(Demais integrantes do grupo)*

\
\
\

# AGENDA FÁCIL: EVOLUÇÃO FUNCIONAL DE UMA APLICAÇÃO WEB COM MANIPULAÇÃO DO DOM, ASSINCRONIA E PERSISTÊNCIA INTEGRADA

\
\
\
\

> **Natureza do Trabalho:** Relatório acadêmico e técnico apresentado como requisito avaliativo parcial referente ao 2º Bimestre da disciplina de **Programação para Internet**, ministrada pelo **Prof. Me. Elionai Magalhães**, no Centro Universitário Multivix — Campus Vitória.
>
> **Valor da Avaliação:** 10,0 pontos (100% da nota bimestral).  
> **Repositório do Projeto no GitHub:**  
> [https://github.com/HenriqueGalimberti1/simple-beauty-salon](https://github.com/HenriqueGalimberti1/simple-beauty-salon)  
> **Branch da Versão Integrada:**  
> `https://github.com/HenriqueGalimberti1/simple-beauty-salon/tree/feature-api-db-integrated`

\
\
\
\

**Vitória – ES**  
**2026**

---

\newpage

## SUMÁRIO

1. [INTRODUÇÃO](#1-introdução)  
2. [DESCRIÇÃO DO PROJETO E ARQUITETURA](#2-descrição-do-projeto-e-arquitetura)  
   2.1. Visão Geral da Solução  
   2.2. Estrutura de Arquivos e Diretórios  
   2.3. Arquitetura em Três Camadas e Modo Fallback (Resiliência Operacional)  
3. [FUNCIONALIDADES IMPLEMENTADAS E CONFORMIDADE COM O EDITAL](#3-funcionalidades-implementadas-e-conformidade-com-o-edital)  
   3.1. Base Existente: HTML5 Semântico, Acessibilidade e Responsividade  
   3.2. Validações Aprimoradas e Regras de Negócio em JavaScript  
   3.3. Gerenciamento Completo de Registros (CRUD no DOM)  
   3.4. Consulta Dinâmica, Filtros e Resumos Calculados em Tempo Real  
   3.5. Assincronia com Fetch API e Tratamento dos Três Estados  
   3.6. Camada de Back-end e Banco de Dados Relacional (Microsoft SQL Server)  
4. [PLANO DE TESTES E EVIDÊNCIAS DE EXECUÇÃO](#4-plano-de-testes-e-evidências-de-execução)  
   4.1. Matriz de Casos de Teste (8 Casos Exigidos + 2 Casos Extras)  
   4.2. Detalhamento e Evidências dos Casos de Teste  
5. [GUIA DE INSTALAÇÃO E EXECUÇÃO](#5-guia-de-instalação-e-execução)  
   5.1. Execução Simples via Live Server (100% Offline / Standalone)  
   5.2. Execução Completa com API Node.js e Microsoft SQL Server  
6. [DECLARAÇÃO DE TECNOLOGIAS, BIBLIOTECAS E USO DE IA](#6-declaração-de-tecnologias-bibliotecas-e-uso-de-ia)  
7. [CONCLUSÃO](#7-conclusão)  
8. [REFERÊNCIAS BIBLIOGRÁFICAS](#8-referências-bibliográficas)  

---

\newpage

## 1. INTRODUÇÃO

O presente relatório tem por objetivo documentar a evolução funcional da aplicação web **Agenda Fácil**, desenvolvida como projeto semestral da disciplina de **Programação para Internet** no Centro Universitário Multivix.

No 1º bimestre acadêmico, o escopo concentrou-se na criação da estrutura estrutural (HTML5 semântico) e estilização visual responsiva (CSS3). Para esta segunda etapa de avaliação integradora (2º bimestre / 2026), o foco migrou expressamente para a **lógica computacional no cliente**, **manipulação dinâmica da árvore DOM**, **comunicação de rede assíncrona com tratamento de estados** e **validação rigorosa de regras de negócio**.

Além de cumprir rigorosamente todos os requisitos mínimos estipulados no edital — incluindo validações dependentes, CRUD no cliente sem recarregamento de página, busca dinâmica, métricas calculadas e leitura de arquivo JSON local —, a solução foi além e implementou uma arquitetura completa Full-Stack com **API REST em Node.js (Express)** conectada ao banco de dados relacional **Microsoft SQL Server**.

Para assegurar total conformidade com as diretrizes do edital (que estabelece que banco de dados e back-end não são obrigatórios para a avaliação), a aplicação conta com um sofisticado mecanismo de **Fallback Transparente**: se executada isoladamente via *Live Server* ou se o banco SQL Server estiver inacessível, o front-end detecta a condição e continua operando perfeitamente através de `localStorage` e do arquivo `servicos.json`.

O código-fonte integral encontra-se hospedado publicamente no GitHub:
- **Repositório Oficial:** [https://github.com/HenriqueGalimberti1/simple-beauty-salon](https://github.com/HenriqueGalimberti1/simple-beauty-salon)
- **Branch de Entrega (2º Bimestre):** [https://github.com/HenriqueGalimberti1/simple-beauty-salon/tree/feature-api-db-integrated](https://github.com/HenriqueGalimberti1/simple-beauty-salon/tree/feature-api-db-integrated)

---

## 2. DESCRIÇÃO DO PROJETO E ARQUITETURA

### 2.1. Visão Geral da Solução
O **Agenda Fácil** é uma plataforma web voltada para a gestão e agendamento de clientes em salões de beleza, barbearias e clínicas de estética. O sistema permite ao cliente:
1. Navegar por um catálogo especializado de serviços categorizados (Cabelo, Unhas e Estética);
2. Consultar detalhes como preço, tempo estimado de atendimento e descrição de procedimentos;
3. Efetuar agendamentos online com escolha de data e grade horária inteligente;
4. Acompanhar, editar e cancelar compromissos em um painel interativo em tempo real, acompanhado de métricas automáticas de faturamento e serviços mais procurados.

### 2.2. Estrutura de Arquivos e Diretórios
O projeto foi estruturado seguindo as melhores práticas de organização de software, separando a camada pública de cliente dos componentes de servidor:

```text
/
├── public/                     # Camada Client-Side (Front-end)
│   ├── index.html              # Interface HTML5 semântica e acessível
│   ├── style.css               # Design moderno, responsivo com CSS Variables
│   ├── script.js               # Lógica ES6+, Fetch assíncrono, CRUD e DOM
│   └── data/
│       └── servicos.json       # Base com 10 serviços para fallback offline
├── server/                     # Camada Server-Side (Back-end)
│   ├── server.js               # Servidor Web e API REST (Express)
│   ├── config/
│   │   └── db.js               # Pool de conexão Microsoft SQL Server (mssql)
│   ├── database/
│   │   └── schema.sql          # Script DDL de criação de tabelas e seeds
│   └── routes/
│       ├── servicos.js         # Rotas e controladores de Serviços
│       └── agendamentos.js     # Rotas e controladores de Agendamentos (CRUD)
├── index.html                  # Redirecionador para public/index.html
├── .env.example                # Modelo de configuração de variáveis de ambiente
├── .gitignore                  # Proteção de credenciais (.env) e dependências
├── package.json                # Manifesto de dependências do Node.js
└── README.md                   # Manual de instalação e execução
```

### 2.3. Arquitetura em Três Camadas e Modo Fallback
A aplicação foi projetada para operar em três cenários distintos, garantindo máxima portabilidade:

1. **Modo Integrado (Full-Stack):** O front-end consome a API REST Node.js (`http://localhost:3000/api`), que persiste as transações diretamente nas tabelas `Servicos` e `Agendamentos` do Microsoft SQL Server.
2. **Modo Contingência em Memória (Node.js Sem SQL):** Caso o SQL Server esteja indisponível, a API do Express armazena os agendamentos temporariamente em memória RAM e consome os serviços a partir do arquivo JSON.
3. **Modo Live Server (100% Client-Side):** Caso o usuário execute apenas a pasta `public/` em um servidor estático (como a extensão Live Server do VS Code ou `python -m http.server`), o script em JavaScript intercepta o erro de conexão de rede em até 3,5 segundos, lê o arquivo `data/servicos.json` e armazena os agendamentos no `localStorage` do navegador.

---

## 3. FUNCIONALIDADES IMPLEMENTADAS E CONFORMIDADE COM O EDITAL

A tabela a seguir correlaciona os requisitos estipulados no edital da Avaliação Integradora com a respectiva implementação:

| Requisito do Edital | Status | Implementação Técnica no Projeto |
| :--- | :---: | :--- |
| **Base Existente** (HTML semântico, responsivo) | **100% Atendido** | Tags semânticas (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`), CSS Grid, Flexbox e Mobile First. |
| **Validação Aprimorada** (Mínimo 3 regras em JS) | **100% Atendido** | 1) Duplicidade e conflito de horário com sobreposição;<br>2) Antecedência mínima de 1h e horário comercial;<br>3) Campos dependentes (duração do serviço ditando a grade). |
| **Gerenciamento de Registros** (CRUD no DOM) | **100% Atendido** | Create (formulário), Read (tabela/cards), Update (modal com backdrop blur) e Delete com confirmação dinâmica, sem refresh. |
| **Consulta e Organização** (Busca, ordenação e resumo) | **100% Atendido** | Busca em tempo real por cliente/serviço, filtro de status, 4 tipos de ordenação e 4 cards de métricas em tempo real. |
| **Assincronia** (Fetch, async/await, JSON >= 10 itens) | **100% Atendido** | `fetchServices()` assíncrono carregando 10 serviços do JSON com 3 estados no DOM: Loading Skeleton, Sucesso e Falha com retentativa. |
| **Testes Documentados** (Ao menos 8 casos + celular) | **100% Atendido** | 10 casos de teste integralmente documentados, incluindo telas mobile e navegação por teclado. |
| **Relatório e Compartilhamento** (GitHub e PDF) | **100% Atendido** | Repositório público no GitHub com README detalhado e relatório formatado nas normas ABNT. |

### 3.1. Base Existente: HTML5 Semântico, Acessibilidade e Responsividade
- **Estruturação Semântica:** A página utiliza estritamente elementos como `<header>`, `<nav role="navigation">`, `<main>`, `<section>`, `<article>`, `<dialog>` e `<footer>`. 
- **Acessibilidade:** Formulários com `<label>` explicitamente associados via atributo `for`, tags com `aria-label`, avisos dinâmicos com `role="alert"` e contraste rigoroso de cores em conformidade com as diretrizes WCAG 2.1 AA.
- **Responsividade e CSS Moderno:** Utilização de CSS Custom Properties (`--bg-primary`, `--accent-purple`, `--text-primary`), sistema de cores adaptável com alternância de tema claro/escuro (*Light/Dark Mode*), layout fluido baseado em `display: grid` com `repeat(auto-fit, minmax(...))` e media queries específicas para smartphones (`@media (max-width: 768px)`).

### 3.2. Validações Aprimoradas e Regras de Negócio em JavaScript
O sistema conta com três regras de negócio principais implementadas na função `validateDateAndTimeRules()` e `checkScheduleConflict()` no arquivo `script.js`:

1. **Prevenção de Duplicidade e Conflito de Horário:**  
   Não permite que dois agendamentos colidam no mesmo dia e intervalo de tempo. O cálculo não compara apenas a hora inicial, mas calcula o intervalo:
   $$\text{novoInicio} < \text{existenteFim} \quad \text{e} \quad \text{novoFim} > \text{existenteInicio}$$
   Caso haja sobreposição, o agendamento é recusado com mensagem visual e notificação Toast de alerta.
2. **Antecedência Mínima e Conformidade de Horário Comercial:**  
   - Bloqueia datas passadas (`selectedDate < today`);
   - Bloqueia domingos, exibindo a mensagem: *"O salão não abre aos domingos. Selecione de segunda a sábado"*;
   - Valida o horário de expediente: Segunda a Sexta das 09h às 20h e Sábado das 08h às 18h. Se o término do procedimento ultrapassar o fechamento, o agendamento é rejeitado;
   - Para agendamentos no próprio dia atual, exige no mínimo 1 hora de antecedência em relação ao relógio local do cliente.
3. **Compatibilidade de Campos Dependentes (Grade Dinâmica):**  
   A lista suspensa de horários disponíveis (`#timeSelect`) é construída e recalculada dinamicamente sempre que o usuário altera o serviço ou a data. A duração do serviço (ex.: 35 min, 45 min, 90 min) define o intervalo de tempo necessário, desabilitando automaticamente opções conflitantes.
4. **Validações de Entrada:**  
   - Nome do cliente: mínimo de 3 caracteres alfabéticos;
   - Telefone/WhatsApp: máscara dinâmica `(99) 99999-9999` e verificação de mínimo de 10 dígitos numéricos;
   - Feedback instantâneo: borda vermelha suave nos campos inválidos (`.error`) e mensagens explicativas em elementos `<small class="error-msg">`.

### 3.3. Gerenciamento Completo de Registros (CRUD no DOM)
Toda a gestão de agendamentos ocorre de forma reativa, sem qualquer recarregamento da página (`e.preventDefault()`):
- **Create (Criação):** Formulário submetido via JavaScript, validado, persistido no servidor (ou `localStorage`) e imediatamente injetado na tabela de registros.
- **Read (Listagem):** Tabela estruturada com badges estilizados de status (`Confirmado`, `Pendente`, `Cancelado`), data formatada no padrão brasileiro (`DD/MM/AAAA`) e valor monetário em `R$`.
- **Update (Edição):** Botão "Editar" em cada linha que abre uma janela modal (`#editModal`) com efeito moderno de *backdrop blur*, pré-carregando todos os campos do agendamento para alteração. Ao salvar, revalida as regras de negócio excluindo o próprio registro da checagem de conflito e atualiza o nó do DOM em tempo real.
- **Delete (Exclusão):** Botão "Excluir" que aciona um modal dinâmico de confirmação (`#deleteModal`), removendo o agendamento da árvore DOM e recalculando instantaneamente os resumos financeiros.

### 3.4. Consulta Dinâmica, Filtros e Resumos Calculados em Tempo Real
- **Busca em Tempo Real:** Campo de pesquisa textual com escuta de evento `input` que filtra simultaneamente por nome do cliente ou nome do serviço agendado.
- **Filtro por Status:** Seletor que permite isolar agendamentos "Confirmados", "Pendentes" ou "Cancelados".
- **Ordenação Dinâmica:** Permite classificar a visualização por:
  - Data mais próxima (ordem cronológica crescente);
  - Data mais distante (ordem cronológica decrescente);
  - Maior valor de serviço;
  - Menor valor de serviço.
- **Painel de Métricas em Tempo Real:** Quatro indicadores automáticos calculados através de métodos de array do JavaScript (`filter`, `reduce`, `map`):
  1. *Agendamentos Visíveis:* Contagem de registros filtrados no momento;
  2. *Faturamento Previsto:* Somatório monetário dos agendamentos ativos;
  3. *Serviço Mais Procurado:* Identificação estatística do serviço com maior número de marcações;
  4. *Relação Confirmados / Pendentes:* Indicador proporcional do status dos clientes.

### 3.5. Assincronia com Fetch API e Tratamento dos Três Estados
A recuperação dos serviços disponíveis é realizada pela função assíncrona `fetchServices()` utilizando a sintaxe `async/await`. A interface do usuário trata de forma explícita e visual os três estados de uma requisição de rede:

1. **Estado de Carregamento (Loading):** Elemento `#servicesLoading` exibe *skeleton screens* pulsantes que simulam a estrutura visual dos cards enquanto a resposta trafega na rede;
2. **Estado de Sucesso:** Elemento `#servicesList` recebe dinamicamente a injeção dos 10 cards completos de serviços (com ícone, título, categoria, descrição, tempo e preço em R$), além de popular as opções dos seletores dos formulários;
3. **Estado de Erro de Rede / Falha HTTP:** Caso a rede falhe ou o arquivo esteja inacessível, o container `#servicesError` é exibido com ícone de alerta, descrição técnica da falha e um botão interativo **"Tentar Novamente"** que refaz a chamada assíncrona.

### 3.6. Camada de Back-end e Banco de Dados (Diferencial Técnico)
Foi construído um back-end completo utilizando **Node.js** e o framework **Express**, juntamente com o driver nativo **mssql**. O banco de dados relacional **Microsoft SQL Server** foi estruturado através do script `schema.sql`:
- **Tabela `Servicos`:** Chave primária autoincrementável (`IDENTITY`), nomes e categorias em `NVARCHAR` (suporte pleno a caracteres acentuados da língua portuguesa), preço decimal (`DECIMAL(10,2)`) e duração em minutos;
- **Tabela `Agendamentos`:** Chave primária, chave estrangeira (`FOREIGN KEY`) vinculada à tabela `Servicos`, campos para cliente, telefone, data (`DATE`), horário (`TIME`), observações e status.

---

## 4. PLANO DE TESTES E EVIDÊNCIAS DE EXECUÇÃO

Em atendimento ao item 2 do edital (*"documentar ao menos oito casos, incluindo inclusão, edição, exclusão, filtro, validação aprovada/reprovada, fetch com sucesso e fetch com falha; incluir um teste em tela de celular ou por teclado"*), foram executados e documentados **10 cenários de testes completos**.

### 4.1. Matriz Geral de Casos de Teste

| ID | Cenário de Teste | Requisito do Edital | Procedimento Executado | Resultado Esperado | Resultado Obtido |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **CT-01** | Inclusão de agendamento válido | CRUD - Inclusão | Preenchimento correto de cliente, telefone, serviço, data futura e horário comercial. | Registro inserido na tabela, métricas atualizadas e notificação Toast verde. | **Aprovado** |
| **CT-02** | Edição de agendamento | CRUD - Edição | Clique no botão "Editar", alteração do horário de um registro existente no modal e salvamento. | Linha da tabela atualizada sem reload, modal fechado com backdrop blur e Toast de sucesso. | **Aprovado** |
| **CT-03** | Exclusão de agendamento | CRUD - Exclusão | Clique em "Excluir", confirmação no modal de diálogo. | Linha removida da tabela, métricas recalculadas e feedback exibido. | **Aprovado** |
| **CT-04** | Filtro e busca dinâmica | Consulta/Filtro | Digitação do nome "Mariana" no campo de busca e seleção de filtro "Cabelo". | Tabela exibe somente os registros coincidentes; contador de agendamentos atualizado. | **Aprovado** |
| **CT-05** | Validação aprovada | Validação | Preenchimento do formulário com telefone mascarado e antecedência > 1h. | Inputs com contorno neutro, sem mensagens de erro e agendamento processado. | **Aprovado** |
| **CT-06** | Validação reprovada (Conflito) | Validação | Tentativa de agendamento no mesmo dia e horário de um serviço já marcado. | Bloqueio imediato do envio, Toast de aviso vermelho e aviso de duplicidade de agenda. | **Aprovado** |
| **CT-07** | Fetch com sucesso | Assincronia | Carregamento da página conectada à API ou `data/servicos.json`. | Skeleton desaparece, 10 serviços renderizados no catálogo e select preenchido. | **Aprovado** |
| **CT-08** | Fetch com falha e fallback | Assincronia | Simulação de desligamento da API Node.js/SQL Server. | Fallback ativado com sucesso lendo o JSON local e persistindo no `localStorage`. | **Aprovado** |
| **CT-09** | Responsividade Mobile | Celular | Abertura da interface em viewport reduzida (375px - iPhone / Android). | Layout adapta-se fluidamente em coluna única, navegação acessível e tabelas com rolagem horizontal. | **Aprovado** |
| **CT-10** | Acessibilidade por Teclado | Teclado | Navegação completa utilizando apenas as teclas `Tab`, `Shift+Tab`, `Enter`, `Espaço` e `Esc`. | Foco visual evidente com anel suave, abertura e fechamento de modais via `Esc`. | **Aprovado** |

---

### 4.2. Detalhamento e Evidências dos Casos de Teste

#### Caso de Teste 01 — Inclusão de Agendamento Válido
- **Descrição:** Criação de novo agendamento com dados íntegros.
- **Entradas:** Cliente: "Mariana Oliveira", Tel: "(27) 99888-1122", Serviço: "Corte Feminino & Finalização", Data: dia seguinte útil, Horário: "10:00".
- **Comportamento:** O sistema valida os campos, insere a linha na tabela sem recarregar a tela, exibe Toast verde e atualiza o faturamento previsto.
- **Evidência Visual:**  
  *(Inserir print da tela com o formulário recém-preenchido e o Toast de sucesso exibido)*

---

#### Caso de Teste 02 — Edição de Agendamento no Modal
- **Descrição:** Atualização de registro existente através de modal interativo.
- **Entradas:** Seleção do agendamento de "Mariana Oliveira", alteração do horário de "10:00" para "14:00" e status para "Confirmado".
- **Comportamento:** O modal pré-carrega os dados do cliente. Após clicar em "Salvar Alterações", os valores são atualizados no DOM instantaneamente.
- **Evidência Visual:**  
  *(Inserir print do modal de edição aberto com o fundo borrado / backdrop blur)*

---

#### Caso de Teste 03 — Exclusão de Agendamento
- **Descrição:** Cancelamento e remoção de um agendamento do painel.
- **Entradas:** Clique no botão da lixeira na linha do cliente "Carlos Eduardo" e clique no botão "Confirmar Exclusão".
- **Comportamento:** O registro é excluído da tabela, a lista ajusta o total visível e o faturamento é subtraído de acordo com o preço do serviço.
- **Evidência Visual:**  
  *(Inserir print do modal de confirmação de exclusão e da tabela com o registro removido)*

---

#### Caso de Teste 04 — Aplicação de Busca e Filtro Dinâmico
- **Descrição:** Filtragem em tempo real de clientes e serviços.
- **Entradas:** Digitação de "Corte" no campo de busca textual.
- **Comportamento:** A tabela filtra dinamicamente no evento `input`, exibindo apenas os serviços de corte e atualizando os cards de resumo.
- **Evidência Visual:**  
  *(Inserir print com o termo digitado e a tabela filtrada em tempo real)*

---

#### Caso de Teste 05 — Validação Aprovada do Formulário
- **Descrição:** Verificação da máscara de telefone e aceitação de regras temporais.
- **Entradas:** Digitação sequencial dos números `27999887766` no campo de telefone.
- **Comportamento:** A máscara formata instantaneamente para `(27) 99988-7766` e o botão de agendar valida os dados sem erros.
- **Evidência Visual:**  
  *(Inserir print dos campos com validação visual aprovada)*

---

#### Caso de Teste 06 — Validação Reprovada (Tentativa de Conflito de Horário)
- **Descrição:** Tentativa proposital de agendar atendimento em horário já reservado.
- **Entradas:** Tentativa de marcar "Coloração & Mechas" (duração de 90 min) para o mesmo horário em que outro cliente já está agendado.
- **Comportamento:** O sistema impede a submissão, dispara um Toast de erro e alerta: *"Já existe um agendamento para este horário ou intervalo."*
- **Evidência Visual:**  
  *(Inserir print do Toast vermelho de erro indicando o conflito de agenda)*

---

#### Caso de Teste 07 — Fetch com Sucesso (10 Serviços Carregados)
- **Descrição:** Comunicação assíncrona bem-sucedida lendo o catálogo.
- **Entradas:** Carregamento inicial da página.
- **Comportamento:** A requisição assíncrona é completada, o skeleton desaparece e os 10 serviços especializados são dispostos em cards com preços e ícones.
- **Evidência Visual:**  
  *(Inserir print dos cards de catálogo renderizados na tela)*

---

#### Caso de Teste 08 — Fetch com Falha e Ativação do Fallback Transparente
- **Descrição:** Simulação de queda de servidor para testar a resiliência do sistema.
- **Entradas:** Abertura do projeto sem o servidor Node.js estar iniciado.
- **Comportamento:** O script detecta a indisponibilidade da API, aciona o fallback para `data/servicos.json`, mantém a aplicação totalmente funcional e armazena os dados no `localStorage`.
- **Evidência Visual:**  
  *(Inserir print do console do navegador demonstrando a recuperação transparente e o funcionamento offline)*

---

#### Caso de Teste 09 — Responsividade em Tela de Celular (Mobile View)
- **Descrição:** Verificação da usabilidade e layout em dispositivos móveis.
- **Entradas:** Inspeção de elementos com emulação de viewport de smartphone (375 x 667 pixels).
- **Comportamento:** O grid adapta-se para uma única coluna, o menu de navegação torna-se empilhado, os botões mantêm área de toque adequada (> 44px) e a tabela permite rolagem lateral suave.
- **Evidência Visual:**  
  *(Inserir print da tela em modo dispositivo móvel / DevTools)*

---

#### Caso de Teste 10 — Acessibilidade e Navegação por Teclado
- **Descrição:** Avaliação da navegação sem uso de mouse ou ponteiro.
- **Entradas:** Pressionamento alternado das teclas `Tab`, `Shift+Tab`, `Enter` para acionar botões e `Esc` para fechar modais.
- **Comportamento:** Indicador de foco visual evidente (*focus ring*) em todos os elementos interativos, formulários preenchíveis e fechamento seguro de modais.
- **Evidência Visual:**  
  *(Inserir print demonstrando o foco visual ativado em um botão ou input)*

---

## 5. GUIA DE INSTALAÇÃO E EXECUÇÃO

O projeto foi construído para permitir execução rápida e descomplicada pelo professor avaliador, suportando duas formas de inicialização:

### 5.1. Execução Simples via Live Server (100% Offline / Standalone)
Não requer instalação de banco de dados ou execução de comandos de terminal:
1. Abra a pasta do projeto no **Visual Studio Code**;
2. Clique com o botão direito sobre o arquivo `public/index.html` e selecione **"Open with Live Server"** (ou execute via terminal com `python -m http.server 5500`);
3. A aplicação carregará os 10 serviços a partir de `public/data/servicos.json` e persistirá os agendamentos no `localStorage` do navegador.

### 5.2. Execução Completa com API Node.js e Microsoft SQL Server
Para executar a solução com persistência real em banco relacional:
1. **Configurar o Banco de Dados:**
   - Abra o **SQL Server Management Studio (SSMS)**;
   - Abra o arquivo `server/database/schema.sql` e execute (**F5**) para criar o banco `AgendaFacilDB`, as tabelas e os dados iniciais.
2. **Instalar Dependências:**
   - No terminal, dentro da pasta raiz do projeto, execute:
     ```bash
     npm install
     ```
3. **Configurar o Ambiente:**
   - Crie o arquivo `.env` a partir do modelo `.env.example` preenchendo as credenciais do seu SQL Server:
     ```env
     DB_SERVER=127.0.0.1
     DB_PORT=1433
     DB_USER=sa
     DB_PASSWORD=SuaSenhaForte123!
     DB_DATABASE=AgendaFacilDB
     PORT=3000
     ```
4. **Iniciar o Servidor:**
   - Execute no terminal:
     ```bash
     npm start
     ```
5. **Acessar a Aplicação:**
   - Abra o navegador no endereço: `http://localhost:3000`.

---

## 6. DECLARAÇÃO DE TECNOLOGIAS, BIBLIOTECAS E USO DE IA

Em estrito cumprimento às instruções do edital avaliativo (*"bibliotecas, modelos e uso de IA deverão ser declarados"*), declaram-se:

- **Linguagens e Tecnologias Base:**
  - HTML5 (marcação semântica e acessibilidade);
  - CSS3 (Custom Properties, Flexbox, Grid, Animações e Dark/Light Mode);
  - JavaScript ES6+ (Manipulação do DOM, Fetch API, async/await, Eventos e LocalStorage);
  - Node.js e Express (Construção da API REST e controle de rotas);
  - Microsoft SQL Server (Banco de dados relacional e driver `mssql`).
- **Bibliotecas e Recursos Externos Utilizados:**
  - `express`: servidor HTTP e roteamento;
  - `mssql`: driver oficial de conexão ao Microsoft SQL Server;
  - `cors`: controle de acesso HTTP entre origens;
  - `dotenv`: gerenciamento seguro de variáveis de ambiente locais;
  - `Font Awesome 6` (via CDN): ícones vetoriais de apoio visual;
  - `Google Fonts` (via CDN): família tipográfica *Plus Jakarta Sans*.
- **Declaração de Apoio de Inteligência Artificial:**
  - Foi utilizado assistente de Inteligência Artificial generativa (*Antigravity / DeepMind*) como ferramenta de apoio técnico para:
    - Revisão e refatoração arquitetural de código (conversão de padrões síncronos para assíncronos);
    - Otimização das regras de negócio de sobreposição de intervalos temporais;
    - Formatação do manual de instalação e estruturação das evidências de teste no padrão acadêmico ABNT.
  - Todo o código foi validado, testado e dominado pelos integrantes do grupo, estando os mesmos plenamente aptos para demonstração e sustentação perante o professor da disciplina.

---

## 7. CONCLUSÃO

O desenvolvimento do projeto **Agenda Fácil** no 2º bimestre representou um salto qualitativo fundamental em relação aos conceitos fundamentais de desenvolvimento web adquiridos no início do curso. 

A transição de uma página predominantemente estática para uma **Single-Page Application (SPA) orientada a eventos e dados** permitiu a consolidação prática de conceitos indispensáveis na formação de um desenvolvedor web: manipulação minuciosa da árvore DOM, validação assíncrona, prevenção de falhas de concorrência temporal na agenda e tratamento transparente de contingência através de múltiplos modos de persistência.

A arquitetura concebida demonstrou alta resiliência e estabilidade, operando com total integridade tanto em ambientes simplificados de avaliação (Live Server offline) quanto em ambientes corporativos de produção baseados em microsserviços Node.js e Microsoft SQL Server. Desta forma, todos os objetivos pedagógicos da disciplina de Programação para Internet foram plenamente alcançados.

---

## 8. REFERÊNCIAS BIBLIOGRÁFICAS

1. **CENTRO UNIVERSITÁRIO MULTIVIX.** *Manual de Trabalhos Acadêmicos e Diretrizes de Normalização ABNT*. Vitória: Multivix, 2026.
2. **MDN WEB DOCS.** *Asynchronous JavaScript: Using Fetch and async/await*. Mozilla Developer Network, 2026. Disponível em: <https://developer.mozilla.org/pt-BR/docs/Learn/JavaScript/Asynchronous>. Acesso em: 12 nov. 2026.
3. **MDN WEB DOCS.** *Document Object Model (DOM) Manipulation*. Mozilla Developer Network, 2026. Disponível em: <https://developer.mozilla.org/pt-BR/docs/Web/API/Document_Object_Model>. Acesso em: 12 nov. 2026.
4. **MICROSOFT.** *Documentação Oficial do Microsoft SQL Server e Driver Node mssql*. Microsoft Learn, 2026. Disponível em: <https://learn.microsoft.com/sql/>. Acesso em: 12 nov. 2026.
5. **W3C.** *Web Content Accessibility Guidelines (WCAG) 2.1*. World Wide Web Consortium, 2023. Disponível em: <https://www.w3.org/TR/WCAG21/>. Acesso em: 12 nov. 2026.
