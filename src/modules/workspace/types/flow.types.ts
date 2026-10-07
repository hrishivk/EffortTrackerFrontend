import type { ElementType, ReactNode } from "react";
import type { useWorkspaceFlow } from "../components/flow/useWorkspaceFlow";

export interface PickProject {
  id: string;
  name: string;
}

export interface DraftRoom {
  id: string;
  name: string;
  projectId: string;
  memberIds: string[];
}

export type WorkspaceFlowState = ReturnType<typeof useWorkspaceFlow>;

export interface FlowStepProps {
  f: WorkspaceFlowState;
}

export interface FactProps {
  icon: ElementType;
  label: string;
  value: string;
}

export interface SectionHeadProps {
  title: string;
  caption: string;
}

export interface RvCardProps {
  icon: ElementType;
  title: string;
  children: ReactNode;
  foot?: ReactNode;
}

export interface RvRowProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}
