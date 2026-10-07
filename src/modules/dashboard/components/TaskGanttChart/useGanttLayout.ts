import { useEffect, useState } from "react";
import { BASE_COL_WIDTH, LEFT_PANEL_WIDTH, ROW_HEIGHT } from "../ganttConstants";

export type GanttLayout = {
  screenWidth: number;
  isMobile: boolean;
  isTablet: boolean;
  colWidth: number;
  leftPanelWidth: number;
  rowHeight: number;
};

export function useGanttLayout(zoomLevel: number): GanttLayout {
  const [screenWidth, setScreenWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;
  const responsiveColWidth = isMobile ? 32 : isTablet ? 40 : BASE_COL_WIDTH;

  return {
    screenWidth,
    isMobile,
    isTablet,
    colWidth: responsiveColWidth * zoomLevel,
    leftPanelWidth: isMobile ? 0 : isTablet ? 220 : LEFT_PANEL_WIDTH,
    rowHeight: isMobile ? 52 : isTablet ? 60 : ROW_HEIGHT,
  };
}
