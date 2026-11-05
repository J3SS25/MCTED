import React from 'react';
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}
export declare function Modal({ isOpen, onClose, title, children, maxWidth }: ModalProps): React.JSX.Element | null;
//# sourceMappingURL=Modal.d.ts.map