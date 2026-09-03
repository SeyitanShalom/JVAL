"use client";

import { useState, type ReactNode } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { AdminModal } from "@/app/admin/components/AdminModal";

/**
 * Generic "Add" trigger for pages whose forms are not yet wired to the DB.
 * Accepts the form content as children and opens it in a modal.
 */
export function AddButton({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-bold text-white transition hover:bg-red-600"
      >
        <FiPlus aria-hidden="true" />
        {label}
      </button>
      <AdminModal
        title={title}
        description={description}
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        {children}
      </AdminModal>
    </>
  );
}

/**
 * Generic "Edit" trigger — opens its children in a modal.
 */
export function EditButton({
  title,
  description,
  compact,
  children,
}: {
  title: string;
  description?: string;
  compact?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-red-500 hover:text-red-500"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-red-500"
        }
      >
        Edit
      </button>
      <AdminModal
        title={title}
        description={description}
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        {children}
      </AdminModal>
    </>
  );
}

/**
 * Generic "Delete" confirmation button — opens a simple confirm modal.
 */
export function DeleteButton({
  title,
  itemLabel,
  action,
  disabled,
  disabledReason,
}: {
  title: string;
  itemLabel: string;
  action?: (formData?: FormData) => void | Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        title={disabled ? disabledReason : undefined}
      >
        Delete
      </button>
      <AdminModal title={title} isOpen={open} onClose={() => setOpen(false)}>
        <form
          action={action}
          onSubmit={() => setOpen(false)}
          className="grid gap-5"
        >
          <p className="text-sm font-semibold leading-6 text-slate-600">
            Are you sure you want to delete <strong>{itemLabel}</strong>? This
            action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-10 flex-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 flex-1 rounded-lg bg-red-600 text-xs font-bold text-white transition hover:bg-red-700"
            >
              Yes, delete
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}

/** Shared cancel/submit row used inside modals */
export function ModalActions({
  submitLabel,
  onCancel,
  disabled,
}: {
  submitLabel?: string;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-1">
      <button
        type="button"
        onClick={onCancel}
        className="h-10 flex-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="h-10 flex-1 rounded-lg bg-red-500 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitLabel ?? "Save"}
      </button>
    </div>
  );
}
