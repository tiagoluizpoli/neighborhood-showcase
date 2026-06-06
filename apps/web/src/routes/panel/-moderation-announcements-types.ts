export interface ModerationAnnouncement {
  category: string;
  description: string;
  flaggedForReview: boolean;
  id: string;
  imageUrl: string;
  providerName: string;
  status: string;
  suspensionReason: string | null;
  title: string;
}
