import { motion } from "framer-motion";
import { FiActivity, FiEdit2 } from "react-icons/fi";

export type ProjectTab = "details" | "activity";

const TABS = [
  { key: "details", label: "Details", icon: <FiEdit2 size={13} /> },
  { key: "activity", label: "Activity", icon: <FiActivity size={13} /> },
] as const;

interface ProjectTabsProps {
  tab: ProjectTab;
  onChange: (tab: ProjectTab) => void;
  activityCount: number;
}

const ProjectTabs = ({ tab, onChange, activityCount }: ProjectTabsProps) => (
  <div className="ep-tabs" role="tablist" aria-label="Project sections">
    {TABS.map((t) => (
      <button
        key={t.key}
        type="button"
        role="tab"
        aria-selected={tab === t.key}
        className={`ep-tab${tab === t.key ? " is-active" : ""}`}
        onClick={() => onChange(t.key)}
      >
        {tab === t.key && (
          <motion.span
            layoutId="ep-tab-pill"
            className="ep-tab-pill"
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
          />
        )}
        <span className="ep-tab-inner">
          {t.icon}
          {t.label}
          {t.key === "activity" && activityCount > 0 && (
            <span className="ep-tab-count">{activityCount}</span>
          )}
        </span>
      </button>
    ))}
  </div>
);

export default ProjectTabs;
