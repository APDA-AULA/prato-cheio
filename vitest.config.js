import { existsSync } from 'node:fs';

if (existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignora erro caso .env local não possa ser carregado.
  }
}

export default {
  test: {
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ||
        process.env.DATABASE_URL ||
        'postgres://pratocheio:pratocheio@localhost:5432/pratocheio_test'
    }
  }
};
