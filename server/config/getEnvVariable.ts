import 'dotenv/config';

export function getEnvVariable(variable: string): string {
  const value = process.env[variable];
  if (!value) {
    throw new Error(`Missing environment variable: ${variable}`);
  }
  
  return value;
}