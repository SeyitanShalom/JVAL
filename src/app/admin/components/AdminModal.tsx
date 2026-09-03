"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { FiX } from "react-icons/fi";

interface AdminModalProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function AdminModal({
  title,
  description,
  isOpen,
  onClose,
  children,
}: AdminModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync open/close with the native <dialog> element
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // Allow closing by clicking the backdrop
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  // Allow closing with Escape key
  function handleCancel(e: React.SyntheticEvent<HTMLDialogElement>) {
    e.preventDefault();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-0 h-full w-full max-w-none border-none bg-transparent p-0 backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm open:flex open:items-center open:justify-center"
    >
      {/* Modal panel */}
      <div
        className="relative mx-3 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl sm:mx-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-950 sm:text-lg">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 sm:h-10 sm:w-9"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto px-4 py-4 sm:max-h-[calc(100dvh-10rem)] sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </dialog>
  );
}

// Trigger button used in AdminPageHeader's action slot
interface AdminModalTriggerProps {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

export function AdminModalTrigger({
  label,
  icon,
  disabled,
  onClick,
}: AdminModalTriggerProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {icon}
      {label}
    </button>
  );
}
