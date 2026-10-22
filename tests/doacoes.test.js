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
// Cada `it.todo` é um critério de aceite ainda não implementado — o CI não
// falha por causa deles. À medida que o grupo implementa, troque `it.todo`
// por um `it` de verdade (veja o exemplo comentado no fim do arquivo).
//
// Os testes abaixo usam o banco — que na Unidade 1 é SQLite em memória:
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
