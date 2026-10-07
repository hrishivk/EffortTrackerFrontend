import type { CSSProperties, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TREE_SPRING } from "./sidebarConfig";

/** Height/opacity expand-collapse used by sections, branches, workspaces and rooms. */
export const Collapse = ({
  open,
  duration = 0.18,
  children,
}: {
  open: boolean;
  duration?: number;
  children: ReactNode;
}) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration, ease: "easeOut" }}
        style={{ overflow: "hidden" }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

/** The sliding highlight behind the active link; shares one layoutId per sidebar instance. */
export const ActiveGlow = ({
  layoutId,
  className = "sb-tree__glow",
  style,
}: {
  layoutId: string;
  className?: string;
  style?: CSSProperties;
}) => (
  <motion.span
    layoutId={layoutId}
    className={className}
    transition={TREE_SPRING}
    style={{ borderRadius: 9, ...style }}
  />
);
