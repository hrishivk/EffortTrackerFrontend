import { useMemo } from "react";
import { FormControl, MenuItem, Select } from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * The app's calendar: react-datepicker, inline, under our own header.
 *
 * The header is ours so the month and year are the same MUI select the rest of
 * the forms use — react-datepicker's own `showMonthDropdown` renders a bare
 * native select that inherits nothing. The arrows stay for stepping one month
 * at a time.
 *
 * Only the calendar itself: where it sits (a dropdown under a field, a popover
 * in a dialog) is the caller's business. Styled by `.app-cal`.
 */

/** The same select the forms use, shrunk to sit in the calendar header. */
const headerSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "7px",
    backgroundColor: "var(--bg-card)",
    fontSize: 11.5,
    fontWeight: 600,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&:hover fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.12)",
    },
  },
  "& .MuiSelect-select": {
    padding: "4px 26px 4px 8px",
    color: "var(--text-primary)",
  },
  "& .MuiSelect-icon": { right: 3, color: "var(--text-muted)" },
};

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString(undefined, { month: "short" })
);

interface CommonProps {
  minDate?: Date;
  maxDate?: Date;
  /** Days to ring without selecting them — e.g. the date being replaced. */
  markedDates?: Date[];
  className?: string;
}

interface SingleProps extends CommonProps {
  range?: false;
  value: Date | null;
  onChange: (date: Date | null) => void;
}

interface RangeProps extends CommonProps {
  range: true;
  startDate: Date | null;
  endDate: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
}

export type AppCalendarProps = SingleProps | RangeProps;

export default function AppCalendar(props: AppCalendarProps) {
  const { minDate, maxDate, markedDates, className } = props;

  /**
   * The year menu covers exactly what can be picked: bounded by min/max when
   * given, otherwise five years either side of this one.
   */
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const first = minDate ? minDate.getFullYear() : now - 5;
    const last = maxDate ? maxDate.getFullYear() : now + 5;
    return Array.from({ length: Math.max(last - first + 1, 1) }, (_, i) => first + i);
  }, [minDate, maxDate]);

  const header = ({
    date,
    changeMonth,
    changeYear,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: {
    date: Date;
    changeMonth: (month: number) => void;
    changeYear: (year: number) => void;
    decreaseMonth: () => void;
    increaseMonth: () => void;
    prevMonthButtonDisabled: boolean;
    nextMonthButtonDisabled: boolean;
  }) => (
    <div className="app-cal__head">
      <button
        type="button"
        className="app-cal__nav"
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        aria-label="Previous month"
      >
        <FiChevronLeft size={14} />
      </button>

      <FormControl size="small" sx={headerSx}>
        <Select
          value={date.getMonth()}
          onChange={(e) => changeMonth(Number(e.target.value))}
          MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
        >
          {MONTHS.map((m, i) => (
            <MenuItem key={m} value={i} sx={{ fontSize: 12.5 }}>{m}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={headerSx}>
        <Select
          value={date.getFullYear()}
          onChange={(e) => changeYear(Number(e.target.value))}
          MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
        >
          {years.map((y) => (
            <MenuItem key={y} value={y} sx={{ fontSize: 12.5 }}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <button
        type="button"
        className="app-cal__nav"
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        aria-label="Next month"
      >
        <FiChevronRight size={14} />
      </button>
    </div>
  );

  return (
    <div className={`app-cal${className ? ` ${className}` : ""}`}>
      {props.range ? (
        <DatePicker
          selectsRange
          inline
          renderCustomHeader={header}
          startDate={props.startDate}
          endDate={props.endDate}
          minDate={minDate}
          maxDate={maxDate}
          highlightDates={markedDates}
          onChange={(dates) => props.onChange(dates as [Date | null, Date | null])}
        />
      ) : (
        <DatePicker
          inline
          renderCustomHeader={header}
          selected={props.value}
          openToDate={props.value ?? markedDates?.[0] ?? minDate}
          minDate={minDate}
          maxDate={maxDate}
          highlightDates={markedDates}
          onChange={(date) => props.onChange(date as Date | null)}
        />
      )}
    </div>
  );
}
