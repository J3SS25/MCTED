import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Search } from 'lucide-react';
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
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const fetchCatalog = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search)
                params.append('search', search);
            if (category)
                params.append('category', category);
            const res = await apiRequest(`/tools?${params.toString()}`);
            setTools(res.items);
        }
        catch (err) {
            console.error('Failed to load equipment catalog', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchCatalog();
    }, [category]);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchCatalog();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Shared Equipment Catalog" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Municipal shared tools available for agricultural, carpentry, marine, and community project loans." })] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between", children: [_jsxs("form", { onSubmit: handleSearchSubmit, className: "flex-1 w-full flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-slate-400" }), _jsx("input", { type: "text", placeholder: "Search by tool name, specifications, or category...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent" })] }), _jsx(Button, { type: "submit", size: "md", children: "Search" })] }), _jsx("div", { className: "w-full md:w-64", children: _jsx(Select, { options: CATEGORIES, value: category, onChange: (e) => setCategory(e.target.value) }) })] }), loading ? (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: [_jsx(CardSkeleton, {}), _jsx(CardSkeleton, {}), _jsx(CardSkeleton, {}), _jsx(CardSkeleton, {})] })) : tools.length === 0 ? (_jsx(EmptyState, { title: "No equipment found", description: "Try modifying your search keywords or clearing your category filters.", actionText: "Clear Filters", onAction: () => {
                    setSearch('');
                    setCategory('');
                } })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: tools.map((tool) => {
                    const isAvailable = tool.availability_status === 'Available' && tool.available_quantity > 0;
                    return (_jsxs(Card, { className: "flex flex-col hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "h-48 bg-slate-100 dark:bg-slate-700/50 p-4 flex items-center justify-center relative overflow-hidden", children: [_jsx("img", { src: tool.image_url || '/equipment/fallback.svg', alt: tool.name, className: "max-h-full max-w-full object-contain", onError: (e) => {
                                            e.target.src = '/equipment/fallback.svg';
                                        } }), _jsx("div", { className: "absolute top-3 right-3 flex flex-col gap-1 items-end", children: _jsx(Badge, { status: tool.availability_status }) }), _jsx("div", { className: "absolute bottom-3 left-3", children: _jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900/70 text-white backdrop-blur-sm", children: tool.category }) })] }), _jsxs(CardContent, { className: "p-5 flex-1 flex flex-col justify-between space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1", children: tool.name }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2", children: tool.description })] }), _jsxs("div", { className: "pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2 text-xs", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "Rental Fee:" }), _jsxs("span", { className: "font-bold text-civic-forest dark:text-civic-light text-sm", children: [formatPHP(tool.rental_fee_centavos), " / day"] })] }), _jsxs("div", { className: "flex justify-between items-center text-slate-500 dark:text-slate-400", children: [_jsx("span", { children: "Available Units:" }), _jsxs("span", { className: "font-medium text-slate-700 dark:text-slate-300", children: [tool.available_quantity, " of ", tool.total_quantity] })] })] }), _jsx("div", { className: "pt-2", children: _jsx(Link, { to: `/catalog/${tool.id}`, className: "block w-full", children: _jsx(Button, { variant: "outline", size: "sm", className: "w-full", children: "View Details & Reserve" }) }) })] })] }, tool.id));
                }) }))] }));
}
//# sourceMappingURL=CatalogPage.js.map