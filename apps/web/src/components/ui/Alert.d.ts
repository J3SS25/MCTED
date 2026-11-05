import React from 'react';
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'info' | 'success' | 'warning' | 'error';
    title?: string;
}
export declare function Alert({ variant, title, children, className, ...props }: AlertProps): React.JSX.Element;
//# sourceMappingURL=Alert.d.ts.map