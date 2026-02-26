"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ViewMode } from "./ViewToggle";

interface DashboardState {
  memberModalId: string | null;
  setMemberModalId: (id: string | null) => void;
  showAvatar: boolean;
  setShowAvatar: (show: boolean) => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  rootId: string | null;
  setRootId: (id: string | null) => void;
}

export const DashboardContext = createContext<DashboardState | undefined>(
  undefined,
);

const useIsClient = () => {
  const [isClient, setIsClient] = useState(false)
 
  useEffect(() => {
    setIsClient(true)
  }, [])
 
  return isClient
}

export const DashboardProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const searchParams = useSearchParams();
  const [memberModalId, setMemberModalId] = useState<string | null>(null);
  const [showAvatar, setShowAvatar] = useState<boolean>(true);
  
  const viewParam = searchParams.get("view") as ViewMode;
  const [view, setView] = useState<ViewMode>(viewParam || "list");
  const [rootId, setRootId] = useState<string | null>(null);
  
  const isClient = useIsClient();

  useEffect(() => {
    if (viewParam) {
      setView(viewParam);
    }
  }, [viewParam]);

  const value = {
    memberModalId,
    setMemberModalId,
    showAvatar,
    setShowAvatar,
    view,
    setView,
    rootId,
    setRootId,
  };

  return (
    <DashboardContext.Provider value={value}>
      {isClient ? children : null}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
