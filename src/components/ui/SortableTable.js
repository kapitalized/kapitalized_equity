import React, { useState } from 'react';
import { Search, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react';
import _ from 'lodash';
import { theme } from '../../styles';

const SortableTable = ({ data, columns, onRowDelete, onRowEdit, entityType }) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = _.orderBy(filteredData, [sortColumn], [sortDirection]);

  const calculateTotals = () => {
    const totals = {};
    columns.forEach(col => {
      if (col.isSummable && col.key) {
        totals[col.key] = _.sumBy(filteredData, col.key);
      }
    });
    return totals;
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-4 w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={`Filter ${entityType}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: theme.borderColor }}
        />
      </div>
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
          <thead style={{ backgroundColor: theme.background }}>
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase ${column.isSortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  style={{ color: theme.lightText }}
                  onClick={() => column.isSortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.isSortable && (
                      <span className="ml-1">
                        {sortColumn === column.key && sortDirection === 'asc' && <ArrowUp className="h-4 w-4" />}
                        {sortColumn === column.key && sortDirection === 'desc' && <ArrowDown className="h-4 w-4" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onRowDelete || onRowEdit) && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
            {sortedData.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map(column => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-xs" style={{ color: theme.lightText }}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {(onRowDelete || onRowEdit) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                    {onRowEdit && <button onClick={() => onRowEdit(row.id, entityType)} className="text-blue-600 hover:text-blue-900 mr-2"><Edit className="h-4 w-4" /></button>}
                    {onRowDelete && <button onClick={() => onRowDelete(row.id, entityType)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {Object.keys(totals).length > 0 && (
            <tfoot className="bg-gray-50 font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>
              <tr>
                <td className="px-6 py-3 text-left text-sm" style={{ color: theme.text }}>Total ({filteredData.length} {entityType}s)</td>
                {columns.slice(1).map(column => (
                  <td key={`total-${column.key}`} className="px-6 py-3 text-left text-sm" style={{ color: theme.text }}>
                    {column.isSummable ? (column.key === 'total_value' ? `$${totals[column.key].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : totals[column.key].toLocaleString()) : ''}
                  </td>
                ))}
                {(onRowDelete || onRowEdit) && <td className="px-6 py-3"></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default SortableTable;
