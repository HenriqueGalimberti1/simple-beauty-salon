const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { checkConnection } = require('./config/db');
const servicosRoutes = require('./routes/servicos');
const agendamentosRoutes = require('./routes/agendamentos');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend (pasta public)
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API REST
app.use('/api/servicos', servicosRoutes);
app.use('/api/agendamentos', agendamentosRoutes);

// Endpoint de Diagnóstico / Status do Sistema e Conexão SQL Server
app.get('/api/status', async (req, res) => {
    const dbStatus = await checkConnection();
    res.json({
        sistema: 'Agenda Fácil - Salão de Beleza',
        versao: '2.0.0 (Multivix 2026)',
        ambiente: process.env.NODE_ENV || 'development',
        sql_server: {
            conectado: dbStatus.ok,
            servidor: process.env.DB_SERVER || 'localhost',
            banco: process.env.DB_DATABASE || 'AgendaFacilDB',
            status: dbStatus.ok ? 'Online' : 'Offline (Modo contingência ativo)',
            mensagem: dbStatus.message
        },
        fallback_disponivel: true,
        timestamp: new Date().toISOString()
    });
});

// Fallback SPA - redireciona rotas web para index.html
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('❌ Erro interno do servidor:', err);
    res.status(500).json({
        erro: 'Erro interno no servidor.',
        detalhes: err.message
    });
});

// Inicialização do servidor
app.listen(PORT, async () => {
    console.log('====================================================');
    console.log(`🚀 Agenda Fácil API rodando em http://localhost:${PORT}`);
    console.log(`📁 Servindo arquivos estáticos de: ${path.join(__dirname, '../public')}`);
    console.log('----------------------------------------------------');
    
    // Testa status da conexão com Microsoft SQL Server
    const dbStatus = await checkConnection();
    if (dbStatus.ok) {
        console.log('🟢 BANCO DE DADOS: Microsoft SQL Server CONECTADO!');
    } else {
        console.log('🟡 BANCO DE DADOS: SQL Server OFFLINE.');
        console.log(`   Motivo: ${dbStatus.message}`);
        console.log('   ℹ️ O servidor continuará operando com FALLBACK automático (memória + servicos.json).');
    }
    console.log('====================================================');
});

