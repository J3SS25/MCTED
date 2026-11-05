import React from 'react';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status?: string;
    variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}
export declare function Badge({ className, status, variant, children, ...props }: BadgeProps): React.JSX.Element;
//# sourceMappingURL=Badge.d.ts.map