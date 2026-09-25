"use client";

import { forwardRef, useEffect, useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-[360px]",
  md: "max-w-[480px]",
  lg: "max-w-[640px]",
  xl: "max-w-[800px]",
  full: "max-w-[90vw]",
};

function ModalHeaderRow(props: {
  title?: string;
  description?: string;
  showCloseButton: boolean;
  onClose: () => void;
}) {
  const { title, description, showCloseButton, onClose } = props;
  if (!title && !showCloseButton) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--ds-line)] p-[var(--ds-space-4)]">
      <div>
        {title ? (
          <h2 id="modal-title" className="text-[var(--ds-text-h2)] font-semibold text-[var(--ds-ink)]">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p id="modal-description" className="mt-1 text-[var(--ds-text-sm)] text-[var(--ds-ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {showCloseButton ? (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "rounded-[var(--ds-radius-full)] p-2",
            "text-[var(--ds-ink-muted)] hover:text-[var(--ds-ink)]",
            "hover:bg-[var(--ds-line)]",
            "transition-colors duration-[var(--ds-motion-fast)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-brand)]",
          )}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
    className,
    isOpen,
    onClose,
    title,
    description,
    size = "md",
    children,
    showCloseButton = true,
    closeOnOverlayClick = true,
  closeOnEscape = true,
  ...props
},
ref,
) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const scope = dialogRef.current;
    const focusables = scope?.querySelectorAll<HTMLElement>(FOCUSABLE);
    (focusables && focusables.length ? focusables[0] : scope)?.focus();
    return () => previous?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && closeOnEscape) {
      onClose();
      return;
    }
    // Focus trap: keep Tab cycling inside the dialog.
    if (event.key === "Tab" && dialogRef.current) {
      const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function handleOverlayClick() {
    if (closeOnOverlayClick) {
      onClose();
    }
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full -translate-x-1/2 -translate-y-1/2 overflow-hidden",
          "rounded-[var(--ds-radius-lg)] bg-[var(--ds-surface)]",
          "shadow-[var(--ds-shadow-strong)]",
          sizeClasses[size],
          className,
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <ModalHeaderRow
          title={title}
          description={description}
          showCloseButton={showCloseButton}
          onClose={onClose}
        />
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-[var(--ds-space-4)]">
          {children}
        </div>
      </div>
    </div>
  );
});

Modal.displayName = "Modal";

export const ModalHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function ModalHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("mb-4 flex items-center justify-between border-b border-[var(--ds-line)] pb-4", className)}
        {...props}
      />
    );
  },
);
ModalHeader.displayName = "ModalHeader";

export const ModalTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function ModalTitle({ className, ...props }, ref) {
    return (
      <h2
        ref={ref}
        className={cn("text-[var(--ds-text-h2)] font-semibold text-[var(--ds-ink)]", className)}
        {...props}
      />
    );
  },
);
ModalTitle.displayName = "ModalTitle";

export const ModalDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function ModalDescription({ className, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={cn("mt-1 text-[var(--ds-text-sm)] text-[var(--ds-ink-muted)]", className)}
        {...props}
      />
    );
  },
);
ModalDescription.displayName = "ModalDescription";

export const ModalContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function ModalContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("pt-0", className)} {...props} />;
  },
);
ModalContent.displayName = "ModalContent";

export const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function ModalFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("mt-auto flex items-center justify-end gap-3 border-t border-[var(--ds-line)] pt-4", className)}
        {...props}
      />
    );
  },
);
ModalFooter.displayName = "ModalFooter";

export { Modal as UIModal };
