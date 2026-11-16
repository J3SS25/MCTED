import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Edit, Trash2, Tag, UserCheck, Building2 } from 'lucide-react';
import type { Tool } from '@mcteb/shared';
import { formatPHP } from '@mcteb/shared';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { resolveToolImage } from '../../lib/local-storage';

interface ToolCardProps {
  tool: Tool;
  inWishlist: boolean;
  inCart: boolean;
  canManage: boolean;
  onToggleWishlist: (tool: Tool) => void;
  onAddToCart: (tool: Tool) => void;
  onEdit?: (tool: Tool) => void;
  onDelete?: (tool: Tool) => void;
}

export function ToolCard({
  tool,
  inWishlist,
  inCart,
  canManage,
  onToggleWishlist,
  onAddToCart,
  onEdit,
  onDelete,
}: ToolCardProps) {
  const isAvailable = tool.availability_status === 'Available' && tool.available_quantity > 0;
  const discountPercent = tool.discount_percent ?? 0;
  const effectiveFeeCentavos =
    discountPercent > 0
      ? Math.round(tool.rental_fee_centavos * (1 - discountPercent / 100))
      : tool.rental_fee_centavos;
  const imageSrc = resolveToolImage(tool);

  return (
    <Card className="flex flex-col h-full group hover:shadow-lg hover:border-civic-accent/50 transition-all duration-200 overflow-hidden">
      {/* Image Header + Badges */}
      <div className="h-48 bg-slate-100 dark:bg-slate-700/50 p-4 flex items-center justify-center relative overflow-hidden">
        <img
          src={imageSrc}
          alt={tool.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
          }}
        />

        {/* Top-Left Wishlist & Discount Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleWishlist(tool)}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            title={inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
            className={`p-2 rounded-full shadow-sm border transition-colors ${
              inWishlist
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white/90 dark:bg-slate-800/90 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:text-rose-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>

          {discountPercent > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
              <Tag className="h-3 w-3" /> {discountPercent}% OFF
            </span>
          ) : tool.rental_fee_centavos === 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
              FREE LOAN
            </span>
          ) : null}
        </div>

        {/* Top-Right Status Badge */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          <Badge status={tool.availability_status} />
        </div>

        {/* Bottom Category & Ownership Badges */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900/75 text-white backdrop-blur-sm truncate">
            {tool.category}
          </span>
          {tool.owner_name && tool.owner_role === 'Borrower' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-600/90 text-white backdrop-blur-sm truncate max-w-[55%]">
              <UserCheck className="h-3 w-3 flex-shrink-0" /> {tool.owner_name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/85 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 backdrop-blur-sm">
              <Building2 className="h-3 w-3 flex-shrink-0" /> Municipal
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/catalog/${tool.id}`} className="hover:text-civic-deep dark:hover:text-civic-light">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                {tool.name}
              </h3>
            </Link>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem]">
            {tool.description}
          </p>
          <div className="pt-1">
            <Badge status={tool.condition_status} className="text-[10px] px-2 py-0" />
          </div>
        </div>

        {/* Pricing & Units */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Daily Rental Fee:</span>
            <div className="text-right">
              {discountPercent > 0 && (
                <span className="text-[11px] text-slate-400 line-through mr-1.5">
                  {formatPHP(tool.rental_fee_centavos)}
                </span>
              )}
              <span className="font-bold text-civic-forest dark:text-civic-light text-sm">
                {formatPHP(effectiveFeeCentavos)}
              </span>
              <span className="text-[10px] text-slate-400"> / day</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Stock Available:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {tool.available_quantity} of {tool.total_quantity} unit(s)
            </span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={inCart ? 'secondary' : 'primary'}
              disabled={!isAvailable}
              onClick={() => onAddToCart(tool)}
              className="gap-1.5 w-full"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {inCart ? 'In Cart (+1)' : isAvailable ? 'Add to Cart' : 'Unavailable'}
            </Button>

            <Link to={`/catalog/${tool.id}`} className="block w-full">
              <Button variant="outline" size="sm" className="w-full">
                Details
              </Button>
            </Link>
          </div>

          {canManage && (onEdit || onDelete) && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => onEdit(tool)}
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                  onClick={() => onDelete(tool)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
