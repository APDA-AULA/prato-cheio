// Regras de negócio das doações.
// TODO (grupo): implementar conforme as histórias e os critérios de aceite da Unidade 1.
import * as repo from './repositorio.js';

// História zero - "um doador publica uma doação".
// Critério: tipo, quantidade e validade são obrigatórios.
export async function criarDoacao({ tipo, quantidade, validade }) {
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

  return await repo.inserir({
    tipo: String(tipo).trim(),
    quantidade: String(quantidade).trim(),
    validade: String(validade).trim()
  });
}

// História zero - "uma ONG vê as doações disponíveis".
export async function listarDisponiveis() {
  return await repo.listarDisponiveis();
}

// História zero - "uma ONG aceita uma doação".
// Regra do caso: uma doação aceita não fica disponível para outra ONG.
export async function aceitar(id, ong = 'ONG') {
  const doacao = await repo.buscarPorId(id);
  if (!doacao) {
    throw new Error('Doação não encontrada.');
  }
  if (doacao.status === 'cancelada') {
    throw new Error('Não é possível aceitar uma doação que foi cancelada.');
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

// História 6 - "um doador cancela uma doação disponível".
// Regra de negócio: somente doações com status 'disponivel' podem ser canceladas.
export async function cancelar(id) {
  const idNumerico = Number(id);
  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    throw new Error('Identificador de doação inválido.');
  }

  const doacao = await repo.buscarPorId(idNumerico);
  if (!doacao) {
    throw new Error('Doação não encontrada.');
  }
  if (doacao.status === 'aceita') {
    throw new Error('Não é possível cancelar uma doação que já foi aceita por uma ONG.');
  }
  if (doacao.status === 'cancelada') {
    throw new Error('Esta doação já foi cancelada anteriormente.');
  }

  const atualizada = await repo.cancelar(idNumerico);
  if (!atualizada) {
    throw new Error('Não foi possível cancelar a doação.');
  }

  return atualizada;
}
