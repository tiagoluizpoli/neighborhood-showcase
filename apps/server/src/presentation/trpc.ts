import { initTRPC, TRPCError } from '@trpc/server';
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
  if (ctx.session.user.role !== 'SYSTEM_MANAGER') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Apenas administradores globais podem realizar esta ação.',
    });
  }
  return next();
});
