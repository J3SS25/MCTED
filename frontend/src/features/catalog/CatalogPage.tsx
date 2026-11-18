import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { setLocalToolImages } from '../../lib/local-storage';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { CategoryNav } from '../../components/catalog/CategoryNav';
import { ToolCard } from '../../components/catalog/ToolCard';
import { ToolDetailsModal } from '../../components/catalog/ToolDetailsModal';
import { ToolFormModal } from '../inventory/ToolFormModal';
import { ReservationFormModal } from '../reservations/ReservationFormModal';
import { Search, Plus, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import type { Tool } from '@mcteb/shared';

const AVAILABILITY_FILTERS = [
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
  { value: 'availability', label: 'Availability Priority' },
  { value: 'newest', label: 'Newest Added' },
];

export function CatalogPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [reserveTool, setReserveTool] = useState<Tool | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (category) params.append('category', category);
      if (availability) params.append('availability', availability);
      if (sortBy) params.append('sort_by', sortBy);
      params.append('limit', '100');

      const res = await apiRequest<{ items: Tool[]; total: number }>(`/tools?${params.toString()}`);
      setTools(res.items);
    } catch (err) {
      console.error('Failed to load equipment catalog', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, availability, sortBy]);

  useEffect(() => {
    fetchCatalog();
  }, [category, availability, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  const handleDeleteTool = async (tool: Tool) => {
    if (
      !confirm(
        `Are you sure you want to permanently remove "${tool.name}" from the catalog? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/tools/${tool.id}`, { method: 'DELETE' });
      setLocalToolImages(tool.id, null);
      setFeedbackBanner(`"${tool.name}" was removed successfully.`);
      await fetchCatalog();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove tool');
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { __total: tools.length };
    for (const item of tools) {
      const normalized =
        item.category === 'Agricultural'
          ? 'Agriculture'
          : item.category === 'Fishery'
            ? 'Fishing'
            : item.category;
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
    return counts;
  }, [tools]);

  const isStaffOrAdmin = user?.role === 'Municipal Staff' || user?.role === 'Administrator';

  const handleBorrowNow = (tool: Tool) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/catalog' } } });
      return;
    }
    setReserveTool(tool);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Shared Equipment Catalog
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse municipal tools and equipment across agriculture, marine, carpentry, and
            emergency response.
          </p>
        </div>

        {isStaffOrAdmin && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Button
              size="sm"
              onClick={() => {
                setEditingTool(null);
                setIsModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Equipment
            </Button>
          </div>
        )}
      </div>

      {feedbackBanner && (
        <Alert variant="success" onClose={() => setFeedbackBanner(null)}>
          {feedbackBanner}
        </Alert>
      )}

      {/* Structured Category Navigation */}
      <CategoryNav
        selectedCategory={category}
        onSelectCategory={setCategory}
        counts={category === '' ? categoryCounts : undefined}
      />

      {/* Search, Filter & Sorting Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by tool name, specifications, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent"
            />
          </div>
          <Button type="submit" size="md">
            Search
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[420px]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400 flex-shrink-0 hidden sm:block" />
            <Select
              aria-label="Filter by availability status"
              options={AVAILABILITY_FILTERS}
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400 flex-shrink-0 hidden sm:block" />
            <Select
              aria-label="Sort tools"
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Responsive Tools Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : tools.length === 0 ? (
        <EmptyState
          title="No equipment found"
          description="Try modifying your search keywords or clearing your category and status filters."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setCategory('');
            setAvailability('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => {
            // Borrowers cannot modify tools in the general catalog; only staff/admins manage catalog items here
            const canManage = isStaffOrAdmin;

            return (
              <ToolCard
                key={tool.id}
                tool={tool}
                canManage={canManage}
                onSelect={(item) => setSelectedTool(item)}
                onBorrowNow={!isStaffOrAdmin ? handleBorrowNow : undefined}
                onEdit={(item) => {
                  setEditingTool(item);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteTool}
              />
            );
          })}
        </div>
      )}

      {/* Automatic Complete Tool Details Modal */}
      <ToolDetailsModal
        isOpen={!!selectedTool}
        onClose={() => setSelectedTool(null)}
        tool={selectedTool}
        canManage={isStaffOrAdmin}
        onEdit={(item) => {
          setEditingTool(item);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteTool}
        onBorrowNow={!isStaffOrAdmin ? handleBorrowNow : undefined}
      />

      {/* Add / Edit Tool Modal (Municipal Staff & Administrator only) */}
      {isStaffOrAdmin && (
        <ToolFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTool(null);
          }}
          tool={editingTool}
          onSuccess={() => {
            setFeedbackBanner(editingTool ? 'Tool details updated.' : 'Tool added to catalog.');
            fetchCatalog();
          }}
        />
      )}

      {/* Quick Reservation Modal */}
      {reserveTool && (
        <ReservationFormModal
          isOpen={!!reserveTool}
          onClose={() => setReserveTool(null)}
          tool={reserveTool}
        />
      )}
    </div>
  );
}
