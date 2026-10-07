import type React from "react";
import { motion } from "framer-motion";
import { TAB_SPRING, type TabKey } from "./tdpUtils";

export type TabDef = { key: TabKey; label: string; icon: React.ElementType; count?: number };

interface TabBarProps {
  tabs: TabDef[];
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="tdp__tabs">
      {tabs.map((t) => {
        const Icon = t.icon;
        const on = active === t.key;
        return (
          <motion.button
            key={t.key}
            type="button"
            className={`tdp__tab${on ? " tdp__tab--on" : ""}`}
            onClick={() => onChange(t.key)}
            whileTap={{ scale: 0.94 }}
            transition={TAB_SPRING}
          >
            {on && (
              <motion.span
                layoutId="taskDetailTabPill"
                transition={TAB_SPRING}
                className="tdp__tab-pill"
              />
            )}
            <motion.span
              animate={{ scale: on ? 1.12 : 1 }}
              transition={TAB_SPRING}
              style={{ position: "relative", zIndex: 1, display: "inline-flex" }}
            >
              <Icon sx={{ fontSize: 15 }} />
            </motion.span>
            <span style={{ position: "relative", zIndex: 1 }}>
              {t.label}
              {t.count !== undefined && ` (${t.count})`}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
