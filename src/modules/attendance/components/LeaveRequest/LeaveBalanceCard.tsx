import { motion } from "framer-motion";
import type { BalanceItem } from "./leaveRequestConstants";

const LeaveBalanceCard = ({ items }: { items: BalanceItem[] }) => (
  <div
    className="rounded-2xl p-5"
    style={{
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border-card)",
      boxShadow: "var(--shadow-card)",
    }}
  >
    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px" }}>
      Current Leave Balance
    </h3>

    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={i}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
              {item.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>
              {item.days} Days
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "var(--bg-hover)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (item.days / 15) * 100)}%` }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.33, 1, 0.68, 1] }}
              style={{
                height: "100%",
                borderRadius: 3,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>

    <button
      className="d-flex align-items-center gap-1 mt-4"
      style={{
        background: "none",
        border: "none",
        fontSize: 12,
        fontWeight: 600,
        color: "#7c3aed",
        cursor: "pointer",
        padding: 0,
      }}
    >
      View Detailed Balance &rsaquo;
    </button>
  </div>
);

export default LeaveBalanceCard;
