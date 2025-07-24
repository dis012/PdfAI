import React from 'react';
import TableSkeleton from './TableSkeleton';
import './TableDisplay.css';

const TableDisplay = ({ data, loading }) => {
  // Handle loading state
  if (loading) {
    return (
      <TableSkeleton 
        rows={5} 
        columns={4} 
        showHeader={true}
        className="table-loading-skeleton"
      />
    );
  }

  // Handle empty or null data
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="table-container">
        <div className="table-empty">
          <p>No table data available</p>
        </div>
      </div>
    );
  }

  // Helper function to determine if data is an array of objects (typical table structure)
  const isArrayOfObjects = (data) => {
    return Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null;
  };

  // Helper function to get all unique keys from an array of objects
  const getAllKeys = (dataArray) => {
    const keySet = new Set();
    dataArray.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => keySet.add(key));
      }
    });
    return Array.from(keySet);
  };

  // Helper function to format cell values
  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    return String(value);
  };

  // Helper function to render a table from array of objects
  const renderArrayTable = (dataArray) => {
    const keys = getAllKeys(dataArray);
    
    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {keys.map(key => (
                <th key={key} className="table-header">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataArray.map((item, index) => (
              <tr key={index} className="table-row">
                {keys.map(key => (
                  <td key={key} className="table-cell">
                    {formatCellValue(item[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper function to render a table from a single object (key-value pairs)
  const renderObjectTable = (dataObject) => {
    const entries = Object.entries(dataObject);
    
    return (
      <div className="table-wrapper">
        <table className="data-table key-value-table">
          <thead>
            <tr>
              <th className="table-header">Key</th>
              <th className="table-header">Value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} className="table-row">
                <td className="table-cell key-cell">{key}</td>
                <td className="table-cell value-cell">{formatCellValue(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper function to render nested structure table
  const renderNestedTable = (data) => {
    // For complex nested structures, we'll flatten them or show a simplified view
    const flattenObject = (obj, prefix = '') => {
      const flattened = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(flattened, flattenObject(obj[key], newKey));
          } else {
            flattened[newKey] = obj[key];
          }
        }
      }
      return flattened;
    };

    const flattenedData = flattenObject(data);
    return renderObjectTable(flattenedData);
  };

  // Main render logic - determine the best way to display the data
  const renderTable = () => {
    // Case 1: Array of objects (most common table structure)
    if (isArrayOfObjects(data)) {
      return renderArrayTable(data);
    }
    
    // Case 2: Single object with potential nested structure
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Check if it's a simple key-value object or has nested structure
      const hasNestedObjects = Object.values(data).some(value => 
        typeof value === 'object' && value !== null && !Array.isArray(value)
      );
      
      if (hasNestedObjects) {
        return renderNestedTable(data);
      } else {
        return renderObjectTable(data);
      }
    }
    
    // Case 3: Array of primitives
    if (Array.isArray(data)) {
      const arrayAsObject = data.map((item, index) => ({ index, value: item }));
      return renderArrayTable(arrayAsObject);
    }
    
    // Case 4: Single primitive value
    return renderObjectTable({ value: data });
  };

  return (
    <div className="table-container">
      <div className="table-header-section">
        <h3>Table Data</h3>
        <div className="table-info">
          {Array.isArray(data) ? `${data.length} rows` : `${Object.keys(data).length} properties`}
        </div>
      </div>
      {renderTable()}
    </div>
  );
};

export default TableDisplay;