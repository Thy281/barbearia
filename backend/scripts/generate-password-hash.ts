import { createHmac } from 'crypto';
const password = process.argv[2];
if (!password) throw new Error('Informe a senha: bun scripts/generate-password-hash.ts sua-senha');
const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret) throw new Error('Defina ADMIN_SESSION_SECRET antes de gerar o hash.');
console.log(createHmac('sha256', secret).update(password).digest('hex'));
