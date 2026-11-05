import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ReservationFormModal } from '../reservations/ReservationFormModal';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { formatPHP } from '@mcteb/shared';
export function ToolDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tool, setTool] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reserveModalOpen, setReserveModalOpen] = useState(false);
    useEffect(() => {
        async function loadData() {
            try {
                if (!id)
                    return;
                const [toolData, reviewData] = await Promise.all([
                    apiRequest(`/tools/${id}`),
                    apiRequest(`/feedback/public?tool_id=${id}`),
                ]);
                setTool(toolData);
                setReviews(reviewData);
            }
            catch (err) {
                console.error('Failed to load tool detail', err);
            }
            finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);
    if (loading) {
        return (_jsxs("div", { className: "space-y-6 max-w-5xl mx-auto", children: [_jsx(Skeleton, { className: "h-6 w-32" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [_jsx(Skeleton, { className: "h-80 rounded-2xl" }), _jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-8 w-3/4" }), _jsx(Skeleton, { className: "h-4 w-1/3" }), _jsx(Skeleton, { className: "h-24 w-full" }), _jsx(Skeleton, { className: "h-10 w-40" })] })] })] }));
    }
    if (!tool) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-800 dark:text-slate-200", children: "Equipment item not found" }), _jsx(Link, { to: "/catalog", className: "text-civic-deep dark:text-civic-light hover:underline mt-2 inline-block", children: "Return to catalog" })] }));
    }
    const isAvailable = tool.availability_status === 'Available' && tool.available_quantity > 0;
    return (_jsxs("div", { className: "space-y-8 max-w-5xl mx-auto", children: [_jsxs(Link, { to: "/catalog", className: "inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), " Back to Equipment Catalog"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8 items-start", children: [_jsx("div", { className: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex items-center justify-center min-h-[360px]", children: _jsx("img", { src: tool.image_url || '/equipment/fallback.svg', alt: tool.name, className: "max-h-[300px] max-w-full object-contain", onError: (e) => {
                                e.target.src = '/equipment/fallback.svg';
                            } }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300", children: tool.category }), _jsx(Badge, { status: tool.availability_status }), _jsx(Badge, { status: tool.condition_status })] }), _jsx("h1", { className: "text-2xl font-bold text-slate-900 dark:text-slate-100", children: tool.name }), tool.serial_number && (_jsxs("p", { className: "text-xs font-mono text-slate-400 mt-1", children: ["Serial No: ", tool.serial_number] }))] }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300 leading-relaxed", children: tool.description }), tool.specifications && (_jsxs("div", { className: "p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800", children: [_jsx("h4", { className: "text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2", children: "Technical Specifications" }), _jsx("p", { className: "text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line", children: tool.specifications })] })), _jsxs("div", { className: "grid grid-cols-2 gap-4 p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Daily Rental Fee" }), _jsx("p", { className: "text-xl font-bold text-civic-forest dark:text-civic-light", children: formatPHP(tool.rental_fee_centavos) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Security Deposit" }), _jsx("p", { className: "text-lg font-semibold text-slate-700 dark:text-slate-300", children: formatPHP(tool.deposit_fee_centavos) })] })] }), _jsx("div", { className: "pt-2", children: !user ? (_jsxs("div", { className: "space-y-2", children: [_jsx(Button, { className: "w-full", onClick: () => navigate('/login', { state: { from: { pathname: `/catalog/${tool.id}` } } }), children: "Sign In to Reserve Equipment" }), _jsx("p", { className: "text-center text-xs text-slate-500", children: "Residency in Basco required for equipment loans" })] })) : user.role === 'Borrower' ? (_jsx(Button, { className: "w-full", size: "lg", disabled: !isAvailable, onClick: () => setReserveModalOpen(true), children: isAvailable ? 'Request Reservation' : 'Currently Unavailable' })) : (_jsx(Link, { to: "/staff/inventory", className: "block w-full", children: _jsx(Button, { variant: "outline", className: "w-full", children: "Manage Tool in Inventory" }) })) })] })] }), _jsxs("div", { className: "pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "h-5 w-5 text-civic-accent" }), _jsxs("h3", { className: "text-lg font-bold text-slate-900 dark:text-slate-100", children: ["Borrower Reviews (", reviews.length, ")"] })] }), reviews.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 italic", children: "No public feedback submitted for this item yet." })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: reviews.map((rev) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 space-y-2 text-xs", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "font-semibold text-slate-800 dark:text-slate-200", children: [rev.reviewer_name, " (Brgy. ", rev.reviewer_barangay, ")"] }), _jsxs("div", { className: "flex items-center text-amber-500", children: [_jsx(Star, { className: "h-3.5 w-3.5 fill-current" }), _jsxs("span", { className: "ml-1 font-bold", children: [rev.overall_rating, "/5"] })] })] }), _jsxs("p", { className: "text-slate-600 dark:text-slate-300 italic", children: ["\"", rev.comments, "\""] })] }) }, rev.id))) }))] }), tool && (_jsx(ReservationFormModal, { isOpen: reserveModalOpen, onClose: () => setReserveModalOpen(false), tool: tool }))] }));
}
//# sourceMappingURL=ToolDetailPage.js.map