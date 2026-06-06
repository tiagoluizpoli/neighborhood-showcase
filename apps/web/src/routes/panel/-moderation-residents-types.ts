export interface ModerationPendingResident {
  id: string;
  proofOfResidency?: string | null;
  provider?: {
    name: string | null;
  } | null;
  unitInfo?: string | null;
}
