import type React from "react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
};

export interface TableListProps<T> {
  columns: {
    key: string;
    header: string;
    render: (row: T) => React.ReactNode;
     
  }[];

  data: T[];
  itemsPerPage?: number;
  emptyMessage?: string;
  title?: string;
  headerAction?: React.ReactNode;

  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };

  expandable?: {
    renderExpandedRow: (row: T) => React.ReactNode;
    accordion?: boolean;
    expandedIndex?: number | null;
    onExpandChange?: (index: number | null) => void;
  };
}
