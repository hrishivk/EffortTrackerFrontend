import { motion } from "framer-motion";
import { LayoutGrid, FolderTree } from "lucide-react";

export type ListView = "projects" | "domains";

const TAB_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

const LIST_VIEWS = [
  { key: "projects" as const, label: "Projects", icon: LayoutGrid },
  { key: "domains" as const, label: "Departments", icon: FolderTree },
];

type Props = {
  listView: ListView;
  onChange: (view: ListView) => void;
};

const ListViewToggle = ({ listView, onChange }: Props) => (
  <div
    className="mb-3"
    style={{
      display: "inline-flex",
      gap: 2,
      padding: 4,
      borderRadius: 14,
      border: "1px solid var(--border-light)",
      backgroundColor: "var(--bg-hover)",
    }}
  >
    {LIST_VIEWS.map((view) => {
      const Icon = view.icon;
      const active = listView === view.key;
      return (
        <motion.button
          key={view.key}
          onClick={() => onChange(view.key)}
          whileTap={{ scale: 0.94 }}
          transition={TAB_SPRING}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "transparent",
            color: active ? "#fff" : "var(--text-muted)",
            borderRadius: 10,
            fontSize: 12.5,
            fontWeight: 600,
            padding: "7px 14px",
            whiteSpace: "nowrap",
            border: "none",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            transition: "color 0.2s",
          }}
        >
          {active && (
            <motion.span
              layoutId="listViewPill"
              transition={TAB_SPRING}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                boxShadow: "0 2px 10px rgba(124, 58, 237, 0.35)",
                zIndex: 0,
              }}
            />
          )}
          <motion.span
            animate={{ scale: active ? 1.12 : 1 }}
            transition={TAB_SPRING}
            style={{ position: "relative", zIndex: 1, display: "inline-flex" }}
          >
            <Icon size={14} />
          </motion.span>
          <span style={{ position: "relative", zIndex: 1 }}>{view.label}</span>
        </motion.button>
      );
    })}
  </div>
);

export default ListViewToggle;
