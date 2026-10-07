import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ViewMode } from "../../../types/GanttChart";
import { buildMonthRange, colsInMonth, type BaseRange } from "./ganttColumns";

/**
 * Month range that grows as the timeline is scrolled toward either edge, plus the
 * month currently centred in view. Wheel scrolls horizontally.
 */
export function useTimelineScroll(
  viewMode: ViewMode,
  baseRange: BaseRange,
  colWidth: number,
  now: Date,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const [extraBefore, setExtraBefore] = useState(1);
  const [extraAfter, setExtraAfter] = useState(1);
  const [visibleMonth, setVisibleMonth] = useState(now.getMonth());
  const [visibleYear, setVisibleYear] = useState(now.getFullYear());
  const isExtendingRef = useRef(false);
  const scrollAdjustRef = useRef(0);
  const hasInitialScrolled = useRef(false);

  const monthRange = useMemo(
    () => (viewMode === "Year" ? [] : buildMonthRange(baseRange, extraBefore, extraAfter)),
    [baseRange, extraBefore, extraAfter, viewMode],
  );

  useEffect(() => {
    setExtraBefore(1);
    setExtraAfter(1);
    hasInitialScrolled.current = false;
  }, [viewMode]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const monthRangeRef = useRef(monthRange);
  monthRangeRef.current = monthRange;
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  const colWidthRef = useRef(colWidth);
  colWidthRef.current = colWidth;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isExtendingRef.current) return;
    const threshold = 200;
    const mr = monthRangeRef.current;
    const vm = viewModeRef.current;
    const cw = colWidthRef.current;

    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - threshold) {
      isExtendingRef.current = true;
      setExtraAfter((prev) => prev + 1);
      setTimeout(() => { isExtendingRef.current = false; }, 200);
    }

    if (el.scrollLeft <= threshold && el.scrollLeft > 0) {
      isExtendingRef.current = true;
      const firstInRange = mr[0];
      if (firstInRange) {
        const prevDate = new Date(firstInRange.year, firstInRange.month - 1, 1);
        scrollAdjustRef.current =
          colsInMonth(vm, prevDate.getFullYear(), prevDate.getMonth()) * cw;
      }
      setExtraBefore((prev) => prev + 1);
    }

    const centerX = el.scrollLeft + el.clientWidth / 2;
    let acc = 0;
    for (const { year, month } of mr) {
      acc += colsInMonth(vm, year, month) * cw;
      if (centerX < acc) {
        setVisibleMonth((prev) => prev === month ? prev : month);
        setVisibleYear((prev) => prev === year ? prev : year);
        break;
      }
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || viewMode === "Year") return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [viewMode, handleScroll]);

  useLayoutEffect(() => {
    if (scrollAdjustRef.current > 0 && scrollRef.current) {
      scrollRef.current.scrollLeft += scrollAdjustRef.current;
      scrollAdjustRef.current = 0;
      setTimeout(() => { isExtendingRef.current = false; }, 200);
    }
  }, [extraBefore]);

  /** Scrolls the timeline to `left` and marks the given month as the visible one. */
  const showMonth = (year: number, month: number, left: number, smooth: boolean) => {
    if (smooth) scrollRef.current?.scrollTo({ left, behavior: "smooth" });
    else if (scrollRef.current) scrollRef.current.scrollLeft = left;
    setVisibleMonth(month);
    setVisibleYear(year);
  };

  return {
    scrollRef,
    leftPanelRef,
    monthRange,
    visibleMonth,
    visibleYear,
    showMonth,
    extendBefore: () => setExtraBefore((e) => e + 1),
    extendAfter: () => setExtraAfter((e) => e + 1),
    hasInitialScrolled,
  };
}
