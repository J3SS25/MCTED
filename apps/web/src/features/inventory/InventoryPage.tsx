import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ToolFormModal } from './ToolFormModal';
import { SlidersHorizontal, Plus, Edit, Archive, Search } from 'lucide-react';
import type { Tool } from '@mcteb/shared';
import { formatPHP } from '@mcteb/shared';

export function InventoryPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');

      const res = await apiRequest<{ items: Tool[]; total: number }>(`/tools?${params.toString()}`);
      setTools(res.items);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleArchive = async (tool: Tool) => {
    if (!confirm(`Are you sure you want to archive "${tool.name}"? It will no longer appear in the public catalog.`)) {
      return;
    }

    try {
      await apiRequest(`/tools/${tool.id}/archive`, { method: 'POST' });
      await fetchInventory();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Archive failed');
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
            Maintain tool listings, stock quantities, conditions, and catalog availability.
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

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent"
          />
        </div>
        <Button type="submit" size="md">
          Search
        </Button>
      </form>

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
                  <th className="px-4 py-3">Tool Name & Category</th>
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
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {tool.name}
                      </div>
                      <div className="text-[11px] text-slate-500">{tool.category} {tool.serial_number && `• ${tool.serial_number}`}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status={tool.availability_status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status={tool.condition_status} />
                    </td>
                    <td className="px-4 py-3.5 font-medium">
                      {tool.available_quantity} / {tool.total_quantity}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-civic-forest dark:text-civic-light">
                      {formatPHP(tool.rental_fee_centavos)}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
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
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                          onClick={() => handleArchive(tool)}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
        onSuccess={fetchInventory}
      />
    </div>
  );
}

