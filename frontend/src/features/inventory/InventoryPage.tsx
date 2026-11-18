import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { resolveToolImage, setLocalToolImages } from '../../lib/local-storage';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ToolFormModal } from './ToolFormModal';
import { SlidersHorizontal, Plus, Edit, Archive, Trash2, Search } from 'lucide-react';
import { TOOL_CATEGORIES, formatPHP, type Tool } from '@mcteb/shared';

const CATEGORY_FILTER_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...TOOL_CATEGORIES.map((c) => ({ value: c, label: c })),
];

const AVAILABILITY_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Available', label: 'Available' },
  { value: 'Borrowed', label: 'Borrowed' },
  { value: 'Reserved', label: 'Reserved' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A – Z)' },
  { value: 'name_desc', label: 'Name (Z – A)' },
  { value: 'price_asc', label: 'Daily Fee: Low to High' },
  { value: 'price_desc', label: 'Daily Fee: High to Low' },
  { value: 'availability', label: 'Status Priority' },
  { value: 'newest', label: 'Newest Added' },
];

export function InventoryPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('availability', statusFilter);
      if (sortBy) params.append('sort_by', sortBy);
      params.append('limit', '100');

      const res = await apiRequest<{ items: Tool[]; total: number }>(`/tools?${params.toString()}`);
      setTools(res.items);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, sortBy]);

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, statusFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleArchive = async (tool: Tool) => {
    if (
      !confirm(
        `Are you sure you want to archive "${tool.name}"? It will be marked as Archived in the inventory.`,
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/tools/${tool.id}/archive`, { method: 'POST' });
      setMessage(`"${tool.name}" has been archived.`);
      await fetchInventory();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Archive failed');
    }
  };

  const handleDelete = async (tool: Tool) => {
    if (
      !confirm(
        `Permanently remove "${tool.name}" from inventory? This removes obsolete or unnecessary items completely.`,
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/tools/${tool.id}`, { method: 'DELETE' });
      setLocalToolImages(tool.id, null);
      setMessage(`"${tool.name}" was permanently removed from inventory.`);
      await fetchInventory();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Municipal Inventory Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Add, edit, categorize, track availability status, and remove obsolete tools and
            equipment.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingTool(null);
            setIsModalOpen(true);
          }}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add New Tool
        </Button>
      </div>

      {message && (
        <Alert variant="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      {/* Search, Category, Status & Sort Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search equipment by name, description, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent"
            />
          </div>
          <Button type="submit" size="md">
            Search
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Category"
            options={CATEGORY_FILTER_OPTIONS}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
          <Select
            label="Availability Status"
            options={AVAILABILITY_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            label="Sort Order"
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          />
        </div>
      </div>

      {/* Tools Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : tools.length === 0 ? (
        <EmptyState
          icon={<SlidersHorizontal className="h-12 w-12 text-slate-400 stroke-1" />}
          title="No inventory records"
          description="No equipment found matching current filter."
        />
      ) : (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Equipment Item</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Available / Total</th>
                  <th className="px-4 py-3">Daily Fee</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img
                            src={resolveToolImage(tool)}
                            alt={tool.name}
                            className="max-h-full max-w-full object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {tool.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {tool.category}
                            {tool.serial_number && ` • ${tool.serial_number}`}
                            {tool.owner_name &&
                              tool.owner_role === 'Borrower' &&
                              ` • Shared by ${tool.owner_name}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={tool.availability_status} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={tool.condition_status} />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {tool.available_quantity} / {tool.total_quantity}
                    </td>
                    <td className="px-4 py-3 font-bold text-civic-forest dark:text-civic-light">
                      {formatPHP(tool.rental_fee_centavos)}
                      {(tool.discount_percent ?? 0) > 0 && (
                        <span className="ml-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                          (-{tool.discount_percent}%)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Edit Tool"
                        aria-label={`Edit ${tool.name}`}
                        onClick={() => {
                          setEditingTool(tool);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      {tool.availability_status !== 'Archived' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Archive Tool"
                          aria-label={`Archive ${tool.name}`}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          onClick={() => handleArchive(tool)}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Remove / Delete Tool"
                        aria-label={`Delete ${tool.name}`}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        onClick={() => handleDelete(tool)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tool Form Modal */}
      <ToolFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTool(null);
        }}
        tool={editingTool}
        onSuccess={() => {
          setMessage(editingTool ? 'Inventory item updated.' : 'New tool added to inventory.');
          fetchInventory();
        }}
      />
    </div>
  );
}
