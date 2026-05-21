import { useState } from "react";
import { motion } from "framer-motion";
import { FormControl, Select, MenuItem } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

interface HolidayRow {
  name: string;
  date: string;
  day: string;
  location: string;
  shifts: string;
  classification: string;
}

const holidays: HolidayRow[] = [
  { name: "New Year's Day",      date: "01-Jan-2026", day: "Thu", location: "All Locations", shifts: "All Shifts", classification: "Holiday" },
  { name: "Pongal",              date: "15-Jan-2026", day: "Thu", location: "All Locations", shifts: "All Shifts", classification: "Holiday" },
  { name: "Republic Day",        date: "26-Jan-2026", day: "Mon", location: "All Locations", shifts: "All Shifts", classification: "Holiday" },
  { name: "Tamil New Year",      date: "14-Apr-2026", day: "Tue", location: "All Locations", shifts: "All Shifts", classification: "Holiday" },
  { name: "May Day",             date: "01-May-2026", day: "Fri", location: "All Locations", shifts: "All Shifts", classification: "Holiday" },
  { name: "Independence Day",    date: "15-Aug-2026", day: "Sat", location: "All Locations", shifts: "All Shifts", classification: "Holiday" },
  { name: "Vinayagar Chaturthi", date: "14-Sep-2026", day: "Mon", location: "All Locations", shifts: "All Shifts", classification: "Holiday" },
  { name: "Christmas Day",       date: "25-Dec-2026", day: "Fri", location: "All Locations", shifts: "All Shifts", classification: "Holiday" },
];

const selectSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 500,
    "& fieldset": { borderColor: "var(--border-light)" },
    "&.Mui-focused fieldset": {
      borderColor: "#7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.1)",
    },
  },
  "& .MuiInputBase-input": { padding: "8px 14px", fontSize: 13, color: "var(--text-primary)" },
};

const menuProps = {
  PaperProps: {
    sx: { borderRadius: 3, boxShadow: "0px 8px 30px rgba(0,0,0,0.08)" },
  },
};

const thStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#7c3aed",
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

export default function HolidayList() {
  const [year, setYear] = useState(2026);
  const [filter, setFilter] = useState("my");

  const dateRange = `01-Jan-${year} - 31-Dec-${year}`;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem" }}>
            Holiday List {year}
          </h2>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.95rem" }}>
            View the company holidays scheduled for the calendar year {year}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter dropdown */}
          <FormControl size="small" sx={{ minWidth: 130, ...selectSx }}>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              MenuProps={menuProps}
            >
              <MenuItem value="my">My Holidays</MenuItem>
              <MenuItem value="all">All Holidays</MenuItem>
            </Select>
          </FormControl>

          {/* Year navigator */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="w-8 h-8 flex items-center justify-center transition"
              style={{ border: "1px solid var(--border-light)", borderRadius: 10, backgroundColor: "var(--bg-card)" }}
            >
              <KeyboardArrowLeftIcon sx={{ fontSize: 18, color: "var(--text-muted)" }} />
            </button>
            <button
              className="flex items-center gap-1.5 text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 18px",
                whiteSpace: "nowrap",
                border: "none",
                cursor: "pointer",
              }}
            >
              <CalendarMonthIcon sx={{ fontSize: 14 }} />
              {dateRange}
            </button>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="w-8 h-8 flex items-center justify-center transition"
              style={{ border: "1px solid var(--border-light)", borderRadius: 10, backgroundColor: "var(--bg-card)" }}
            >
              <KeyboardArrowRightIcon sx={{ fontSize: 18, color: "var(--text-muted)" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Table header */}
        <div
          className="grid items-center px-6 py-3"
          style={{
            gridTemplateColumns: "1.5fr 1.2fr 1fr 0.8fr 1fr",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <span style={thStyle}>Name</span>
          <span style={thStyle}>Date</span>
          <span style={thStyle}>Location</span>
          <span style={thStyle}>Shifts</span>
          <span style={thStyle}>Classification</span>
        </div>

        {/* Rows */}
        {holidays.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="grid items-center px-6"
            style={{
              gridTemplateColumns: "1.5fr 1.2fr 1fr 0.8fr 1fr",
              height: 52,
              borderBottom: i < holidays.length - 1 ? "1px solid var(--border-light)" : "none",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {row.name}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
              {row.date}, {row.day}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#14b8a6" }}>
              {row.location}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
              {row.shifts}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>
              {row.classification}
            </span>
          </motion.div>
        ))}

        {/* Footer */}
        <div
          className="px-6 py-3"
          style={{ borderTop: "1px solid var(--border-light)", textAlign: "right" }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-faint)" }}>
            Showing {holidays.length} holidays in the selected period
          </span>
        </div>
      </div>
    </>
  );
}
