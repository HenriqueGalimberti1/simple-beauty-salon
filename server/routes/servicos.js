const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getPool, sql } = require('../config/db');

// Helper para carregar servicos.json local em caso de fallback
function getLocalServices() {
    const filePath = path.join(__dirname, '../../public/data/servicos.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

// GET /api/servicos - Lista todos os serviços
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().execute('sp_ListarServicos');
        return res.json({
            origem: 'sql_server',
            total: result.recordset.length,
            dados: result.recordset
        });
    } catch (err) {
        console.warn('⚠️ SQL Server indisponível em /api/servicos, utilizando fallback servicos.json:', err.message);
        try {
            const locais = getLocalServices();
            return res.json({
                origem: 'fallback_json',
                total: locais.length,
                dados: locais,
                aviso: 'Dados carregados da base local (SQL Server offline).'
            });
        } catch (jsonErr) {
            return res.status(500).json({
                erro: 'Erro ao carregar serviços.',
                detalhes: jsonErr.message
            });
        }
    }
});

// GET /api/servicos/:id - Detalha um serviço específico
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ erro: 'ID de serviço inválido.' });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Servicos WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ erro: 'Serviço não encontrado.' });
        }

        return res.json({
            origem: 'sql_server',
            dado: result.recordset[0]
        });
    } catch (err) {
        console.warn('⚠️ SQL Server offline para /api/servicos/:id, buscando no JSON local');
        try {
            const locais = getLocalServices();
            const servico = locais.find(s => s.id === id);
            if (!servico) {
                return res.status(404).json({ erro: 'Serviço não encontrado.' });
            }
            return res.json({
                origem: 'fallback_json',
                dado: servico
            });
        } catch (jsonErr) {
            return res.status(500).json({ erro: 'Erro ao buscar serviço.', detalhes: jsonErr.message });
        }
    }
});

module.exports = router;

