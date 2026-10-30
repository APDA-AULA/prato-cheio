import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

// Este teste já passa e não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Backlog de testes do walking skeleton.
// Cada `it.todo` é um critério de aceite ainda não implementado - o CI não
// falha por causa deles. À medida que o grupo implementa, troque `it.todo`
// por um `it` de verdade (veja o exemplo comentado no fim do arquivo).
//
// Os testes abaixo usam o banco - que na Unidade 1 é SQLite em memória:
// nada a instalar, nada a subir.
// ---------------------------------------------------------------------------

describe('publicar e listar doações', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  it('1. recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  it('2. mostra a doação publicada na lista de disponíveis', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
    expect(res.body[0].status).toBe('disponivel');
  });
});

describe('aceitar uma doação', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  it('3. marca a doação como aceita pela ONG', async () => {
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Bolo', quantidade: '2 unidades', validade: '2026-08-02' });
    const id = criacao.body.id;

    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG Esperança');
  });

  it('4. remove a doação da lista de disponíveis depois de aceita', async () => {
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz', quantidade: '5 kg', validade: '2026-08-03' });
    const id = criacao.body.id;

    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Vida' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body.find(d => d.id === id)).toBeUndefined();
  });

  it('5. recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Bolo', quantidade: '1 bolo', validade: '2026-08-04' });
    const id = criacao.body.id;

    const res1 = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG A' });
    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG B' });
    expect(res2.status).toBe(400);
    expect(res2.body.erro).toBeDefined();
  });

  it('recusa aceitar uma doação inexistente', async () => {
    const res = await request(app)
      .post('/api/doacoes/9999/aceitar')
      .send({ ong: 'ONG Qualquer' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });
});

describe('cancelar uma doação', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  it('dado que o doador publicou uma doação, quando ele a cancela, então ela não aparece na lista de disponíveis', async () => {
    // Dado que o doador publicou uma doação pela API
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão Francês', quantidade: '30 unidades', validade: '2026-11-10' });
    const id = criacao.body.id;

    // Quando o doador cancela a doação publicada
    const cancelamento = await request(app)
      .post(`/api/doacoes/${id}/cancelar`);
    expect(cancelamento.status).toBe(200);

    // Então ela não aparece mais na lista de disponíveis
    const lista = await request(app).get('/api/doacoes');
    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(0);
    expect(lista.body.find(d => d.id === id)).toBeUndefined();
  });

  // B1 - Testes novos derivados dos critérios de aceite da história
  it('dado que uma doação está disponível, quando o doador a cancela, então o status muda para cancelada preservando os dados originais', async () => {
    // Dado que uma doação de legumes está disponível no sistema pela API
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Legumes variados', quantidade: '8 kg', validade: '2026-11-12' });
    const id = criacao.body.id;

    // Quando o doador solicita o cancelamento dessa doação pela API
    const res = await request(app)
      .post(`/api/doacoes/${id}/cancelar`);

    // Então a API devolve a doação com status cancelada e mantém tipo, quantidade e validade intactos
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.status).toBe('cancelada');
    expect(res.body.tipo).toBe('Legumes variados');
    expect(res.body.quantidade).toBe('8 kg');
    expect(res.body.validade).toBe('2026-11-12');
  });

  it('dado que uma doação já foi aceita por uma ONG, quando o doador tenta cancelá-la, então o sistema recusa a operação com mensagem de erro', async () => {
    // Dado que o doador publicou uma doação e a ONG Esperança já realizou o aceite pela API
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Marmitas', quantidade: '15 unidades', validade: '2026-11-15' });
    const id = criacao.body.id;

    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    // Quando o doador tenta cancelar a doação que já foi aceita
    const res = await request(app)
      .post(`/api/doacoes/${id}/cancelar`);

    // Então o sistema recusa com status 400 e mensagem explícita protegendo o aceite da ONG
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Não é possível cancelar uma doação que já foi aceita por uma ONG.');
  });

  it('dado que uma doação foi cancelada pelo doador, quando uma ONG tenta aceitá-la, então o sistema recusa o aceite informando que foi cancelada', async () => {
    // Dado que o doador publicou uma doação e em seguida realizou seu cancelamento pela API
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Frutas da estação', quantidade: '12 kg', validade: '2026-11-18' });
    const id = criacao.body.id;

    await request(app)
      .post(`/api/doacoes/${id}/cancelar`);

    // Quando uma ONG tenta aceitar essa doação já cancelada
    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG Bom Prato' });

    // Então o sistema recusa a operação com status 400 e informa que a doação foi cancelada
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Não é possível aceitar uma doação que foi cancelada.');
  });

  // B2 - Casos limite e de erro não previstos no critério original
  it('recusa cancelar novamente uma doação que já foi cancelada anteriormente', async () => {
    // Dado que uma doação publicada já foi cancelada uma primeira vez
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Leite', quantidade: '6 litros', validade: '2026-11-20' });
    const id = criacao.body.id;

    const primeiroCancelamento = await request(app)
      .post(`/api/doacoes/${id}/cancelar`);
    expect(primeiroCancelamento.status).toBe(200);

    // Quando o doador repete a chamada de cancelamento para a mesma doação
    const segundoCancelamento = await request(app)
      .post(`/api/doacoes/${id}/cancelar`);

    // Então o sistema recusa a repetição com status 400 e mensagem específica
    expect(segundoCancelamento.status).toBe(400);
    expect(segundoCancelamento.body.erro).toBe('Esta doação já foi cancelada anteriormente.');
  });

  it('recusa cancelar uma doação quando o identificador não existe no banco', async () => {
    // Dado que não existe nenhuma doação cadastrada com o identificador 9999
    // Quando a API recebe pedido de cancelamento para esse identificador inexistente
    const res = await request(app)
      .post('/api/doacoes/9999/cancelar');

    // Então o sistema recusa com status 400 e mensagem indicando que a doação não foi encontrada
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Doação não encontrada.');
  });

  it('recusa cancelar uma doação quando o identificador informado na rota é inválido', async () => {
    // Dado que o identificador enviado na rota não é um número inteiro positivo válido
    // Quando a API recebe a requisição de cancelamento com identificador textual inválido
    const res = await request(app)
      .post('/api/doacoes/id-invalido/cancelar');

    // Então o sistema recusa imediatamente com status 400 e mensagem de identificador inválido
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Identificador de doação inválido.');
  });
});
