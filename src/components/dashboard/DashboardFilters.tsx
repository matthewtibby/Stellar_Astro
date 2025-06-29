/**
 * DashboardFilters provides search, filter, and sort controls for the dashboard.
 * @component
 */
import React from 'react';

/**
 * Props for DashboardFilters.
 * @prop searchTerm Current search input value.
 * @prop filterStatus Current filter status value.
 * @prop sortBy Current sort field.
 * @prop sortOrder Current sort order.
 * @prop onSearchChange Handler for search input changes.
 * @prop onFilterChange Handler for filter select changes.
 * @prop onSortChange Handler for sort select changes.
 */
interface DashboardFiltersProps {
  searchTerm: string;
  filterStatus: string;
  sortBy: string;
  sortOrder: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * Renders search, filter, and sort controls for the dashboard.
 */
const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  searchTerm,
  filterStatus,
  sortBy,
  sortOrder,
  onSearchChange,
  onFilterChange,
  onSortChange,
}) => (
  <div className="mb-4 flex space-x-4">
    <input
      type="text"
      placeholder="Search projects..."
      value={searchTerm}
      onChange={onSearchChange}
      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      data-tip="Search for projects by name."
    />
    <select
      value={filterStatus}
      onChange={onFilterChange}
      className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      data-tip="Filter projects by status."
    >
      <option value="">All</option>
      <option value="draft">Draft</option>
      <option value="in_progress">In Progress</option>
      <option value="completed">Completed</option>
    </select>
    <select
      value={`${sortBy}:${sortOrder}`}
      onChange={onSortChange}
      className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      data-tip="Sort projects by date or name."
    >
      <option value="created_at:desc">Newest First</option>
      <option value="created_at:asc">Oldest First</option>
      <option value="name:asc">Name A-Z</option>
      <option value="name:desc">Name Z-A</option>
    </select>
  </div>
);

export default DashboardFilters; 