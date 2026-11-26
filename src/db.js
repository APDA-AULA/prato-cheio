// Conexão com o banco de dados PostgreSQL via pool (`pg`).
// A interface (`query` devolvendo `{ rows, alteradas }`) isola o driver aqui,
// mantendo a camada de domínio desacoplada do banco.
import { existsSync } from 'node:fs';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL && existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignora erro caso .env não possa ser lido.
  }
}

let pool;

export function conexao() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL não definida. Configure a variável de ambiente DATABASE_URL ou crie um arquivo .env.'
      );
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

/**
 * Executa uma consulta e devolve { rows, alteradas }.
 * Use `$1, $2, ...` como marcadores de parâmetro (evita injeção de SQL):
 *   query('SELECT * FROM doacoes WHERE id = $1', [id])
 */
export async function query(sql, valores = []) {
  const res = await conexao().query(sql, valores);
  return { rows: res.rows, alteradas: res.rowCount };
}

/** Cria o schema, se ainda não existir. Rodado por `npm run db:migrar` e ao subir o servidor. */
export async function migrar() {
  await query(`
    CREATE TABLE IF NOT EXISTS doacoes (
      id               SERIAL PRIMARY KEY,
      doador           TEXT NOT NULL DEFAULT 'Doador não informado',
      tipo             TEXT NOT NULL,
      quantidade       TEXT NOT NULL,
      validade         TEXT NOT NULL,
      status           TEXT NOT NULL DEFAULT 'disponivel',
      ong              TEXT,
      voluntario       TEXT,
      coletada_em      TIMESTAMPTZ,
      motivo_devolucao TEXT,
      criada_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    ALTER TABLE doacoes
    ADD COLUMN IF NOT EXISTS doador TEXT NOT NULL DEFAULT 'Doador não informado'
  `);
  await query(`
    ALTER TABLE doacoes
    ADD COLUMN IF NOT EXISTS voluntario TEXT
  `);
  await query(`
    ALTER TABLE doacoes
    ADD COLUMN IF NOT EXISTS coletada_em TIMESTAMPTZ
  `);
  await query(`
    ALTER TABLE doacoes
    ADD COLUMN IF NOT EXISTS motivo_devolucao TEXT
  `);
}

export function ehBancoDeTeste() {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV !== 'test') {
    return false;
  }
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const nomeBanco = parsed.pathname.replace(/^\/+/, '').toLowerCase();
    return nomeBanco.includes('test');
  } catch {
    return false;
  }
}

/** Apaga todos os dados. Usado pelos testes. */
export async function limparBanco() {
  if (!ehBancoDeTeste()) {
    throw new Error('Operação abortada: limparBanco() só pode ser executado em ambiente de teste e nunca no banco de dados real.');
  }
  await query('DELETE FROM doacoes');
}

export async function encerrar() {
  if (pool) {
    const atual = pool;
    pool = undefined;
    await atual.end();
  }
}
