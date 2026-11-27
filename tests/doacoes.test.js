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

describe('H2 — o voluntário confirma a coleta', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  it('H2 CA1: confirma a coleta de doação aceita registrando voluntário e horário', async () => {
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({
        doador: 'Padaria Pão Bom',
        tipo: 'Sopa de Legumes',
        quantidade: '15 porções',
        validade: '2026-12-20'
      });
    expect(criacao.status).toBe(201);
    const id = criacao.body.id;

    const aceite = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'Casa Esperança' });
    expect(aceite.status).toBe(200);

    const coleta = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ voluntario: 'Rui' });

    expect(coleta.status).toBe(200);
    expect(coleta.body.status).toBe('coletada');
    expect(coleta.body.ong).toBe('Casa Esperança');
    expect(coleta.body.voluntario).toBe('Rui');
    expect(coleta.body.coletada_em).toBeTruthy();
    expect(Number.isNaN(Date.parse(coleta.body.coletada_em))).toBe(false);
    expect(Date.parse(coleta.body.coletada_em)).toBeGreaterThanOrEqual(
      Date.parse(coleta.body.criada_em)
    );
  });

  it('H2 CA2: recusa confirmar coleta de doação ainda disponível e não altera a doação', async () => {
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({
        doador: 'Padaria Pão Bom',
        tipo: 'Pão Francês',
        quantidade: '20 unidades',
        validade: '2026-12-20'
      });
    expect(criacao.status).toBe(201);
    const id = criacao.body.id;

    const coleta = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ voluntario: 'Rui' });

    expect(coleta.status).toBe(400);
    expect(coleta.body.erro).toBe('Só é possível confirmar a coleta de uma doação aceita.');

    const disponiveis = await request(app).get('/api/doacoes');
    expect(disponiveis.status).toBe(200);
    const doacao = disponiveis.body.find((item) => item.id === id);
    expect(doacao).toMatchObject({
      id,
      status: 'disponivel',
      ong: null,
      voluntario: null,
      coletada_em: null
    });
  });

  it('H2 CA3: exibe a doação como coletada quando o doador consulta suas doações', async () => {
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({
        doador: 'Padaria Pão Bom',
        tipo: 'Marmitas',
        quantidade: '12 unidades',
        validade: '2026-12-21'
      });
    expect(criacao.status).toBe(201);
    const id = criacao.body.id;

    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'Casa Esperança' });

    await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ voluntario: 'Rui' });

    const consulta = await request(app)
      .get('/api/minhas-doacoes?doador=Padaria%20P%C3%A3o%20Bom');

    expect(consulta.status).toBe(200);
    expect(consulta.body).toHaveLength(1);
    expect(consulta.body[0]).toMatchObject({
      id,
      doador: 'Padaria Pão Bom',
      status: 'coletada',
      situacao: 'coletada',
      ong: 'Casa Esperança',
      voluntario: 'Rui'
    });
    expect(consulta.body[0].coletada_em).toBeTruthy();
  });

  it('H2 limite: recusa confirmar duas vezes a mesma coleta preservando voluntário e horário originais', async () => {
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({
        doador: 'Padaria Pão Bom',
        tipo: 'Frutas',
        quantidade: '10 kg',
        validade: '2026-12-22'
      });
    const id = criacao.body.id;

    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'Casa Esperança' });

    const primeira = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ voluntario: 'Rui' });
    expect(primeira.status).toBe(200);

    const segunda = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ voluntario: 'Outro Voluntário' });
    expect(segunda.status).toBe(400);
    expect(segunda.body.erro).toBe('Doação já foi coletada.');

    const consulta = await request(app)
      .get('/api/minhas-doacoes?doador=Padaria%20P%C3%A3o%20Bom');
    expect(consulta.status).toBe(200);
    expect(consulta.body[0].status).toBe('coletada');
    expect(consulta.body[0].voluntario).toBe('Rui');
    expect(consulta.body[0].coletada_em).toBe(primeira.body.coletada_em);
  });

  it('H2 limite: recusa confirmar coleta sem informar o nome do voluntário', async () => {
    const criacao = await request(app)
      .post('/api/doacoes')
      .send({
        doador: 'Padaria Pão Bom',
        tipo: 'Arroz e Feijão',
        quantidade: '8 marmitas',
        validade: '2026-12-23'
      });
    const id = criacao.body.id;

    await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'Casa Esperança' });

    const semNome = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({});
    expect(semNome.status).toBe(400);
    expect(semNome.body.erro).toBe('O nome do voluntário é obrigatório.');

    const apenasEspacos = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ voluntario: '   ' });
    expect(apenasEspacos.status).toBe(400);
    expect(apenasEspacos.body.erro).toBe('O nome do voluntário é obrigatório.');

    const consulta = await request(app)
      .get('/api/minhas-doacoes?doador=Padaria%20P%C3%A3o%20Bom');
    expect(consulta.status).toBe(200);
    expect(consulta.body[0]).toMatchObject({
      id,
      status: 'aceita',
      situacao: 'aceita por Casa Esperança',
      voluntario: null,
      coletada_em: null
    });
  });

  it('H2 limite: recusa confirmar coleta de doação inexistente', async () => {
    const res = await request(app)
      .post('/api/doacoes/9999/coletar')
      .send({ voluntario: 'Rui' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Doação não encontrada.');
  });
});

afterAll(async () => {
  await encerrar();
});
