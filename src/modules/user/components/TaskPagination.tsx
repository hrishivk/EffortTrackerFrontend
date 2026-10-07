import React from "react";
import { CPagination, CPaginationItem } from "@coreui/react";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const TaskPagination: React.FC<Props> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="d-flex align-items-center justify-content-between mt-3 px-2">
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
        Page {page} of {totalPages}
      </span>
      <CPagination size="sm" className="mb-0">
        <CPaginationItem disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </CPaginationItem>
        {[...Array(totalPages)].map((_, i) => (
          <CPaginationItem key={i} active={i + 1 === page} onClick={() => onPageChange(i + 1)}>
            {i + 1}
          </CPaginationItem>
        ))}
        <CPaginationItem
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </CPaginationItem>
      </CPagination>
    </div>
  );
};

export default TaskPagination;
