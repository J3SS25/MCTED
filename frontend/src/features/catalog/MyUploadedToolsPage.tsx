import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useWishlistCart } from '../../lib/wishlist-cart-context';
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
import { Search, Plus, ArrowUpDown, SlidersHorizontal, Package } from 'lucide-react';
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
  { value: 'newest', label: 'Newest Uploaded' },
  { value: 'name_asc', label: 'Name (A – Z)' },
  { value: 'name_desc', label: 'Name (Z – A)' },
  { value: 'price_asc', label: 'Rental Fee: Low to High' },
  { value: 'price_desc', label: 'Rental Fee: High to Low' },
];

export function MyUploadedToolsPage() {
  const { user } = useAuth();
  const { isInWishlist, isInCart, toggleWishlist, addToCart } = useWishlistCart();

  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [reserveTool, setReserveTool] = useState<Tool | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const fetchMyTools = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('owner_id', user.id);
      if (search.trim()) params.append('search', search.trim());
      if (category) params.append('category', category);
      if (availability) params.append('availability', availability);
      if (sortBy) params.append('sort_by', sortBy);
      params.append('limit', '100');

      const res = await apiRequest<{ items: Tool[]; total: number }>(`/tools?${params.toString()}`);
      // Client-side guard ensuring only tools personally uploaded by this user are shown
      setTools(res.items.filter((item) => item.owner_id === user.id));
    } catch (err) {
      console.error('Failed to load uploaded tools', err);
    } finally {
      setLoading(false);
    }
  }, [user, search, category, availability, sortBy]);

  useEffect(() => {
    fetchMyTools();
  }, [fetchMyTools]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMyTools();
  };

  const handleDeleteTool = async (tool: Tool) => {
    if (!user || tool.owner_id !== user.id) {
      alert('You can only delete tools and equipment that you personally uploaded.');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to permanently remove "${tool.name}" from your uploads? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/tools/${tool.id}`, { method: 'DELETE' });
      setLocalToolImages(tool.id, null);
      setFeedbackBanner(`"${tool.name}" was deleted successfully.`);
      await fetchMyTools();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="h-6 w-6 text-civic-forest dark:text-civic-light" />
            My Uploaded Tools &amp; Equipment
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload, view, update, and manage only the tools and equipment you personally shared
            with the community.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditingTool(null);
            setIsFormOpen(true);
          }}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Upload Tool / Equipment
        </Button>
      </div>

      {feedbackBanner && (
        <Alert variant="success" onClose={() => setFeedbackBanner(null)}>
          {feedbackBanner}
        </Alert>
      )}

      {/* Category Filter */}
      <CategoryNav
        selectedCategory={category}
        onSelectCategory={setCategory}
        counts={category === '' ? categoryCounts : undefined}
      />

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search your tools by name, serial ID, or category..."
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
              aria-label="Sort uploaded tools"
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : tools.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12 text-slate-400 stroke-1" />}
          title="No uploaded tools yet"
          description="Share your tools and equipment with fellow community members. Only you can edit or delete your uploads."
          actionText="Upload Tool / Equipment"
          onAction={() => {
            setEditingTool(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => {
            const isOwner = Boolean(user && tool.owner_id === user.id);

            return (
              <ToolCard
                key={tool.id}
                tool={tool}
                inWishlist={isInWishlist(tool.id)}
                inCart={isInCart(tool.id)}
                canManage={isOwner}
                onSelect={(item) => setSelectedTool(item)}
                onToggleWishlist={(item) => {
                  const added = toggleWishlist(item);
                  setFeedbackBanner(
                    added
                      ? `"${item.name}" saved to your Wishlist.`
                      : `"${item.name}" removed from your Wishlist.`,
                  );
                }}
                onAddToCart={(item) => {
                  addToCart(item, 1);
                  setFeedbackBanner(`"${item.name}" added to your Borrowing Cart.`);
                }}
                onEdit={(item) => {
                  if (item.owner_id !== user?.id) return;
                  setEditingTool(item);
                  setIsFormOpen(true);
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
        canManage={Boolean(user && selectedTool && selectedTool.owner_id === user.id)}
        onEdit={(item) => {
          setEditingTool(item);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteTool}
        onReserve={(item) => setReserveTool(item)}
        onActionNotice={(msg) => setFeedbackBanner(msg)}
      />

      {/* Upload / Edit Tool Modal */}
      <ToolFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTool(null);
        }}
        tool={editingTool}
        onSuccess={() => {
          setFeedbackBanner(
            editingTool ? 'Tool & equipment details updated.' : 'Tool uploaded successfully.',
          );
          fetchMyTools();
        }}
      />

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
