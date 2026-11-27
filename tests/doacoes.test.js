import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar, query } from '../src/db.js';

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
// Testes de integração da API sobre PostgreSQL.
// ---------------------------------------------------------------------------

describe('publicar e listar doações', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
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
      .send({
        doador: 'Restaurante Bom Prato',
        tipo: 'Sopa',
        quantidade: '10 porções',
        validade: '2026-08-01'
      });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].doador).toBe('Restaurante Bom Prato');
    expect(res.body[0].tipo).toBe('Sopa');
    expect(res.body[0].status).toBe('disponivel');
  });
});

describe('aceitar uma doação', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  it('3. marca a doação como aceita pela ONG', async () => {
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({
        doador: 'Restaurante Bom Prato',
        tipo: 'Bolo',
        quantidade: '2 unidades',
        validade: '2026-08-02'
      });
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
      .send({
        doador: 'Restaurante Bom Prato',
        tipo: 'Arroz',
        quantidade: '5 kg',
        validade: '2026-08-03'
      });
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
      .send({
        doador: 'Restaurante Bom Prato',
        tipo: 'Bolo',
        quantidade: '1 bolo',
        validade: '2026-08-04'
      });
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

describe('H1 — o doador acompanha as suas doações', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  it('H1 CA1: lista as doações do doador com situação disponível e aceita pela ONG', async () => {
    const d1 = await request(app)
      .post('/api/doacoes')
      .send({
        doador: 'Padaria Pão Bom',
        tipo: 'Pão Francês',
        quantidade: '30 unidades',
        validade: '2026-12-10'
      });
    expect(d1.status).toBe(201);

    const d2 = await request(app)
      .post('/api/doacoes')
      .send({
        doador: 'Padaria Pão Bom',
        tipo: 'Bolo de Milho',
        quantidade: '4 unidades',
        validade: '2026-12-11'
      });
    expect(d2.status).toBe(201);

    const aceite = await request(app)
      .post(`/api/doacoes/${d2.body.id}/aceitar`)
      .send({ ong: 'Casa Esperança' });
    expect(aceite.status).toBe(200);

    const consulta = await request(app)
      .get('/api/minhas-doacoes?doador=Padaria%20P%C3%A3o%20Bom');

    expect(consulta.status).toBe(200);
    expect(consulta.body).toHaveLength(2);

    const disponivel = consulta.body.find((item) => item.id === d1.body.id);
    const aceita = consulta.body.find((item) => item.id === d2.body.id);

    expect(disponivel).toMatchObject({
      doador: 'Padaria Pão Bom',
      tipo: 'Pão Francês',
      status: 'disponivel',
      situacao: 'disponivel'
    });
    expect(aceita).toMatchObject({
      doador: 'Padaria Pão Bom',
      tipo: 'Bolo de Milho',
      status: 'aceita',
      ong: 'Casa Esperança',
      situacao: 'aceita por Casa Esperança'
    });
  });

  it('H1 CA2: não exibe doações publicadas por outros doadores', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({
        doador: 'Padaria Pão Bom',
        tipo: 'Pão Integral',
        quantidade: '12 pacotes',
        validade: '2026-12-12'
      });

    await request(app)
      .post('/api/doacoes')
      .send({
        doador: 'Restaurante Sabor Caseiro',
        tipo: 'Marmitas',
        quantidade: '15 unidades',
        validade: '2026-12-12'
      });

    const consulta = await request(app)
      .get('/api/minhas-doacoes?doador=Padaria%20P%C3%A3o%20Bom');

    expect(consulta.status).toBe(200);
    expect(consulta.body).toHaveLength(1);
    expect(consulta.body[0].doador).toBe('Padaria Pão Bom');
    expect(consulta.body[0].tipo).toBe('Pão Integral');
  });

  it('H1 CA3: recusa publicação quando o doador não é informado e não grava nada', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão', quantidade: '20 unidades', validade: '2026-12-10' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('O nome do doador é obrigatório.');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.status).toBe(200);
    expect(lista.body).toEqual([]);
  });

  it('H1 limite: recusa doador preenchido apenas com espaços em branco', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ doador: '   ', tipo: 'Pão', quantidade: '20 unidades', validade: '2026-12-10' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('O nome do doador é obrigatório.');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.status).toBe(200);
    expect(lista.body).toEqual([]);
  });

  it('H1 limite: doações antigas sem doador identificado não aparecem na consulta', async () => {
    await query(
      'INSERT INTO doacoes (tipo, quantidade, validade) VALUES ($1, $2, $3)',
      ['Frutas da Estação', '8 kg', '2026-12-15']
    );

    const consultaPadrao = await request(app)
      .get('/api/minhas-doacoes?doador=Doador%20n%C3%A3o%20informado');
    expect(consultaPadrao.status).toBe(200);
    expect(consultaPadrao.body).toEqual([]);

    const consultaSemParametro = await request(app).get('/api/minhas-doacoes');
    expect(consultaSemParametro.status).toBe(400);
    expect(consultaSemParametro.body.erro).toBe('Informe o nome do doador para consultar.');
  });
});

afterAll(async () => {
  await encerrar();
});
