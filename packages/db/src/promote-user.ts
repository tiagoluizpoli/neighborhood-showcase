import { eq } from 'drizzle-orm';
import { createDb } from './index';
import { user } from './schema/auth';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Por favor, informe o e-mail do usuário. Exemplo:');
    console.error(
      'bun run packages/db/src/promote-user.ts admin@example.com\n',
    );
    process.exit(1);
  }

  console.log(`Buscando e promovendo usuário: ${email}...`);
  const db = createDb();

  try {
    const updated = await db
      .update(user)
      .set({ role: 'SYSTEM_MANAGER' })
      .where(eq(user.email, email))
      .returning();

    if (updated.length === 0) {
      console.error(
        `Erro: Nenhum usuário encontrado com o e-mail "${email}". Certifique-se de que ele já se cadastrou.`,
      );
      process.exit(1);
    }

    console.log(
      `Sucesso! O usuário "${email}" agora é um SYSTEM_MANAGER (Administrador).`,
    );
    process.exit(0);
  } catch (error) {
    console.error('Erro ao promover usuário:', error);
    process.exit(1);
  }
}

main();
