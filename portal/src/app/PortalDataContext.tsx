import { createContext, useContext, type ReactNode } from "react";
import type { KnowledgeNode, PortalStats, SectionIndex } from "../types";

export type PortalData = {
  nodes: KnowledgeNode[];
  stats: PortalStats;
  sections: SectionIndex["sections"];
};

const PortalDataContext = createContext<PortalData | null>(null);

export function PortalDataProvider({
  value,
  children,
}: {
  value: PortalData;
  children: ReactNode;
}) {
  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData() {
  const value = useContext(PortalDataContext);
  if (!value) {
    throw new Error("Portal data is not available.");
  }
  return value;
}
