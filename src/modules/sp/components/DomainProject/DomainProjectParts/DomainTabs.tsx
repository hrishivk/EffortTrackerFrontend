import { motion } from "framer-motion";
import { allTabs } from "../constants";
import type { DomainTab } from "../../../types";

type Props = {
  activeTab: DomainTab;
  onChange: (tab: DomainTab) => void;
};

const DomainTabs = ({ activeTab, onChange }: Props) => (
  <div className="relative flex gap-6 mt-2" style={{ borderBottom: "1px solid var(--border-light)" }}>
    {allTabs.map((tab) => {
      const isActive = activeTab === tab.key;
      return (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="relative px-2 pb-3 text-sm font-semibold transition-colors duration-200"
          style={{ color: isActive ? "var(--text-primary)" : "var(--text-faint)" }}
        >
          {tab.label}
          {isActive && (
            <motion.div
              layoutId="domain-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
              style={{
                background: "linear-gradient(135deg, #AD21DB, #7C3AED)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      );
    })}
  </div>
);

export default DomainTabs;
