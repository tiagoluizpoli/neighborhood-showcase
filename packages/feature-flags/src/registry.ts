export const FLAGS = {
  /**
   * When enabled, sidebar groups can be collapsed/expanded by clicking
   * the group label. State is persisted per group to localStorage.
   *
   * Default: false (groups always expanded — current behavior).
   */
  sidebar_collapsible_groups: false,
} as const;

export type FlagName = keyof typeof FLAGS;
