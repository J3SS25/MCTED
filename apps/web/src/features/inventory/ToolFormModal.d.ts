import React from 'react';
import type { Tool } from '@mcteb/shared';
interface ToolFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    tool?: Tool | null;
    onSuccess: () => void;
}
export declare function ToolFormModal({ isOpen, onClose, tool, onSuccess }: ToolFormModalProps): React.JSX.Element;
export {};
//# sourceMappingURL=ToolFormModal.d.ts.map