import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { migrar, limparBanco, encerrar, query, ehBancoDeTeste } from '../src/db.js';

describe('trava de segurança do banco de dados (PostgreSQL)', () => {
  const envOriginal = { ...process.env };

  beforeEach(() => {
    process.env = { ...envOriginal };
  });

  afterEach(async () => {
    await encerrar();
    process.env = { ...envOriginal };
  });

  it('reconhece banco de teste quando NODE_ENV=test e DATABASE_URL aponta para banco de teste', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgres://pratocheio:pratocheio@localhost:5432/pratocheio_test';
    expect(ehBancoDeTeste()).toBe(true);
  });

  it('permite limparBanco() quando o banco em uso for o de teste', async () => {
    process.env.NODE_ENV = 'test';
    await encerrar();
    await migrar();
    await expect(limparBanco()).resolves.not.toThrow();
  });

  it('dado que NODE_ENV=production, quando limparBanco() é chamada, então falha e nenhuma doação é apagada', async () => {
    // 1. Configura ambiente de teste, limpa dados anteriores e insere um registro
    process.env.NODE_ENV = 'test';
    await encerrar();
    await migrar();
    await limparBanco();
    await query(
      'INSERT INTO doacoes (tipo, quantidade, validade) VALUES ($1, $2, $3)',
      ['Arroz', '5kg', '2026-12-31']
    );

    // 2. Simula que o ambiente aponta para produção
    process.env.NODE_ENV = 'production';

    // 3. A limpeza deve falhar com erro explicativo exato
    await expect(limparBanco()).rejects.toThrow(
      'Operação abortada: limparBanco() só pode ser executado em ambiente de teste e nunca no banco de dados real.'
    );

    // 4. Garante que nenhuma doação foi apagada
    process.env.NODE_ENV = 'test';
    const { rows } = await query('SELECT * FROM doacoes');
    expect(rows.length).toBe(1);
    expect(rows[0].tipo).toBe('Arroz');
  });

  it('recusa limparBanco() se DATABASE_URL apontar para o banco real (sem test no nome) mesmo em development ou test', async () => {
    process.env.DATABASE_URL = 'postgres://pratocheio:pratocheio@localhost:5432/pratocheio';

    process.env.NODE_ENV = 'development';
    expect(ehBancoDeTeste()).toBe(false);
    await expect(limparBanco()).rejects.toThrow(
      'Operação abortada: limparBanco() só pode ser executado em ambiente de teste e nunca no banco de dados real.'
    );

    process.env.NODE_ENV = 'test';
    expect(ehBancoDeTeste()).toBe(false);
    await expect(limparBanco()).rejects.toThrow(
      'Operação abortada: limparBanco() só pode ser executado em ambiente de teste e nunca no banco de dados real.'
    );
  });
});
