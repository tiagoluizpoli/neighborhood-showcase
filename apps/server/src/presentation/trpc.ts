import { initTRPC, TRPCError } from '@trpc/server';
import type { Provider } from '../domain/entities/provider.entity';
import { createAuthGuardDependencies } from '../main/di/auth-guard';
import { DomainError } from '../shared/domain-error';
import type { Context } from './context';

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const isDomainError =
      error.cause instanceof DomainError || error instanceof DomainError;
    if (isDomainError) {
      const message =
        error.cause instanceof DomainError
          ? error.cause.message
          : error.message;
      return {
        ...shape,
        message,
        data: {
          ...shape.data,
          code: 'BAD_REQUEST',
          httpStatus: 400,
        },
      };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      cause: 'No session',
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (
    ctx.session.user.role !== 'SYSTEM_MANAGER' &&
    ctx.session.user.role !== 'ADMINISTRATOR'
  ) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Apenas administradores globais podem realizar esta ação.',
    });
  }
  return next();
});

// --- Provider-scoped authorization guard (T-20-04) ---
//
// Two layers of provider-scoped authorization:
//   1. Ownership      — `provider.ownerId === userId`. Required for EVERY
//      provider-scoped action (read or mutate). A user can never touch a
//      provider they do not own, and cannot reuse one provider's standing to
//      act on another (the guard always resolves the SPECIFIC target provider).
//   2. APPROVED standing — the provider has an APPROVED resident assignment.
//      Required only for actions whose effect depends on the provider being an
//      accepted resident of its condo (e.g. publishing announcements).
//
// The guard resolves the concrete target `provider.id`; soft-deleted providers
// are already excluded by `ProviderRepository.findById`. Repositories are wired
// here through the composition root so the presentation layer never imports
// infrastructure directly. This helper is the single enforcement point applied
// across provider routers in ST-02.

const authGuardDependencies = createAuthGuardDependencies();

export interface ProviderIdentityInput {
  providerId: string;
  userId: string;
}

export interface ProviderScopedAccessInput extends ProviderIdentityInput {
  // When true, also requires the provider to hold an APPROVED resident
  // assignment. When false, ownership alone is sufficient.
  requireApprovedAssignment: boolean;
}

export async function assertProviderScopedAccess(
  input: ProviderScopedAccessInput,
): Promise<Provider> {
  const provider = await authGuardDependencies.providerRepository.findById(
    input.providerId,
  );
  if (!provider) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Provedor não encontrado.',
    });
  }
  if (!provider.isOwnedBy(input.userId)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Você não tem permissão para acessar este provedor.',
    });
  }
  if (input.requireApprovedAssignment) {
    const hasApprovedAssignment =
      await authGuardDependencies.assignmentRepository.hasApprovedResidentAssignment(
        input.providerId,
      );
    if (!hasApprovedAssignment) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          'Este provedor não possui um vínculo de residente aprovado para esta ação.',
      });
    }
  }
  return provider;
}

// Ownership-only check: the caller owns the target provider. Use for reads and
// mutations that do not depend on APPROVED residency standing.
export function assertProviderOwnership(
  input: ProviderIdentityInput,
): Promise<Provider> {
  return assertProviderScopedAccess({
    providerId: input.providerId,
    userId: input.userId,
    requireApprovedAssignment: false,
  });
}

// Ownership + APPROVED standing check. Use for actions that require the provider
// to be an accepted resident of its condo (e.g. publishing announcements).
export function assertProviderApprovedStanding(
  input: ProviderIdentityInput,
): Promise<Provider> {
  return assertProviderScopedAccess({
    providerId: input.providerId,
    userId: input.userId,
    requireApprovedAssignment: true,
  });
}
