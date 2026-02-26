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
  
  // Tạm thời để mặc định là list, sẽ được cập nhật ngay lập tức bởi useEffect bên dưới
  const [view, setViewInternal] = useState<ViewMode>("list");
  const [rootId, setRootId] = useState<string | null>(null);
  
  const isClient = useIsClient();

  // BỘ NÃO GHI NHỚ LỰA CHỌN CỦA NGƯỜI DÙNG
  useEffect(() => {
    // 1. Nếu trên thanh địa chỉ có sẵn lệnh (?view=...) thì ưu tiên dùng nó và lưu vào sổ
    if (viewParam) {
      setViewInternal(viewParam);
      localStorage.setItem("dashboard_view_memory", viewParam);
    } else {
      // 2. Nếu không có, mở "sổ tay" (localStorage) ra kiểm tra xem lần trước đang xem gì
      const savedView = localStorage.getItem("dashboard_view_memory") as ViewMode;
      if (savedView) {
        setViewInternal(savedView); // Khôi phục lại đúng tab đó
      }
    }
  }, [viewParam]);

  // Hàm setView mới: Vừa đổi giao diện, vừa ghi nhớ vào sổ tay
  const setView = (newView: ViewMode) => {
    setViewInternal(newView);
    localStorage.setItem("dashboard_view_memory", newView);
  };

  const value = {
    memberModalId,
    setMemberModalId,
    showAvatar,
    setShowAvatar,
    view,
    setView, // Sử dụng hàm setView thông minh ở trên
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
