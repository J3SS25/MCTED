import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Search, Wrench, Filter } from 'lucide-react';
import type { Tool } from '@mcteb/shared';
import { formatPHP } from '@mcteb/shared';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Fishing', label: 'Fishing' },
  { value: 'Carpentry', label: 'Carpentry' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Emergency Response', label: 'Emergency Response' },
];

export function CatalogPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const res = await apiRequest<{ items: Tool[]; total: number }>(`/tools?${params.toString()}`);
      setTools(res.items);
    } catch (err) {
      console.error('Failed to load equipment catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  return (
    <div className="space-y-6">
      {/* Catalog Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Shared Equipment Catalog
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Municipal shared tools available for agricultural, carpentry, marine, and community project loans.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
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

        <div className="w-full md:w-64">
          <Select
            options={CATEGORIES}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
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
          title="No equipment found"
          description="Try modifying your search keywords or clearing your category filters."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setCategory('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => {
            const isAvailable = tool.availability_status === 'Available' && tool.available_quantity > 0;

            return (
              <Card key={tool.id} className="flex flex-col hover:shadow-md transition-shadow">
                <div className="h-48 bg-slate-100 dark:bg-slate-700/50 p-4 flex items-center justify-center relative overflow-hidden">
                  <img
                    src={tool.image_url || '/equipment/fallback.svg'}
                    alt={tool.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                    }}
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    <Badge status={tool.availability_status} />
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900/70 text-white backdrop-blur-sm">
                      {tool.category}
                    </span>
                  </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Rental Fee:</span>
                      <span className="font-bold text-civic-forest dark:text-civic-light text-sm">
                        {formatPHP(tool.rental_fee_centavos)} / day
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>Available Units:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {tool.available_quantity} of {tool.total_quantity}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link to={`/catalog/${tool.id}`} className="block w-full">
                      <Button variant="outline" size="sm" className="w-full">
                        View Details & Reserve
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

