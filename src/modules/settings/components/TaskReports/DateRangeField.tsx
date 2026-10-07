import { useEffect, useRef, useState } from "react";
import { FormControl, MenuItem, Select } from "@mui/material";
import { FiCalendar } from "react-icons/fi";
import AppCalendar from "../../../../shared/components/Calendar/AppCalendar";
import { CUSTOM, MAX_RANGE_DAYS, RANGES, fmtRange, inputSx, valueSx } from "./constants";

type Props = {
  rangeKey: string;
  onRangeKeyChange: (key: string) => void;
  customFrom: Date | null;
  customTo: Date | null;
  onCustomChange: (start: Date | null, end: Date | null) => void;
  customReady: boolean;
  today: Date;
  onTooLong: (message: string) => void;
};

const DateRangeField = ({
  rangeKey,
  onRangeKeyChange,
  customFrom,
  customTo,
  onCustomChange,
  customReady,
  today,
  onTooLong,
}: Props) => {
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLLabelElement | null>(null);

  useEffect(() => {
    if (!calOpen) return;
    const away = (e: MouseEvent) => {
      if (!calRef.current?.contains(e.target as Node)) setCalOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCalOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [calOpen]);

  return (
    <label className="tr-field" ref={calRef}>
      <span className="tr-field__label">
        Date range
        {rangeKey === CUSTOM && (
          <button
            type="button"
            className="tr-cal__toggle"
            onClick={() => setCalOpen((o) => !o)}
          >
            <FiCalendar size={11} />
            {customReady ? "Change dates" : "Choose dates"}
          </button>
        )}
      </span>
      <FormControl fullWidth size="small" sx={inputSx}>
        <Select
          displayEmpty
          value={rangeKey}
          onChange={(e) => {
            const next = String(e.target.value);
            onRangeKeyChange(next);
            setCalOpen(next === CUSTOM);
          }}
          renderValue={(v) =>
            v === CUSTOM
              ? customReady
                ? fmtRange(customFrom as Date, customTo as Date)
                : "Pick two dates…"
              : RANGES.find((r) => r.key === v)?.label || "Select Date Range"
          }
          sx={valueSx(rangeKey !== CUSTOM || customReady)}
        >
          {RANGES.map((r) => (
            <MenuItem key={r.key} value={r.key}>{r.label}</MenuItem>
          ))}
          <MenuItem value={CUSTOM}>Custom range…</MenuItem>
        </Select>
      </FormControl>

      {calOpen && (
        <div className="tr-cal">
          <AppCalendar
            range
            startDate={customFrom}
            endDate={customTo}
            maxDate={today}
            onChange={([start, end]) => {
              if (start && end) {
                const span = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
                if (span > MAX_RANGE_DAYS) {
                  onTooLong(`Pick ${MAX_RANGE_DAYS} days or fewer`);
                  return;
                }
              }
              onCustomChange(start, end);
              if (start && end) setCalOpen(false);
            }}
          />
        </div>
      )}
    </label>
  );
};

export default DateRangeField;
