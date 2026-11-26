// Regras de negócio das doações.
// Camada de domínio desacoplada do banco e do protocolo HTTP.
import * as repo from './repositorio.js';

const TRANSICOES_PERMITIDAS = Object.freeze({
  disponivel: ['aceita'],
  aceita: ['coletada', 'disponivel'],
  coletada: []
});

function exigirTexto(valor, mensagemErro) {
  if (!valor || !String(valor).trim()) {
    throw new Error(mensagemErro);
  }
  return String(valor).trim();
}

async function buscarEValidarTransicao(id, destino, mensagensErro = {}) {
  const doacao = await repo.buscarPorId(id);
  if (!doacao) {
    throw new Error('Doação não encontrada.');
  }

  if (!TRANSICOES_PERMITIDAS[doacao.status]?.includes(destino)) {
    throw new Error(
      mensagensErro[doacao.status] ||
        mensagensErro.padrao ||
        `Transição inválida de '${doacao.status}' para '${destino}'.`
    );
  }

  return doacao;
}

// História zero e H1 — "um doador publica uma doação".
// Critérios: tipo, quantidade, validade e identificação do doador são obrigatórios.
export async function criarDoacao({ doador, tipo, quantidade, validade } = {}) {
  const tipoLimpo = exigirTexto(tipo, 'Tipo, quantidade e validade são obrigatórios.');
  const quantidadeLimpa = exigirTexto(quantidade, 'Tipo, quantidade e validade são obrigatórios.');
  const validadeLimpa = exigirTexto(validade, 'Tipo, quantidade e validade são obrigatórios.');
  const doadorLimpo = exigirTexto(doador, 'O nome do doador é obrigatório.');

  if (doadorLimpo === 'Doador não informado') {
    throw new Error('O nome do doador é obrigatório.');
  }

  return await repo.inserir({
    doador: doadorLimpo,
    tipo: tipoLimpo,
    quantidade: quantidadeLimpa,
    validade: validadeLimpa
  });
}

// História zero — "uma ONG vê as doações disponíveis".
export async function listarDisponiveis() {
  return await repo.listarDisponiveis();
}

// H2 — "o voluntário vê as doações aceitas aguardando coleta".
export async function listarAceitas() {
  return await repo.listarAceitas();
}

// H1 — "o doador acompanha as suas doações".
export async function listarPorDoador(doador) {
  const nomeDoador = exigirTexto(doador, 'Informe o nome do doador para consultar.');
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
  await buscarEValidarTransicao(id, 'aceita', {
    padrao: 'Doação já foi aceita por outra ONG.'
  });
  const ongLimpa = exigirTexto(ong, 'O nome da ONG é obrigatório.');

  const atualizada = await repo.aceitar(id, ongLimpa);
  if (!atualizada) {
    throw new Error('Não foi possível aceitar a doação.');
  }

  return atualizada;
}

// H2 — "o voluntário confirma a coleta".
export async function confirmarColeta(id, voluntario) {
  await buscarEValidarTransicao(id, 'coletada', {
    coletada: 'Doação já foi coletada.',
    padrao: 'Só é possível confirmar a coleta de uma doação aceita.'
  });
  const voluntarioLimpo = exigirTexto(voluntario, 'O nome do voluntário é obrigatório.');

  const atualizada = await repo.confirmarColeta(id, voluntarioLimpo);
  if (!atualizada) {
    throw new Error('Não foi possível confirmar a coleta.');
  }

  return atualizada;
}

// H3 — "a ONG devolve uma doação aceita".
export async function devolverDoacao(id, { ong, motivo } = {}) {
  const doacao = await buscarEValidarTransicao(id, 'disponivel', {
    coletada: 'Não é possível devolver uma doação que já foi coletada.',
    padrao: 'Só é possível devolver uma doação aceita.'
  });
  const ongInformada = exigirTexto(ong, 'Apenas a ONG que aceitou a doação pode devolvê-la.');
  if (ongInformada !== doacao.ong) {
    throw new Error('Apenas a ONG que aceitou a doação pode devolvê-la.');
  }
  const motivoLimpo = exigirTexto(motivo, 'O motivo da devolução é obrigatório.');

  const atualizada = await repo.devolver(id, ongInformada, motivoLimpo);
  if (!atualizada) {
    throw new Error('Não foi possível devolver a doação.');
  }

  return atualizada;
}
