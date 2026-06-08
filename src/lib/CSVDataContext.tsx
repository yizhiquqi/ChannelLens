import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadPartners, loadReviews, loadRelationships } from '../lib/csvLoader';
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
        setState({ partners, reviews, relationships, loading: false, error: null });
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
