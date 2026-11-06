const sql = require('mssql');
require('dotenv').config();

// Se o servidor tiver barra (ex: localhost\\MSSQLSERVER01), pega o host principal
const rawServer = process.env.DB_SERVER || '127.0.0.1';
const serverHost = rawServer.includes('\\') ? rawServer.split('\\')[0] : rawServer;
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 59827;

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'SuaSenhaForte123!',
    server: serverHost,
    port: port,
    database: process.env.DB_DATABASE || 'AgendaFacilDB',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // true para Azure, false para local
        trustServerCertificate: true,               // aceita certificado autoassinado em dev
        enableArithAbort: true,
        connectTimeout: 5000,
        requestTimeout: 10000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function getPool() {
    if (!pool) {
        try {
            pool = await sql.connect(dbConfig);
            console.log('✅ Conexão estabelecida com Microsoft SQL Server com sucesso!');
        } catch (err) {
            console.warn('⚠️ Não foi possível conectar ao Microsoft SQL Server:', err.message);
            pool = null;
            throw err;
        }
    }
    return pool;
}

async function checkConnection() {
    try {
        const p = await getPool();
        await p.request().query('SELECT 1 AS connected');
        return { ok: true, message: 'Conectado ao Microsoft SQL Server' };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

module.exports = {
    sql,
    getPool,
    checkConnection,
    dbConfig
};
