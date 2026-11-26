// Camada de dados do Prato Cheio — acesso ao banco PostgreSQL.
// A conexão e o schema estão definidos em src/db.js.
//
// Marcadores de parâmetro do PostgreSQL são `$1, $2, ...` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = $1', [id]);
import { query } from './db.js';

// Inserir a doação e devolver a linha criada.
export async function inserir({ doador, tipo, quantidade, validade }) {
  const { rows } = await query(
    'INSERT INTO doacoes (doador, tipo, quantidade, validade) VALUES ($1, $2, $3, $4) RETURNING *',
    [doador, tipo, quantidade, validade]
  );
  return rows[0];
}

// Devolver apenas as doações com status 'disponivel'.
export async function listarDisponiveis() {
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY id ASC"
  );
  return rows;
}

// Devolver todas as doações publicadas por um doador identificado.
export async function listarPorDoador(doador) {
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE doador = $1 AND doador <> 'Doador não informado' ORDER BY id ASC",
    [doador]
  );
  return rows;
}

// Buscar uma doação pelo id (devolver undefined se não existir).
export async function buscarPorId(id) {
  const { rows } = await query('SELECT * FROM doacoes WHERE id = $1', [id]);
  return rows[0];
}

// Marcar a doação como aceita pela ONG e devolver a linha atualizada.
export async function aceitar(id, ong) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'aceita', ong = $1 WHERE id = $2 AND status = 'disponivel' RETURNING *",
    [ong, id]
  );
  return rows[0];
}
