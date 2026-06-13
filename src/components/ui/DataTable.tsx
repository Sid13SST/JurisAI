import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown, Eye } from 'lucide-react';


export interface Column<T> {
  header: string;
  accessor: keyof T;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
  emptyState?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  keyExtractor,
  emptyState
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


  const handleSort = (columnKey: keyof T) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      if (valA === undefined || valB === undefined) return 0;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  if (sortedData.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-[#111827]/10 backdrop-blur-md">
      <table className="w-full border-collapse text-left text-sm text-slate-300">
        
        {/* Table Header */}
        <thead className="border-b border-white/5 bg-white/2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={`px-6 py-4 ${col.sortable ? 'cursor-pointer hover:text-white select-none' : ''}`}
                onClick={() => col.sortable && handleSort(col.accessor)}
              >
                <div className="flex items-center gap-1">
                  <span>{col.header}</span>
                  {col.sortable && (
                    <span className="text-slate-500">
                      {sortColumn === col.accessor ? (
                        sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      ) : (
                        <ArrowUpDown size={10} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {onRowClick && <th className="px-6 py-4 text-right">Actions</th>}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-white/5">
          {sortedData.map((row) => (
            <tr 
              key={keyExtractor(row)} 
              className={`transition-colors hover:bg-white/3 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, idx) => (
                <td key={idx} className="whitespace-nowrap px-6 py-4">
                  {col.render ? col.render(row) : String(row[col.accessor])}
                </td>
              ))}
              {onRowClick && (
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(row);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-2xs font-semibold text-slate-200 hover:bg-primary/20 hover:border-primary/30 transition-all duration-200"
                  >
                    <Eye size={12} />
                    <span>View Audit</span>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
