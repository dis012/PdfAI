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
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div className="table-container">
        <div className="table-empty">
          <p>No table data available</p>
        </div>
      </div>
    );
  }

  // Helper function to format field names for display
  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to format cell values with better handling
  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="null-value">—</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className={`boolean-value ${value ? 'true' : 'false'}`}>
        {value ? '✓' : '✗'}
      </span>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="empty-array">Empty list</span>;
      }
      
      // If array contains simple values, show as comma-separated
      if (value.every(item => typeof item !== 'object' || item === null)) {
        return (
          <div className="array-value">
            {value.map((item, index) => (
              <span key={index} className="array-item">
                {formatCellValue(item)}
                {index < value.length - 1 && ', '}
              </span>
            ))}
          </div>
        );
      }
      
      // For complex arrays, show count and expandable view
      return (
        <details className="complex-array">
          <summary>{value.length} items</summary>
          <div className="array-content">
            {value.map((item, index) => (
              <div key={index} className="array-item-complex">
                <strong>Item {index + 1}:</strong> {formatCellValue(item)}
              </div>
            ))}
          </div>
        </details>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span className="empty-object">Empty object</span>;
      }
      
      return (
        <details className="nested-object">
          <summary>{entries.length} properties</summary>
          <div className="object-content">
            {entries.map(([key, val]) => (
              <div key={key} className="object-property">
                <strong>{formatFieldName(key)}:</strong> {formatCellValue(val)}
              </div>
            ))}
          </div>
        </details>
      );
    }
    
    // Handle strings, numbers, etc.
    const stringValue = String(value);
    
    // Check if it's a URL
    if (stringValue.match(/^https?:\/\//)) {
      return <a href={stringValue} target="_blank" rel="noopener noreferrer" className="url-value">{stringValue}</a>;
    }
    
    // Check if it's an email
    if (stringValue.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return <a href={`mailto:${stringValue}`} className="email-value">{stringValue}</a>;
    }
    
    // Check if it's a date
    if (stringValue.match(/^\d{4}-\d{2}-\d{2}/) || stringValue.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      return <span className="date-value">{stringValue}</span>;
    }
    
    // Long text handling
    if (stringValue.length > 100) {
      return (
        <details className="long-text">
          <summary>{stringValue.substring(0, 100)}...</summary>
          <div className="full-text">{stringValue}</div>
        </details>
      );
    }
    
    return <span className="text-value">{stringValue}</span>;
  };

  // Helper function to flatten nested objects for table display
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        // Keep primitive values and arrays as-is
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  };

  // Helper function to determine if data is an array of similar objects
  const isArrayOfObjects = (data) => {
    return Array.isArray(data) && 
           data.length > 0 && 
           data.every(item => typeof item === 'object' && item !== null);
  };

  // Helper function to get all unique keys from an array of objects
  const getAllKeys = (dataArray) => {
    const keySet = new Set();
    dataArray.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => keySet.add(key));
      }
    });
    return Array.from(keySet).sort();
  };

  // Render table for array of objects
  const renderArrayTable = (dataArray) => {
    const keys = getAllKeys(dataArray);
    
    return (
      <div className="table-wrapper">
        <table className="data-table array-table">
          <thead>
            <tr>
              <th className="table-header row-number">#</th>
              {keys.map(key => (
                <th key={key} className="table-header">
                  {formatFieldName(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataArray.map((item, index) => (
              <tr key={index} className="table-row">
                <td className="table-cell row-number">{index + 1}</td>
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

  // Render key-value table for objects
  const renderKeyValueTable = (dataObject) => {
    const entries = Object.entries(dataObject).sort(([a], [b]) => a.localeCompare(b));
    
    return (
      <div className="table-wrapper">
        <table className="data-table key-value-table">
          <thead>
            <tr>
              <th className="table-header key-header">Field</th>
              <th className="table-header value-header">Value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} className="table-row">
                <td className="table-cell key-cell">
                  {formatFieldName(key)}
                </td>
                <td className="table-cell value-cell">
                  {formatCellValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Main render logic
  const renderTable = () => {
    // Handle different data types
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return (
          <div className="table-empty">
            <p>Empty array</p>
          </div>
        );
      }
      
      // If it's an array of objects, render as a proper table
      if (isArrayOfObjects(data)) {
        return renderArrayTable(data);
      }
      
      // If it's an array of primitives, convert to key-value format
      const arrayAsObject = data.reduce((acc, item, index) => {
        acc[`Item ${index + 1}`] = item;
        return acc;
      }, {});
      
      return renderKeyValueTable(arrayAsObject);
    }
    
    if (typeof data === 'object' && data !== null) {
      // Check if we should flatten nested objects
      const hasComplexNesting = Object.values(data).some(value => 
        value && typeof value === 'object' && !Array.isArray(value)
      );
      
      if (hasComplexNesting) {
        // Flatten the object for better display
        const flattened = flattenObject(data);
        return renderKeyValueTable(flattened);
      } else {
        // Simple object, render as-is
        return renderKeyValueTable(data);
      }
    }
    
    // Single primitive value
    return renderKeyValueTable({ value: data });
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