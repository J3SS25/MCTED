import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlistCart } from '../../lib/wishlist-cart-context';
import { resolveToolImage } from '../../lib/local-storage';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Heart, ShoppingCart, Trash2, ArrowRight, Tag } from 'lucide-react';
import { formatPHP } from '@mcteb/shared';

export function WishlistPage() {
  const {
    wishlist,
    removeFromWishlist,
    moveWishlistItemToCart,
    moveAllWishlistToCart,
    clearWishlist,
  } = useWishlistCart();
  const [banner, setBanner] = useState<string | null>(null);

  const movableCount = wishlist.filter(
    (w) => w.tool.availability_status === 'Available' && w.tool.available_quantity > 0,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Saved Wishlist
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Save tools and equipment for upcoming projects, then move them directly to your borrowing cart.
          </p>
        </div>

        {wishlist.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {movableCount > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  moveAllWishlistToCart();
                  setBanner(`Moved ${movableCount} available item(s) directly to your Borrowing Cart.`);
                }}
                className="gap-1.5"
              >
                <ShoppingCart className="h-4 w-4" /> Move All Available to Cart ({movableCount})
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearWishlist();
                setBanner('Wishlist cleared.');
              }}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Clear Wishlist
            </Button>
          </div>
        )}
      </div>

      {banner && (
        <Alert variant="success" onClose={() => setBanner(null)}>
          <div className="flex items-center justify-between gap-4">
            <span>{banner}</span>
            <Link to="/cart" className="font-semibold underline inline-flex items-center gap-1 whitespace-nowrap">
              Go to Cart <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Alert>
      )}

      {wishlist.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-12 w-12 text-rose-400 stroke-1" />}
          title="Your wishlist is empty"
          description="Browse the equipment catalog and click the heart icon on any tool to save it here."
          actionText="Browse Catalog"
          onAction={() => (window.location.href = '/catalog')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map(({ tool }) => {
            const isAvailable = tool.availability_status === 'Available' && tool.available_quantity > 0;
            const discountPercent = tool.discount_percent ?? 0;
            const effectiveFee =
              discountPercent > 0
                ? Math.round(tool.rental_fee_centavos * (1 - discountPercent / 100))
                : tool.rental_fee_centavos;

            return (
              <Card key={tool.id} className="flex flex-col overflow-hidden">
                <div className="h-44 bg-slate-100 dark:bg-slate-700/50 p-4 flex items-center justify-center relative">
                  <img
                    src={resolveToolImage(tool)}
                    alt={tool.name}
                    className="max-h-full max-w-full object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <Badge status={tool.availability_status} />
                  </div>
                  {discountPercent > 0 && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      <Tag className="h-3 w-3" /> {discountPercent}% OFF
                    </span>
                  )}
                </div>

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-civic-deep dark:text-civic-light">
                      {tool.category}
                    </p>
                    <Link to={`/catalog/${tool.id}`} className="hover:underline">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                        {tool.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Rate: </span>
                      <span className="font-bold text-civic-forest dark:text-civic-light">
                        {formatPHP(effectiveFee)}/day
                      </span>
                    </div>
                    <span className="text-slate-500">
                      {tool.available_quantity} / {tool.total_quantity} left
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5"
                      disabled={!isAvailable}
                      onClick={() => {
                        moveWishlistItemToCart(tool.id, 1);
                        setBanner(`Moved "${tool.name}" from Wishlist to your Borrowing Cart.`);
                      }}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {isAvailable ? 'Move to Cart' : 'Unavailable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Remove ${tool.name} from wishlist`}
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => {
                        removeFromWishlist(tool.id);
                        setBanner(`Removed "${tool.name}" from Wishlist.`);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
