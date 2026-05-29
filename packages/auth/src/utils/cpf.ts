import { createHash } from 'node:crypto';

/**
 * Validates a CPF mathematically.
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cleanCPF.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) {
    rev = 0;
  }
  if (rev !== Number(cleanCPF.charAt(9))) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cleanCPF.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) {
    rev = 0;
  }
  if (rev !== Number(cleanCPF.charAt(10))) {
    return false;
  }

  return true;
}

/**
 * Hashes a cleaned CPF using SHA-256.
 */
export function hashCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  return createHash('sha256').update(cleanCPF).digest('hex');
}
