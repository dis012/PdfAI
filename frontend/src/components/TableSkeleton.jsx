import React from 'react';
import './TableSkeleton.css';

const TableSkeleton = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  className = '' 
}) => {
  const renderSkeletonRow = (isHeader = false) => (
    <tr className={`skeleton-row ${isHeader ? 'skeleton-header-row' : ''}`}>
      {Array.from({ length: columns }, (_, index) => (
        <td key={index} className={`skeleton-cell ${isHeader ? 'skeleton-header-cell' : ''}`}>
          <div className={`skeleton-content ${isHeader ? 'skeleton-header-content' : ''}`}></div>
        </td>
      ))}
    </tr>
  );

  return (
    <div className={`table-skeleton-container ${className}`}>
      <div className="table-wrapper">
        <table className="skeleton-table" role="presentation" aria-hidden="true">
          {showHeader && (
            <thead className="skeleton-thead">
              {renderSkeletonRow(true)}
            </thead>
          )}
          <tbody className="skeleton-tbody">
            {Array.from({ length: rows }, (_, index) => (
              <React.Fragment key={index}>
                {renderSkeletonRow(false)}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="skeleton-loading-text">
        <div className="skeleton-text-line"></div>
      </div>
    </div>
  );
};

export default TableSkeleton;