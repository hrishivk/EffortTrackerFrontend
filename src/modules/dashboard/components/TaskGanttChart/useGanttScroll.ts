import { useEffect, useLayoutEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { DayInfo, GroupedTaskRow } from "../../types";

type Params = {
  groupedRows: GroupedTaskRow[];
  rangeDays: DayInfo[];
  colWidth: number;
  extraBefore: number;
  setExtraBefore: Dispatch<SetStateAction<number>>;
  setExtraAfter: Dispatch<SetStateAction<number>>;
};

export function useGanttScroll({
  groupedRows, rangeDays, colWidth, extraBefore, setExtraBefore, setExtraAfter,
}: Params) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const isExtendingRef = useRef(false);
  const scrollAdjustRef = useRef(0);
  const hasInitialScrolled = useRef(false);

  useEffect(() => {
    if (!timelineRef.current || groupedRows.length === 0 || hasInitialScrolled.current) return;
    hasInitialScrolled.current = true;
    const firstStartIdx = Math.min(...groupedRows.map((r) => r.startIdx));
    timelineRef.current.scrollLeft = Math.max(0, firstStartIdx - 1) * colWidth;
  }, [groupedRows, colWidth]);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const handleEdgeScroll = () => {
      if (isExtendingRef.current) return;
      const threshold = 200;

      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - threshold) {
        isExtendingRef.current = true;
        setExtraAfter((prev) => prev + 1);
        setTimeout(() => { isExtendingRef.current = false; }, 200);
      }

      if (el.scrollLeft <= threshold && el.scrollLeft > 0) {
        isExtendingRef.current = true;
        if (rangeDays.length > 0) {
          const firstDay = rangeDays[0].date;
          const prevMonthEnd = new Date(firstDay.getFullYear(), firstDay.getMonth(), 0);
          scrollAdjustRef.current = prevMonthEnd.getDate() * colWidth;
        }
        setExtraBefore((prev) => prev + 1);
      }
    };

    el.addEventListener("scroll", handleEdgeScroll);
    return () => el.removeEventListener("scroll", handleEdgeScroll);
  }, [rangeDays, colWidth]);

  useLayoutEffect(() => {
    if (scrollAdjustRef.current > 0 && timelineRef.current) {
      timelineRef.current.scrollLeft += scrollAdjustRef.current;
      scrollAdjustRef.current = 0;
      setTimeout(() => { isExtendingRef.current = false; }, 200);
    }
  }, [extraBefore]);

  const handleTimelineScroll = () => {
    if (timelineRef.current && leftPanelRef.current) {
      leftPanelRef.current.scrollTop = timelineRef.current.scrollTop;
    }
  };
  const handleLeftScroll = () => {
    if (leftPanelRef.current && timelineRef.current) {
      timelineRef.current.scrollTop = leftPanelRef.current.scrollTop;
    }
  };

  return { timelineRef, leftPanelRef, handleTimelineScroll, handleLeftScroll };
}
