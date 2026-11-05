import React from 'react';
export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
}
export declare function EmptyState({ icon, title, description, actionText, onAction, }: EmptyStateProps): React.JSX.Element;
//# sourceMappingURL=EmptyState.d.ts.map