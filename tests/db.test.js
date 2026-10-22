import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { migrar, limparBanco, encerrar, query, ehBancoDeTeste } from '../src/db.js';

describe('trava de segurança do banco de dados (Etapa 4b)', () => {
  const envOriginal = { ...process.env };

  beforeEach(async () => {
    process.env = { ...envOriginal };
  });

  afterEach(async () => {
    await encerrar();
    process.env = { ...envOriginal };
  });

  it('reconhece banco de teste quando DATABASE_FILE for :memory:', () => {
    process.env.DATABASE_FILE = ':memory:';
    process.env.NODE_ENV = 'test';
    expect(ehBancoDeTeste()).toBe(true);
  });

  it('permite limparBanco() quando o banco em uso for o de teste (:memory:)', async () => {
    process.env.DATABASE_FILE = ':memory:';
    process.env.NODE_ENV = 'test';
    await encerrar();
    await migrar();
    await expect(limparBanco()).resolves.not.toThrow();
  });

  it('dado que o banco em uso não é o de teste (produção), quando a limpeza é chamada, então ela falha e nenhuma doação é apagada', async () => {
    // 1. Configura ambiente de teste e insere um registro real
    process.env.DATABASE_FILE = ':memory:';
    process.env.NODE_ENV = 'test';
    await encerrar();
    await migrar();
    await query("INSERT INTO doacoes (tipo, quantidade, validade) VALUES ('Arroz', '5kg', '2026-12-31')");

    // 2. Simula que a configuração aponta para produção
    process.env.NODE_ENV = 'production';

    // 3. A limpeza deve falhar com erro explicativo
    await expect(limparBanco()).rejects.toThrow(
      'Operação abortada: limparBanco() só pode ser executado em ambiente de teste e nunca no banco de dados real.'
    );

    // 4. Garante que nenhuma doação foi apagada
    process.env.NODE_ENV = 'test';
    const { rows } = await query('SELECT * FROM doacoes');
    expect(rows.length).toBe(1);
    expect(rows[0].tipo).toBe('Arroz');
  });

  it('recusa limpar o banco se DATABASE_FILE apontar para o arquivo real dados.sqlite fora do modo de teste', async () => {
    process.env.DATABASE_FILE = 'dados.sqlite';
    process.env.NODE_ENV = 'development';

    await expect(limparBanco()).rejects.toThrow(
      'Operação abortada: limparBanco() só pode ser executado em ambiente de teste e nunca no banco de dados real.'
    );
  });
});
