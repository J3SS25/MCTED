import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ToolFormModal } from './ToolFormModal';
import { SlidersHorizontal, Plus, Edit, Archive, Search } from 'lucide-react';
import { formatPHP } from '@mcteb/shared';
export function InventoryPage() {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTool, setEditingTool] = useState(null);
    const fetchInventory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search)
                params.append('search', search);
            params.append('limit', '50');
            const res = await apiRequest(`/tools?${params.toString()}`);
            setTools(res.items);
        }
        catch (err) {
            console.error('Failed to load inventory', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchInventory();
    }, []);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchInventory();
    };
    const handleArchive = async (tool) => {
        if (!confirm(`Are you sure you want to archive "${tool.name}"? It will no longer appear in the public catalog.`)) {
            return;
        }
        try {
            await apiRequest(`/tools/${tool.id}/archive`, { method: 'POST' });
            await fetchInventory();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Archive failed');
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Municipal Inventory Management" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Maintain tool listings, stock quantities, conditions, and catalog availability." })] }), _jsxs(Button, { onClick: () => {
                            setEditingTool(null);
                            setIsModalOpen(true);
                        }, className: "gap-2 self-start sm:self-auto", children: [_jsx(Plus, { className: "h-4 w-4" }), " Add New Tool"] })] }), _jsxs("form", { onSubmit: handleSearchSubmit, className: "flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-slate-400" }), _jsx("input", { type: "text", placeholder: "Search equipment by name or category...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent" })] }), _jsx(Button, { type: "submit", size: "md", children: "Search" })] }), loading ? (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-12 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-16 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-16 w-full rounded-xl" })] })) : tools.length === 0 ? (_jsx(EmptyState, { icon: _jsx(SlidersHorizontal, { className: "h-12 w-12 text-slate-400 stroke-1" }), title: "No inventory records", description: "No equipment found matching current filter." })) : (_jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-xs", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-700 dark:text-slate-300", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "Tool Name & Category" }), _jsx("th", { className: "px-4 py-3", children: "Availability" }), _jsx("th", { className: "px-4 py-3", children: "Condition" }), _jsx("th", { className: "px-4 py-3", children: "Available / Total" }), _jsx("th", { className: "px-4 py-3", children: "Daily Fee" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700/60", children: tools.map((tool) => (_jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-700/30", children: [_jsxs("td", { className: "px-4 py-3.5", children: [_jsx("div", { className: "font-semibold text-slate-900 dark:text-slate-100", children: tool.name }), _jsxs("div", { className: "text-[11px] text-slate-500", children: [tool.category, " ", tool.serial_number && `• ${tool.serial_number}`] })] }), _jsx("td", { className: "px-4 py-3.5", children: _jsx(Badge, { status: tool.availability_status }) }), _jsx("td", { className: "px-4 py-3.5", children: _jsx(Badge, { status: tool.condition_status }) }), _jsxs("td", { className: "px-4 py-3.5 font-medium", children: [tool.available_quantity, " / ", tool.total_quantity] }), _jsx("td", { className: "px-4 py-3.5 font-bold text-civic-forest dark:text-civic-light", children: formatPHP(tool.rental_fee_centavos) }), _jsxs("td", { className: "px-4 py-3.5 text-right space-x-1", children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
                                                        setEditingTool(tool);
                                                        setIsModalOpen(true);
                                                    }, children: _jsx(Edit, { className: "h-3.5 w-3.5" }) }), tool.availability_status !== 'Archived' && (_jsx(Button, { size: "sm", variant: "ghost", className: "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40", onClick: () => handleArchive(tool), children: _jsx(Archive, { className: "h-3.5 w-3.5" }) }))] })] }, tool.id))) })] }) }) })), _jsx(ToolFormModal, { isOpen: isModalOpen, onClose: () => {
                    setIsModalOpen(false);
                    setEditingTool(null);
                }, tool: editingTool, onSuccess: fetchInventory })] }));
}
//# sourceMappingURL=InventoryPage.js.map