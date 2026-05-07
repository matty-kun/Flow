import React, { createContext, useContext, useState } from "react";

const SummaryVisibleContext = createContext<{
  isSummaryVisible: boolean;
  setIsSummaryVisible: (v: boolean) => void;
}>({ isSummaryVisible: false, setIsSummaryVisible: () => {} });

export function SummaryVisibleProvider({ children }: { children: React.ReactNode }) {
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  return (
    <SummaryVisibleContext.Provider value={{ isSummaryVisible, setIsSummaryVisible }}>
      {children}
    </SummaryVisibleContext.Provider>
  );
}

export function useSummaryVisible() {
  return useContext(SummaryVisibleContext);
}
