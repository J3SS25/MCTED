import React from 'react';
import {
  LayoutGrid,
  Sprout,
  Anchor,
  Hammer,
  HardHat,
  Zap,
  Gauge,
  Siren,
} from 'lucide-react';
import { TOOL_CATEGORIES } from '@mcteb/shared';

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  counts?: Record<string, number>;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  '': <LayoutGrid className="h-4 w-4" />,
  Agriculture: <Sprout className="h-4 w-4" />,
  Fishing: <Anchor className="h-4 w-4" />,
  Carpentry: <Hammer className="h-4 w-4" />,
  Construction: <HardHat className="h-4 w-4" />,
  Electrical: <Zap className="h-4 w-4" />,
  'Power Equipment': <Gauge className="h-4 w-4" />,
  'Emergency Response': <Siren className="h-4 w-4" />,
};

export function CategoryNav({ selectedCategory, onSelectCategory, counts }: CategoryNavProps) {
  const categories = ['', ...TOOL_CATEGORIES];

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-sm">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          const label = cat === '' ? 'All Equipment' : cat;
          const count = counts ? (cat === '' ? counts.__total : counts[cat]) : undefined;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-civic-forest text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              {CATEGORY_ICONS[cat] || <LayoutGrid className="h-4 w-4" />}
              <span>{label}</span>
              {count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
