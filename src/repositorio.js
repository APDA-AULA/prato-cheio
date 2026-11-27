// Camada de dados do Prato Cheio — acesso ao banco PostgreSQL.
// A conexão e o schema estão definidos em src/db.js.
//
// Marcadores de parâmetro do PostgreSQL são `$1, $2, ...` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = $1', [id]);
import { query } from './db.js';

// Inserir a doação e devolver a linha criada.
export async function inserir({ doador, tipo, quantidade, validade, criadaEm = null }) {
  const { rows } = await query(
    'INSERT INTO doacoes (doador, tipo, quantidade, validade, criada_em) VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW())) RETURNING *',
    [doador, tipo, quantidade, validade, criadaEm]
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

// Devolver apenas as doações com status 'aceita' aguardando coleta.
export async function listarAceitas() {
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'aceita' ORDER BY id ASC"
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

// Confirmar a coleta da doação pelo voluntário registrando o horário e devolver a linha atualizada.
export async function confirmarColeta(id, voluntario, coletadaEm = null) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'coletada', voluntario = $1, coletada_em = COALESCE($3::timestamptz, NOW()) WHERE id = $2 AND status = 'aceita' RETURNING *",
    [voluntario, id, coletadaEm]
  );
  return rows[0];
}

// Devolver uma doação aceita para a lista de disponíveis sem ONG, registrando o motivo para auditoria.
export async function devolver(id, ong, motivo) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'disponivel', ong = NULL, motivo_devolucao = $1 WHERE id = $2 AND status = 'aceita' AND ong = $3 RETURNING *",
    [motivo, id, ong]
  );
  return rows[0];
}

// Obter métricas mensais da Marta a partir do mês de publicação no fuso America/Sao_Paulo.
export async function obterResultadoMes(mes) {
  const { rows } = await query(
    `SELECT
      COUNT(*)::int AS publicadas,
      COUNT(*) FILTER (WHERE status IN ('aceita', 'coletada'))::int AS aceitas,
      COUNT(*) FILTER (WHERE status = 'coletada')::int AS coletadas,
      AVG(EXTRACT(EPOCH FROM (coletada_em - criada_em)) / 3600.0) FILTER (WHERE status = 'coletada')::float8 AS media_horas
    FROM doacoes
    WHERE TO_CHAR(criada_em AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') = $1`,
    [mes]
  );
  return rows[0];
}
