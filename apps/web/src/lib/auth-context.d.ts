import React from 'react';
import type { User, LoginInput, RegisterUserInput } from '@mcteb/shared';
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: LoginInput) => Promise<void>;
    register: (data: RegisterUserInput) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
//# sourceMappingURL=auth-context.d.ts.map