import React from 'react';
import type { UserRole } from '@mcteb/shared';
export interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}
export declare function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps): React.JSX.Element;
//# sourceMappingURL=ProtectedRoute.d.ts.map