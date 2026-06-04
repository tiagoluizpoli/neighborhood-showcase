import type { Condominium } from '../../../domain/entities/condominium.entity';
import type { CondominiumRepository } from '../../../domain/repositories/condominium.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type {
  RejectCondominiumInput,
  RejectCondominiumUseCase,
} from '../../../domain/use-cases/condominium/reject-condominium.use-case';
import { DomainError } from '../../../shared/domain-error';

export class RejectReasonRequiredError extends DomainError {
  constructor() {
    super('O motivo da rejeição é obrigatório.');
  }
}

export class CondominiumNotFoundError extends DomainError {
  constructor() {
    super('Condomínio não encontrado.');
  }
}

export class CondominiumNotPendingError extends DomainError {
  constructor() {
    super('Este condomínio não está pendente de aprovação.');
  }
}

export const mockEmailService = {
  sendEmail: async (input: { to: string; subject: string; html: string }) => {
    console.log(`[MOCK EMAIL] To: ${input.to}`);
    console.log(`[MOCK EMAIL] Subject: ${input.subject}`);
    console.log(`[MOCK EMAIL] Body: ${input.html}`);
  },
};

export class RejectCondominium implements RejectCondominiumUseCase {
  constructor(
    private readonly condoRepo: CondominiumRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(input: RejectCondominiumInput): Promise<Condominium> {
    if (!input.reason.trim()) {
      throw new RejectReasonRequiredError();
    }

    const condo = await this.condoRepo.findById(input.id);
    if (!condo) {
      throw new CondominiumNotFoundError();
    }

    if (condo.status !== 'PENDING_APPROVAL') {
      throw new CondominiumNotPendingError();
    }

    // Reject the condominium
    const rejectedCondo = await this.condoRepo.updateStatus(
      input.id,
      'REJECTED',
    );

    // Get the creator's email to send the notification
    const creator = await this.userRepo.findById(condo.createdBy);

    if (creator?.email) {
      await mockEmailService.sendEmail({
        to: creator.email,
        subject: `Cadastro de Condomínio Rejeitado - ${condo.name}`,
        html: `
          <p>Olá, ${creator.name || 'Provedor'}.</p>
          <p>Sua solicitação para cadastrar o condomínio <strong>${condo.name}</strong> foi analisada e rejeitada.</p>
          <p><strong>Motivo da rejeição:</strong> ${input.reason.trim()}</p>
          <p>Se você acredita que isso foi um engano ou deseja reenviar com correções, acesse o painel e solicite novamente.</p>
          <br/>
          <p>Atenciosamente,</p>
          <p>Administração - Neighborhood Showcase</p>
        `,
      });
    }

    return rejectedCondo;
  }
}
