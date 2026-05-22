import { motion } from "framer-motion";

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

const thStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#7c3aed",
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

export default function HolidayList() {
  const year = 2026;

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
