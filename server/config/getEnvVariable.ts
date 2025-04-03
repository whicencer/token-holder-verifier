import 'dotenv/config';

export function getEnvVariable(variable: string) {
  if (!process.env[variable]) {
    throw new Error(`Missing environment variable: ${variable}`);
  }

  return process.env[variable];
}