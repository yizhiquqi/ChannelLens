import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadPartners, loadReviews, loadRelationships } from '../lib/csvLoader';
import { fetchPartnerVisibilityOverrides, fetchPublicAdminPartners, isSupabaseConfigured } from '../lib/database';
import type { Partner, CooperationReview, PartnerRelationship } from '../types';

interface CSVDataState {
  partners: Partner[];
  reviews: CooperationReview[];
  relationships: PartnerRelationship[];
  loading: boolean;
  error: string | null;
}

const CSVDataContext = createContext<CSVDataState>({
  partners: [],
  reviews: [],
  relationships: [],
  loading: true,
  error: null,
});

export function CSVDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CSVDataState>({
    partners: [],
    reviews: [],
    relationships: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    Promise.all([loadPartners(), loadReviews(), loadRelationships()])
      .then(([partners, reviews, relationships]) => {
        if (!isSupabaseConfigured) {
          setState({ partners, reviews, relationships, loading: false, error: null });
          return;
        }

        Promise.all([fetchPublicAdminPartners<Partner>(), fetchPartnerVisibilityOverrides()])
          .then(([adminPartners, visibilityOverrides]) => {
            const visibilityMap = new Map(visibilityOverrides.map((item) => [item.id, item.visibility]));
            const publicAdminPartners = adminPartners.filter((partner) => partner.adminVisibility === 'public');
            const visibleCsvPartners = partners.filter((partner) => visibilityMap.get(partner.id) !== 'internal');
            const seen = new Set<string>();
            const mergedPartners = [...publicAdminPartners, ...visibleCsvPartners].filter((partner) => {
              if (seen.has(partner.id)) return false;
              seen.add(partner.id);
              return true;
            });
            setState({ partners: mergedPartners, reviews, relationships, loading: false, error: null });
          })
          .catch(() => {
            setState({ partners, reviews, relationships, loading: false, error: null });
          });
      })
      .catch(() => {
        setState({
          partners: [],
          reviews: [],
          relationships: [],
          loading: false,
          error: 'CSV 数据加载失败，请检查文件路径和 UTF-8 编码',
        });
      });
  }, []);

  return <CSVDataContext.Provider value={state}>{children}</CSVDataContext.Provider>;
}

export function useCSVData() {
  return useContext(CSVDataContext);
}
