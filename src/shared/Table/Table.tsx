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
import { FiChevronDown } from "react-icons/fi";
import type { TableListProps } from "./types";
import { usePagination } from "./hooks/usePagination";

function TableList<T>({
  columns,
  data,
  itemsPerPage = 10,
  emptyMessage = "No records found",
  title,
  headerAction,
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
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

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

  const toggleSelectRow = (index: number) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === displayData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(displayData.map((_, i) => i));
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
                  {/* Select All */}
                  <CTableHeaderCell style={{ width: 50 }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === displayData.length &&
                        displayData.length > 0
                      }
                      onChange={toggleSelectAll}
                    />
                  </CTableHeaderCell>

                  {expandable && <CTableHeaderCell style={{ width: 60 }} />}

                  {columns.map((col) => (
                    <CTableHeaderCell key={col.key}>
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
                    const isSelected = selectedRows.includes(idx);

                    return (
                      <React.Fragment key={idx}>
                        <CTableRow
                          className={`table-row ${
                            isSelected ? "row-selected" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <CTableDataCell>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(idx)}
                            />
                          </CTableDataCell>

                          {expandable && (
                            <CTableDataCell
                              className="chevron-cell"
                              onClick={() => toggleRow(idx)}
                            >
                              <FiChevronDown
                                className={`chevron ${
                                  isExpanded ? "rotate" : ""
                                }`}
                              />
                            </CTableDataCell>
                          )}

                          {columns.map((col) => (
                            <CTableDataCell key={col.key}>
                              {col.render(row)}
                            </CTableDataCell>
                          ))}
                        </CTableRow>

                        {expandable && isExpanded && (
                          <CTableRow className="expanded-row">
                            <CTableDataCell
                              colSpan={
                                columns.length + 2 + (expandable ? 1 : 0)
                              }
                            >
                              <div className="expanded-content">
                                {expandable.renderExpandedRow(row)}
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <CTableRow>
                    <CTableDataCell
                      colSpan={columns.length + 2}
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
