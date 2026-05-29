export interface AnnouncementForSort {
  id: string;
  condominiumId: string;
  condoCity: string;
  condoState: string;
  title: string;
  subtitle?: string | null;
  description: string;
  category: string;
  showVerifiedBadge: boolean;
  createdAt: string | Date;
}

export interface FilterOptions {
  category: string;
  search: string;
  verifiedOnly: boolean;
}

/**
 * Sorts announcements based on geolocation/selected condo proximity.
 * Priority:
 * 1. Exact condominium match
 * 2. Same city and state match
 * 3. Newest first
 */
export function sortAnnouncements(
  announcements: AnnouncementForSort[],
  targetCondoId?: string,
  userCity?: string,
  userState?: string,
): AnnouncementForSort[] {
  const list = [...announcements];

  return list.sort((a, b) => {
    // 1. Exact condo match
    if (targetCondoId) {
      const aExact = a.condominiumId === targetCondoId;
      const bExact = b.condominiumId === targetCondoId;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
    }

    // 2. City & State match
    if (userCity && userState) {
      const aCityMatch =
        a.condoCity.toLowerCase() === userCity.toLowerCase() &&
        a.condoState.toLowerCase() === userState.toLowerCase();
      const bCityMatch =
        b.condoCity.toLowerCase() === userCity.toLowerCase() &&
        b.condoState.toLowerCase() === userState.toLowerCase();
      if (aCityMatch && !bCityMatch) return -1;
      if (!aCityMatch && bCityMatch) return 1;
    }

    // 3. Newest first
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

/**
 * Filters announcements based on search term, category tabs, and verified badge.
 */
export function filterAnnouncements(
  announcements: AnnouncementForSort[],
  options: FilterOptions,
): AnnouncementForSort[] {
  return announcements.filter((ad) => {
    // Category filter
    if (options.category && options.category !== 'Todos') {
      if (ad.category !== options.category) return false;
    }

    // Verified only filter
    if (options.verifiedOnly && !ad.showVerifiedBadge) {
      return false;
    }

    // Search filter (title, subtitle, description)
    if (options.search) {
      const query = options.search.toLowerCase();
      const titleMatch = ad.title.toLowerCase().includes(query);
      const subtitleMatch = ad.subtitle?.toLowerCase().includes(query) ?? false;
      const descMatch = ad.description.toLowerCase().includes(query);
      if (!titleMatch && !subtitleMatch && !descMatch) {
        return false;
      }
    }

    return true;
  });
}
