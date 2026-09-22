"use client";

import type { ChangeEvent, ComponentPropsWithoutRef } from "react";

type AutoSubmitFilterFormProps = ComponentPropsWithoutRef<"form">;

export default function AutoSubmitFilterForm({
  children,
  onChange,
  ...props
}: AutoSubmitFilterFormProps) {
  function handleChange(event: ChangeEvent<HTMLFormElement>) {
    onChange?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const target = event.target;
    const shouldSubmit =
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLInputElement &&
        (target.type === "checkbox" || target.type === "radio"));

    if (!shouldSubmit) {
      return;
    }

    const form = event.currentTarget;

    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
      return;
    }

    form.submit();
  }

  return (
    <form {...props} onChange={handleChange}>
      {children}
    </form>
  );
}
