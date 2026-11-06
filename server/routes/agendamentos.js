const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getPool, sql } = require('../config/db');

// Armazenamento em memória para caso o servidor Node esteja rodando sem SQL Server
let memoriaAgendamentos = [];

function getLocalServices() {
    const filePath = path.join(__dirname, '../../public/data/servicos.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// GET /api/agendamentos - Listar todos os agendamentos
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().execute('sp_ListarAgendamentos');
        return res.json({
            origem: 'sql_server',
            total: result.recordset.length,
            dados: result.recordset
        });
    } catch (err) {
        console.warn('⚠️ SQL Server offline em /api/agendamentos. Retornando dados em memória.');
        return res.json({
            origem: 'memoria_fallback',
            total: memoriaAgendamentos.length,
            dados: memoriaAgendamentos,
            aviso: 'Modo de contingência ativo (SQL Server não conectado).'
        });
    }
});

// POST /api/agendamentos - Criar novo agendamento
router.post('/', async (req, res) => {
    const {
        cliente_nome,
        cliente_telefone,
        servico_id,
        data_agendamento,
        horario_agendamento,
        observacoes,
        status = 'Confirmado'
    } = req.body;

    if (!cliente_nome || !cliente_telefone || !servico_id || !data_agendamento || !horario_agendamento) {
        return res.status(400).json({
            erro: 'Campos obrigatórios ausentes: cliente_nome, cliente_telefone, servico_id, data_agendamento, horario_agendamento.'
        });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('cliente_nome', sql.VarChar(100), cliente_nome.trim())
            .input('cliente_telefone', sql.VarChar(20), cliente_telefone.trim())
            .input('servico_id', sql.Int, parseInt(servico_id, 10))
            .input('data_agendamento', sql.Date, data_agendamento)
            .input('horario_agendamento', sql.VarChar(8), horario_agendamento)
            .input('observacoes', sql.NVarChar(sql.MAX), observacoes || null)
            .input('status', sql.VarChar(20), status)
            .execute('sp_CriarAgendamento');

        const criado = result.recordset[0];
        return res.status(201).json({
            mensagem: 'Agendamento cadastrado com sucesso no SQL Server!',
            origem: 'sql_server',
            dado: criado
        });
    } catch (err) {
        // Se foi erro de conflito disparado pela Stored Procedure
        if (err.message && err.message.includes('Conflito de agenda')) {
            return res.status(409).json({
                erro: 'Conflito de horário detectado.',
                detalhes: err.message
            });
        }

        console.warn('⚠️ SQL Server offline. Salvando em memória fallback:', err.message);
        
        // Simulação do conflito na memória caso SQL Server esteja fora
        const servicos = getLocalServices();
        const servico = servicos.find(s => s.id === parseInt(servico_id, 10)) || {
            nome: 'Serviço Personalizado',
            preco: 50.0,
            duracao_minutos: 45,
            icone: 'fa-calendar-check',
            categoria: 'Geral'
        };

        const [h, m] = horario_agendamento.split(':').map(Number);
        const novoInicio = h * 60 + m;
        const novoFim = novoInicio + (servico.duracao_minutos || 45);

        const temConflito = memoriaAgendamentos.some(item => {
            if (item.data_agendamento !== data_agendamento || item.status === 'Cancelado') return false;
            const [ih, im] = item.horario_agendamento.split(':').map(Number);
            const exInicio = ih * 60 + im;
            const exFim = exInicio + (item.duracao_minutos || 45);
            return (novoInicio < exFim && novoFim > exInicio);
        });

        if (temConflito) {
            return res.status(409).json({
                erro: 'Conflito de horário detectado.',
                detalhes: 'Já existe outro agendamento neste dia e intervalo.'
            });
        }

        const novoItem = {
            id: Date.now(),
            cliente_nome: cliente_nome.trim(),
            cliente_telefone: cliente_telefone.trim(),
            servico_id: parseInt(servico_id, 10),
            servico_nome: servico.nome,
            servico_preco: servico.preco,
            servico_duracao: servico.duracao_minutos,
            servico_categoria: servico.categoria,
            servico_icone: servico.icone,
            data_agendamento,
            horario_agendamento,
            duracao_minutos: servico.duracao_minutos,
            observacoes: observacoes || '',
            status,
            criado_em: new Date().toISOString()
        };

        memoriaAgendamentos.push(novoItem);
        return res.status(201).json({
            mensagem: 'Agendamento salvo (modo de contingência em memória)!',
            origem: 'memoria_fallback',
            dado: novoItem
        });
    }
});

// PUT /api/agendamentos/:id - Atualizar agendamento
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const {
        cliente_nome,
        cliente_telefone,
        servico_id,
        data_agendamento,
        horario_agendamento,
        observacoes,
        status
    } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ erro: 'ID inválido.' });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('cliente_nome', sql.VarChar(100), cliente_nome.trim())
            .input('cliente_telefone', sql.VarChar(20), cliente_telefone.trim())
            .input('servico_id', sql.Int, parseInt(servico_id, 10))
            .input('data_agendamento', sql.Date, data_agendamento)
            .input('horario_agendamento', sql.VarChar(8), horario_agendamento)
            .input('observacoes', sql.NVarChar(sql.MAX), observacoes || null)
            .input('status', sql.VarChar(20), status || 'Confirmado')
            .execute('sp_AtualizarAgendamento');

        return res.json({
            mensagem: 'Agendamento atualizado com sucesso no SQL Server!',
            origem: 'sql_server',
            dado: result.recordset[0]
        });
    } catch (err) {
        if (err.message && err.message.includes('Conflito de agenda')) {
            return res.status(409).json({ erro: 'Conflito de horário detectado.', detalhes: err.message });
        }

        console.warn('⚠️ SQL Server offline. Atualizando na memória fallback:', err.message);
        const index = memoriaAgendamentos.findIndex(a => a.id === id);
        if (index === -1) {
            return res.status(404).json({ erro: 'Agendamento não encontrado.' });
        }

        const servicos = getLocalServices();
        const servico = servicos.find(s => s.id === parseInt(servico_id, 10));

        memoriaAgendamentos[index] = {
            ...memoriaAgendamentos[index],
            cliente_nome: cliente_nome || memoriaAgendamentos[index].cliente_nome,
            cliente_telefone: cliente_telefone || memoriaAgendamentos[index].cliente_telefone,
            servico_id: servico_id ? parseInt(servico_id, 10) : memoriaAgendamentos[index].servico_id,
            servico_nome: servico ? servico.nome : memoriaAgendamentos[index].servico_nome,
            servico_preco: servico ? servico.preco : memoriaAgendamentos[index].servico_preco,
            servico_duracao: servico ? servico.duracao_minutos : memoriaAgendamentos[index].servico_duracao,
            servico_categoria: servico ? servico.categoria : memoriaAgendamentos[index].servico_categoria,
            servico_icone: servico ? servico.icone : memoriaAgendamentos[index].servico_icone,
            data_agendamento: data_agendamento || memoriaAgendamentos[index].data_agendamento,
            horario_agendamento: horario_agendamento || memoriaAgendamentos[index].horario_agendamento,
            observacoes: observacoes !== undefined ? observacoes : memoriaAgendamentos[index].observacoes,
            status: status || memoriaAgendamentos[index].status
        };

        return res.json({
            mensagem: 'Agendamento atualizado na memória de contingência!',
            origem: 'memoria_fallback',
            dado: memoriaAgendamentos[index]
        });
    }
});

// DELETE /api/agendamentos/:id - Excluir agendamento
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ erro: 'ID inválido.' });
    }

    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, id)
            .execute('sp_DeletarAgendamento');

        return res.json({
            mensagem: 'Agendamento excluído com sucesso do SQL Server!',
            idExcluido: id,
            origem: 'sql_server'
        });
    } catch (err) {
        console.warn('⚠️ SQL Server offline. Excluindo da memória fallback:', err.message);
        const index = memoriaAgendamentos.findIndex(a => a.id === id);
        if (index === -1) {
            return res.status(404).json({ erro: 'Agendamento não encontrado.' });
        }
        memoriaAgendamentos.splice(index, 1);
        return res.json({
            mensagem: 'Agendamento removido da memória de contingência!',
            idExcluido: id,
            origem: 'memoria_fallback'
        });
    }
});

module.exports = router;

