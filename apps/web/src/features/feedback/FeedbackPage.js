import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { SubmitFeedbackModal } from './SubmitFeedbackModal';
import { MessageSquare, Star, PlusCircle, Eye, EyeOff } from 'lucide-react';
import { formatDate } from '@mcteb/shared';
export function FeedbackPage() {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const isStaffOrAdmin = user?.role === 'Municipal Staff' || user?.role === 'Administrator';
    const fetchReviews = async () => {
        setLoading(true);
        try {
            const endpoint = isStaffOrAdmin ? '/feedback/all' : '/feedback/public';
            const data = await apiRequest(endpoint);
            setReviews(data);
        }
        catch (err) {
            console.error('Failed to load feedback', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReviews();
    }, [user]);
    const toggleModeration = async (review) => {
        try {
            await apiRequest(`/feedback/${review.id}/moderate`, {
                method: 'PATCH',
                body: JSON.stringify({ is_public: !review.is_public }),
            });
            await fetchReviews();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Moderation action failed');
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Resident Feedback & Tool Reviews" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Read authentic feedback from Basco residents on equipment condition and civic service." })] }), user?.role === 'Borrower' && (_jsxs(Button, { onClick: () => setIsSubmitModalOpen(true), className: "gap-2 self-start sm:self-auto", children: [_jsx(PlusCircle, { className: "h-4 w-4" }), " Share Your Experience"] }))] }), loading ? (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(Skeleton, { className: "h-32 rounded-xl" }), _jsx(Skeleton, { className: "h-32 rounded-xl" })] })) : reviews.length === 0 ? (_jsx(EmptyState, { icon: _jsx(MessageSquare, { className: "h-12 w-12 text-slate-400 stroke-1" }), title: "No reviews posted yet", description: "Be the first to submit a review for borrowed equipment." })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: reviews.map((rev) => (_jsx(Card, { className: "flex flex-col justify-between", children: _jsxs(CardContent, { className: "p-5 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-bold text-sm text-slate-900 dark:text-slate-100", children: rev.tool_name }), _jsxs("p", { className: "text-xs text-slate-500", children: [rev.reviewer_name, " \u2022 Brgy. ", rev.reviewer_barangay, " \u2022 ", formatDate(rev.created_at)] })] }), _jsxs("div", { className: "flex items-center text-amber-500", children: [_jsx(Star, { className: "h-4 w-4 fill-current" }), _jsxs("span", { className: "ml-1 text-sm font-bold text-slate-800 dark:text-slate-200", children: [rev.overall_rating, "/5"] })] })] }), _jsxs("div", { className: "flex gap-4 text-[11px] text-slate-500 border-y border-slate-100 dark:border-slate-700/60 py-2", children: [_jsxs("span", { children: ["Condition: ", _jsxs("strong", { children: [rev.tool_condition_rating, "/5"] })] }), _jsxs("span", { children: ["Service: ", _jsxs("strong", { children: [rev.service_rating, "/5"] })] }), isStaffOrAdmin && (_jsxs("span", { children: ["Status: ", _jsx(Badge, { status: rev.is_public ? 'Available' : 'Archived', children: rev.is_public ? 'Public' : 'Hidden' })] }))] }), _jsxs("p", { className: "text-xs text-slate-700 dark:text-slate-300 italic", children: ["\"", rev.comments, "\""] }), isStaffOrAdmin && (_jsx("div", { className: "pt-2 flex justify-end", children: _jsx(Button, { size: "sm", variant: "outline", className: "gap-1.5 text-xs", onClick: () => toggleModeration(rev), children: rev.is_public ? (_jsxs(_Fragment, { children: [_jsx(EyeOff, { className: "h-3.5 w-3.5" }), " Hide Review"] })) : (_jsxs(_Fragment, { children: [_jsx(Eye, { className: "h-3.5 w-3.5" }), " Make Public"] })) }) }))] }) }, rev.id))) })), _jsx(SubmitFeedbackModal, { isOpen: isSubmitModalOpen, onClose: () => setIsSubmitModalOpen(false), onSuccess: fetchReviews })] }));
}
//# sourceMappingURL=FeedbackPage.js.map