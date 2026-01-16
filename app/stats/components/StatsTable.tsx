/**
 * STATS TABLE - V3 Design System
 * ESPN/NFL.com-inspired stats table with ReactorCard styling
 */

'use client';

import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface StatsTableProps {
  data: Array<Record<string, unknown>>;
  viewMode: 'players' | 'teams';
  category: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function StatsTable({
  data,
  viewMode,
  category,
  sortBy,
  sortOrder,
  onSort,
}: StatsTableProps) {
  // Get column definitions based on view mode and category
  const getColumns = () => {
    if (viewMode === 'players') {
      switch (category) {
        case 'passing':
          return [
            { key: 'name', label: 'Player', sortable: false },
            { key: 'team', label: 'Team', sortable: false },
            { key: 'yards', label: 'Yards', sortable: true },
            { key: 'touchdowns', label: 'TD', sortable: true },
            { key: 'interceptions', label: 'INT', sortable: true },
            { key: 'rating', label: 'Rating', sortable: true },
          ];
        case 'rushing':
          return [
            { key: 'name', label: 'Player', sortable: false },
            { key: 'team', label: 'Team', sortable: false },
            { key: 'yards', label: 'Yards', sortable: true },
            { key: 'touchdowns', label: 'TD', sortable: true },
            { key: 'attempts', label: 'Att', sortable: true },
          ];
        case 'receiving':
          return [
            { key: 'name', label: 'Player', sortable: false },
            { key: 'team', label: 'Team', sortable: false },
            { key: 'yards', label: 'Yards', sortable: true },
            { key: 'touchdowns', label: 'TD', sortable: true },
            { key: 'receptions', label: 'Rec', sortable: true },
          ];
        default:
          return [
            { key: 'name', label: 'Player', sortable: false },
            { key: 'team', label: 'Team', sortable: false },
            { key: 'yards', label: 'Yards', sortable: true },
            { key: 'touchdowns', label: 'TD', sortable: true },
          ];
      }
    } else {
      return [
        { key: 'name', label: 'Team', sortable: false },
        { key: 'wins', label: 'W', sortable: true },
        { key: 'losses', label: 'L', sortable: true },
        { key: 'pointsFor', label: 'PF', sortable: true },
        { key: 'pointsAgainst', label: 'PA', sortable: true },
      ];
    }
  };

  const columns = getColumns();

  const getValue = (row: Record<string, unknown>, key: string): string | number => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      const value = (row[parent] as Record<string, unknown>)?.[child];
      return value !== undefined && value !== null ? String(value) : 'N/A';
    }
    const value = row[key];
    return value !== undefined && value !== null ? String(value) : 'N/A';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#2C2F33]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#00F5FF]"
              >
                {col.sortable ? (
                  <button
                    onClick={() => onSort(col.key)}
                    className="flex items-center gap-2 hover:text-[#FF4D00] transition-colors"
                  >
                    {col.label}
                    {sortBy === col.key && (
                      sortOrder === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <motion.tr
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="border-b border-[#152B47]/50 hover:bg-[#0A1A2E]/50 transition-colors"
            >
              {columns.map((col) => {
                const value = getValue(row, col.key);
                const isNumeric = typeof value === 'number';
                return (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm ${
                      isNumeric ? 'font-mono text-right' : 'text-[#F0F0F0]'
                    }`}
                  >
                    {isNumeric ? value.toLocaleString() : value}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
