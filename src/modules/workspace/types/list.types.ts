import type { CSSProperties, ReactNode } from "react";

export interface StatusFace {
  label: string;
  color: string;
  bg: string;
}

export interface PillProps {
  children: ReactNode;
  color: string;
  bg: string;
  style?: CSSProperties;
  title?: string;
}
