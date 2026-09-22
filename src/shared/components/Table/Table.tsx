import React, { useState } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CPagination,
  CPaginationItem,
} from "@coreui/react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import type { TableListProps } from "./types";
import { usePagination } from "../../hooks/usePagination";

/**
 * How an expanded row opens and shuts.
 *
 * The same easing the panels elsewhere use, and slow enough to be read as the
 * row growing rather than a second row appearing under it.
 */
const EXPAND_EASE = [0.22, 1, 0.3, 1] as const;

function TableList<T>({
  columns,
  data,
  itemsPerPage = 10,
  emptyMessage = "No records found",
  title,
  headerAction,
  onRowClick,
  pagination,
  expandable,
}: TableListProps<T>) {
  const internal = usePagination(data, itemsPerPage);

  const currentPage = pagination
    ? pagination.currentPage
    : internal.currentPage;

  const totalPages = pagination ? pagination.totalPages : internal.totalPages;

  const onPageChange = pagination
    ? pagination.onPageChange
    : internal.setCurrentPage;

  const displayData = pagination ? data : internal.paginatedData;

  const [internalExpanded, setInternalExpanded] = useState<number[]>([]);

  const isControlled = expandable?.expandedIndex !== undefined;
  const expandedRows = isControlled
    ? (expandable?.expandedIndex !== null ? [expandable.expandedIndex!] : [])
    : internalExpanded;

  const toggleRow = (index: number) => {
    if (!expandable) return;

    if (isControlled && expandable.onExpandChange) {
      expandable.onExpandChange(expandedRows.includes(index) ? null : index);
    } else if (expandable.accordion) {
      setInternalExpanded(expandedRows.includes(index) ? [] : [index]);
    } else {
      setInternalExpanded((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index],
      );
    }
  };

  return (
    <div className="advanced-table-wrapper">
      <CCard className="advanced-card">
        {(title || headerAction) && (
          <CCardHeader className="advanced-header d-flex justify-content-between align-items-center">
            <div>{title && <h5 className="mb-0">{title}</h5>}</div>
            <div>{headerAction}</div>
          </CCardHeader>
        )}

        <CCardBody className="p-0">
          <div className="table-scroll">
            <CTable responsive className="advanced-table mb-0">
              <CTableHead>
                <CTableRow className="advanced-header-row">
                  {expandable && <CTableHeaderCell style={{ width: 60 }} />}

                  {columns.map((col) => (
                    <CTableHeaderCell key={col.key} style={col.width ? { width: col.width } : undefined}>
                      <div className="th-content">
                        {col.header}
                        <span className="sort-icon">↓</span>
                      </div>
                    </CTableHeaderCell>
                  ))}

       
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {displayData.length > 0 ? (
                  displayData.map((row, idx) => {
                    const isExpanded = expandedRows.includes(idx);

                    return (
                      <React.Fragment key={idx}>
                        <CTableRow
                          className="table-row"
                          onClick={() => onRowClick?.(row)}
                          style={onRowClick ? { cursor: "pointer" } : undefined}
                        >
                          {expandable && (
                            <CTableDataCell
                              className="chevron-cell"
                              onClick={() => toggleRow(idx)}
                            >
                              <motion.span
                                className="chevron"
                                style={{ display: "inline-flex" }}
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 420,
                                  damping: 32,
                                }}
                              >
                                <FiChevronDown />
                              </motion.span>
                            </CTableDataCell>
                          )}

                          {columns.map((col) => (
                            <CTableDataCell key={col.key} style={col.width ? { width: col.width } : undefined}>
                              {col.render(row)}
                            </CTableDataCell>
                          ))}
                        </CTableRow>

                        <AnimatePresence initial={false}>
                          {expandable && isExpanded && (
                            <motion.tr
                              key="expanded"
                              className="expanded-row"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.16 }}
                            >
                              {/*
                                * The cell gives up its padding so the row can
                                * close to nothing; the same spacing is put back
                                * inside, where it collapses with the content.
                                */}
                              <td
                                colSpan={columns.length + (expandable ? 1 : 0)}
                                style={{ padding: 0 }}
                              >
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  transition={{ duration: 0.26, ease: EXPAND_EASE }}
                                  style={{ overflow: "hidden" }}
                                >
                                  <div style={{ padding: "18px 20px" }}>
                                    <div className="expanded-content">
                                      {expandable.renderExpandedRow(row)}
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <CTableRow>
                    <CTableDataCell
                      colSpan={columns.length + 1}
                      className="empty-state"
                    >
                      {emptyMessage}
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      {totalPages > 1 && (
        <div className="advanced-pagination">
          <div className="pagination-left">
            Showing page {currentPage} of {totalPages}
          </div>

          <CPagination size="sm">
            <CPaginationItem
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Prev
            </CPaginationItem>

            {[...Array(totalPages)].map((_, i) => (
              <CPaginationItem
                key={i}
                active={i + 1 === currentPage}
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </CPaginationItem>
            ))}

            <CPaginationItem
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </CPaginationItem>
          </CPagination>
        </div>
      )}
    </div>
  );
}

export default TableList;
