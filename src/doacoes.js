// Regras de negócio das doações.
// Camada de domínio desacoplada do banco e do protocolo HTTP.
import * as repo from './repositorio.js';

// História zero e H1 — "um doador publica uma doação".
// Critérios: tipo, quantidade, validade e identificação do doador são obrigatórios.
export async function criarDoacao({ doador, tipo, quantidade, validade } = {}) {
  if (
    !tipo ||
    !quantidade ||
    !validade ||
    !String(tipo).trim() ||
    !String(quantidade).trim() ||
    !String(validade).trim()
  ) {
    throw new Error('Tipo, quantidade e validade são obrigatórios.');
  }

  if (!doador || !String(doador).trim() || String(doador).trim() === 'Doador não informado') {
    throw new Error('O nome do doador é obrigatório.');
  }

  return await repo.inserir({
    doador: String(doador).trim(),
    tipo: String(tipo).trim(),
    quantidade: String(quantidade).trim(),
    validade: String(validade).trim()
  });
}

// História zero — "uma ONG vê as doações disponíveis".
export async function listarDisponiveis() {
  return await repo.listarDisponiveis();
}

// H1 — "o doador acompanha as suas doações".
export async function listarPorDoador(doador) {
  if (!doador || !String(doador).trim()) {
    throw new Error('Informe o nome do doador para consultar.');
  }

  const nomeDoador = String(doador).trim();
  if (nomeDoador === 'Doador não informado') {
    return [];
  }

  const lista = await repo.listarPorDoador(nomeDoador);
  return lista.map((row) => ({
    ...row,
    situacao: row.status === 'aceita' && row.ong ? `aceita por ${row.ong}` : row.status
  }));
}

// História zero — "uma ONG aceita uma doação".
// Regra do caso: uma doação aceita não fica disponível para outra ONG.
export async function aceitar(id, ong = 'ONG') {
  const doacao = await repo.buscarPorId(id);
  if (!doacao) {
    throw new Error('Doação não encontrada.');
  }
  if (doacao.status !== 'disponivel') {
    throw new Error('Doação já foi aceita por outra ONG.');
  }

  const atualizada = await repo.aceitar(id, ong);
  if (!atualizada) {
    throw new Error('Não foi possível aceitar a doação.');
  }

  return atualizada;
}
