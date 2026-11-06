-- =========================================================================
-- BANCO DE DADOS: AgendaFacilDB (Microsoft SQL Server)
-- Disciplina: Programação para Internet - 2º Bimestre (Multivix 2026)
-- Projeto: Agenda Fácil - Salão de Beleza
-- ATENÇÃO: PARA MELHOR FUNCIONAMENTO CRIE O BANCO DE DADOS COM O COMANDO ABAIXO NO SQL SERVER MANAGEMENT STUDIO OU NO TERMINAL
-- COMANDO: CREATE DATABASE AgendaFacilDB;
-- =========================================================================

-- 1. CRIAÇÃO DO BANCO DE DADOS
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AgendaFacilDB')
BEGIN
    CREATE DATABASE AgendaFacilDB COLLATE Latin1_General_100_CI_AI_SC_UTF8;
END
GO

USE AgendaFacilDB;
GO

-- =========================================================================
-- 2. CRIAÇÃO DAS TABELAS
-- =========================================================================

-- Tabela de Serviços
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Servicos')
BEGIN
    CREATE TABLE Servicos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        preco DECIMAL(10,2) NOT NULL,
        duracao_minutos INT NOT NULL,
        categoria NVARCHAR(50) NOT NULL,
        icone NVARCHAR(50) NOT NULL,
        descricao NVARCHAR(255) NULL,
        criado_em DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tabela de Agendamentos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Agendamentos')
BEGIN
    CREATE TABLE Agendamentos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        cliente_nome NVARCHAR(100) NOT NULL,
        cliente_telefone NVARCHAR(20) NOT NULL,
        servico_id INT NOT NULL,
        data_agendamento DATE NOT NULL,
        horario_agendamento NVARCHAR(8) NOT NULL, -- Formato 'HH:mm'
        duracao_minutos INT NOT NULL DEFAULT 45,
        observacoes NVARCHAR(MAX) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT N'Confirmado', -- 'Pendente', 'Confirmado', 'Cancelado'
        criado_em DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_Agendamentos_Servicos FOREIGN KEY (servico_id) REFERENCES Servicos(id) ON DELETE CASCADE
    );
END
GO

-- =========================================================================
-- 3. SEEDING: INSERÇÃO DOS 10 SERVIÇOS OFICIAIS (COM SUPORTE UTF-8)
-- =========================================================================
IF NOT EXISTS (SELECT 1 FROM Servicos)
BEGIN
    INSERT INTO Servicos (nome, preco, duracao_minutos, categoria, icone, descricao)
    VALUES
        (N'Corte Feminino & Finalização', 75.00, 45, N'Cabelo', N'fa-scissors', N'Corte personalizado de acordo com o visagismo do seu rosto, lavado e escova inclusos.'),
        (N'Corte Masculino & Barba Terapia', 60.00, 35, N'Cabelo', N'fa-user-tie', N'Corte na tesoura ou máquina com acabamento de navalha e toalha quente na barba.'),
        (N'Escova Modeladora & Prancha', 55.00, 45, N'Cabelo', N'fa-wind', N'Lavagem com shampoo nutritivo, secagem, escovação e acabamento com prancha de íons.'),
        (N'Coloração & Mechas Iluminadas', 160.00, 90, N'Cabelo', N'fa-palette', N'Técnica de morena iluminada ou mechas pontuais com tonalização e matização de alto brilho.'),
        (N'Hidratação Profunda & Cronograma', 85.00, 45, N'Cabelo', N'fa-droplet', N'Tratamento intensivo de reposição hídrica e lipídica com máscara importada e vapor de ozônio.'),
        (N'Manicure Spa Completa', 40.00, 40, N'Unhas', N'fa-hand-sparkles', N'Cutilagem funda e delicada, esfoliação com óleos essenciais e esmaltação perfeita.'),
        (N'Pedicure Spa & Relaxamento', 50.00, 45, N'Unhas', N'fa-shoe-prints', N'Remoção de calosidades, hidratação de calcanhares com massagem podal relaxante.'),
        (N'Alongamento de Unhas em Gel', 140.00, 75, N'Unhas', N'fa-hand', N'Extensão natural com fibra de vidro ou gel moldado, com resistência e durabilidade superior.'),
        (N'Design de Sobrancelhas com Henna', 45.00, 30, N'Estética', N'fa-eye', N'Mapeamento facial com paquímetro para arqueamento ideal e pigmentação de longa duração.'),
        (N'Limpeza de Pele Profunda', 120.00, 60, N'Estética', N'fa-spa', N'Higienização, vapor de ozônio, extração de cravos, alta frequência e máscara calmante.');
END
GO

-- =========================================================================
-- 4. STORED PROCEDURES PARA OPERAÇÕES CRUD E VALIDAÇÃO DE CONFLITO
-- =========================================================================

-- Procedure: Listar Todos os Serviços
CREATE OR ALTER PROCEDURE sp_ListarServicos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, nome, preco, duracao_minutos, categoria, icone, descricao, criado_em
    FROM Servicos
    ORDER BY id ASC;
END
GO

-- Procedure: Listar Todos os Agendamentos (com Join em Serviços)
CREATE OR ALTER PROCEDURE sp_ListarAgendamentos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        a.id,
        a.cliente_nome,
        a.cliente_telefone,
        a.servico_id,
        s.nome AS servico_nome,
        s.preco AS servico_preco,
        s.duracao_minutos AS servico_duracao,
        s.categoria AS servico_categoria,
        s.icone AS servico_icone,
        CONVERT(VARCHAR(10), a.data_agendamento, 23) AS data_agendamento,
        a.horario_agendamento,
        a.duracao_minutos,
        a.observacoes,
        a.status,
        a.criado_em
    FROM Agendamentos a
    INNER JOIN Servicos s ON a.servico_id = s.id
    ORDER BY a.data_agendamento ASC, a.horario_agendamento ASC;
END
GO

-- Procedure: Criar Agendamento com Verificação de Conflito de Horário
CREATE OR ALTER PROCEDURE sp_CriarAgendamento
    @cliente_nome NVARCHAR(100),
    @cliente_telefone NVARCHAR(20),
    @servico_id INT,
    @data_agendamento DATE,
    @horario_agendamento NVARCHAR(8),
    @observacoes NVARCHAR(MAX) = NULL,
    @status NVARCHAR(20) = N'Confirmado'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @duracao_minutos INT;
    SELECT @duracao_minutos = duracao_minutos FROM Servicos WHERE id = @servico_id;

    IF @duracao_minutos IS NULL
    BEGIN
        RAISERROR(N'Serviço inválido ou não encontrado.', 16, 1);
        RETURN;
    END

    DECLARE @hora INT = CAST(SUBSTRING(@horario_agendamento, 1, 2) AS INT);
    DECLARE @minuto INT = CAST(SUBSTRING(@horario_agendamento, 4, 2) AS INT);
    DECLARE @novo_inicio INT = (@hora * 60) + @minuto;
    DECLARE @novo_fim INT = @novo_inicio + @duracao_minutos;

    -- Checar conflito com agendamentos existentes no mesmo dia (não cancelados)
    IF EXISTS (
        SELECT 1
        FROM Agendamentos a
        WHERE a.data_agendamento = @data_agendamento
          AND a.status <> N'Cancelado'
          AND (
              @novo_inicio < (
                  CAST(SUBSTRING(a.horario_agendamento, 1, 2) AS INT) * 60 + 
                  CAST(SUBSTRING(a.horario_agendamento, 4, 2) AS INT) + a.duracao_minutos
              )
              AND
              @novo_fim > (
                  CAST(SUBSTRING(a.horario_agendamento, 1, 2) AS INT) * 60 + 
                  CAST(SUBSTRING(a.horario_agendamento, 4, 2) AS INT)
              )
          )
    )
    BEGIN
        RAISERROR(N'Conflito de agenda: Já existe um agendamento ocupando esse intervalo de horário.', 16, 1);
        RETURN;
    END

    INSERT INTO Agendamentos (cliente_nome, cliente_telefone, servico_id, data_agendamento, horario_agendamento, duracao_minutos, observacoes, status)
    VALUES (@cliente_nome, @cliente_telefone, @servico_id, @data_agendamento, @horario_agendamento, @duracao_minutos, @observacoes, @status);

    DECLARE @novo_id INT = SCOPE_IDENTITY();

    SELECT 
        a.id,
        a.cliente_nome,
        a.cliente_telefone,
        a.servico_id,
        s.nome AS servico_nome,
        s.preco AS servico_preco,
        s.duracao_minutos AS servico_duracao,
        s.categoria AS servico_categoria,
        s.icone AS servico_icone,
        CONVERT(VARCHAR(10), a.data_agendamento, 23) AS data_agendamento,
        a.horario_agendamento,
        a.duracao_minutos,
        a.observacoes,
        a.status,
        a.criado_em
    FROM Agendamentos a
    INNER JOIN Servicos s ON a.servico_id = s.id
    WHERE a.id = @novo_id;
END
GO

-- Procedure: Atualizar Agendamento com Verificação de Conflito
CREATE OR ALTER PROCEDURE sp_AtualizarAgendamento
    @id INT,
    @cliente_nome NVARCHAR(100),
    @cliente_telefone NVARCHAR(20),
    @servico_id INT,
    @data_agendamento DATE,
    @horario_agendamento NVARCHAR(8),
    @observacoes NVARCHAR(MAX) = NULL,
    @status NVARCHAR(20) = N'Confirmado'
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Agendamentos WHERE id = @id)
    BEGIN
        RAISERROR(N'Agendamento não encontrado.', 16, 1);
        RETURN;
    END

    DECLARE @duracao_minutos INT;
    SELECT @duracao_minutos = duracao_minutos FROM Servicos WHERE id = @servico_id;

    IF @duracao_minutos IS NULL
    BEGIN
        RAISERROR(N'Serviço inválido.', 16, 1);
        RETURN;
    END

    DECLARE @hora INT = CAST(SUBSTRING(@horario_agendamento, 1, 2) AS INT);
    DECLARE @minuto INT = CAST(SUBSTRING(@horario_agendamento, 4, 2) AS INT);
    DECLARE @novo_inicio INT = (@hora * 60) + @minuto;
    DECLARE @novo_fim INT = @novo_inicio + @duracao_minutos;

    IF @status <> N'Cancelado' AND EXISTS (
        SELECT 1
        FROM Agendamentos a
        WHERE a.id <> @id
          AND a.data_agendamento = @data_agendamento
          AND a.status <> N'Cancelado'
          AND (
              @novo_inicio < (
                  CAST(SUBSTRING(a.horario_agendamento, 1, 2) AS INT) * 60 + 
                  CAST(SUBSTRING(a.horario_agendamento, 4, 2) AS INT) + a.duracao_minutos
              )
              AND
              @novo_fim > (
                  CAST(SUBSTRING(a.horario_agendamento, 1, 2) AS INT) * 60 + 
                  CAST(SUBSTRING(a.horario_agendamento, 4, 2) AS INT)
              )
          )
    )
    BEGIN
        RAISERROR(N'Conflito de agenda: Já existe outro agendamento neste horário.', 16, 1);
        RETURN;
    END

    UPDATE Agendamentos
    SET cliente_nome = @cliente_nome,
        cliente_telefone = @cliente_telefone,
        servico_id = @servico_id,
        data_agendamento = @data_agendamento,
        horario_agendamento = @horario_agendamento,
        duracao_minutos = @duracao_minutos,
        observacoes = @observacoes,
        status = @status
    WHERE id = @id;

    SELECT 
        a.id,
        a.cliente_nome,
        a.cliente_telefone,
        a.servico_id,
        s.nome AS servico_nome,
        s.preco AS servico_preco,
        s.duracao_minutos AS servico_duracao,
        s.categoria AS servico_categoria,
        s.icone AS servico_icone,
        CONVERT(VARCHAR(10), a.data_agendamento, 23) AS data_agendamento,
        a.horario_agendamento,
        a.duracao_minutos,
        a.observacoes,
        a.status,
        a.criado_em
    FROM Agendamentos a
    INNER JOIN Servicos s ON a.servico_id = s.id
    WHERE a.id = @id;
END
GO

-- Procedure: Deletar Agendamento
CREATE OR ALTER PROCEDURE sp_DeletarAgendamento
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Agendamentos WHERE id = @id)
    BEGIN
        RAISERROR(N'Agendamento não encontrado para exclusão.', 16, 1);
        RETURN;
    END

    DELETE FROM Agendamentos WHERE id = @id;
    SELECT 1 AS Sucesso, @id AS IdExcluido;
END
GO
