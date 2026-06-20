"use client";

import type { ReactNode } from "react";

/*
  conversion-fields — the form field primitives for the Fortress conversion
  pages (Contact / Consultation). Wave-0 has no input styles, so these are
  built from the Wave-0 token system: raised `--surface` fields, `--line`
  hairlines, brass focus (the global focus-visible ring recolors per band),
  and AA-contrast labels (`--ink`) and error text. Designed for mobile first:
  large (52px) tap targets, 16px+ font (no iOS zoom), full-width reflow.

  Every field renders its own label, optional hint, and error region wired with
  aria-invalid + aria-describedby so the form is fully screen-reader navigable.
*/

/*
  Error ink: a deep brick red chosen to sit inside the Slate & Brass palette
  rather than a loud retail red. Verified AA on both --surface (7.13) and
  --paper (6.54). Kept local so we don't edit the frozen globals.css.
*/
const ERROR_INK = "#9b2c22";

const FIELD_BASE =
  "w-full rounded-[12px] border bg-[var(--surface)] px-4 py-3.5 text-[1rem] leading-6 text-[var(--ink)] transition-colors duration-200 placeholder:text-[var(--faint)] placeholder:opacity-80 min-h-[52px]";

function borderClass(invalid?: boolean) {
  return invalid
    ? "border-[#9b2c22] focus:border-[#9b2c22]"
    : "border-[var(--line-strong)] hover:border-[var(--ink)] focus:border-[var(--accent-ink)]";
}

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
};

/** Label + hint + control slot + error region — shared chrome for every field. */
export function FieldShell({
  id,
  label,
  required = false,
  hint,
  error,
  children,
  className = "",
}: FieldShellProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-3 text-[0.82rem] font-semibold tracking-[0.01em] text-[var(--ink)]"
      >
        <span>
          {label}
          {required ? (
            <span className="ml-1 text-[var(--accent-ink)]" aria-hidden="true">
              *
            </span>
          ) : (
            <span className="ml-2 font-medium text-[var(--faint)]">Optional</span>
          )}
        </span>
      </label>
      {hint ? (
        <p id={hintId} className="-mt-0.5 text-[0.8rem] leading-6 text-[var(--faint)]">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p
          id={errorId}
          role="alert"
          style={{ color: ERROR_INK }}
          className="flex items-center gap-1.5 text-[0.8rem] font-medium"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 flex-none"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.3" />
            <path
              d="M8 5v3.6M8 11h.01"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type BaseInputProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
};

function describedBy(id: string, hint?: ReactNode, error?: string) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(
    Boolean
  );
  return ids.length ? ids.join(" ") : undefined;
}

export function TextField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  required,
  hint,
  error,
  className = "",
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
}: BaseInputProps & {
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  placeholder?: string;
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={required || undefined}
        className={`${FIELD_BASE} ${borderClass(Boolean(error))}`}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  required,
  hint,
  error,
  className = "",
  options,
  placeholder = "Select one",
}: BaseInputProps & {
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          aria-required={required || undefined}
          className={`${FIELD_BASE} appearance-none pr-11 ${borderClass(
            Boolean(error)
          )} ${value ? "" : "text-[var(--faint)]"}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-[var(--ink)]">
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 16 16"
          className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </FieldShell>
  );
}

export function TextAreaField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  required,
  hint,
  error,
  className = "",
  rows = 5,
  placeholder,
  maxLength,
}: BaseInputProps & {
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={required || undefined}
        className={`${FIELD_BASE} resize-y leading-7 ${borderClass(Boolean(error))}`}
      />
    </FieldShell>
  );
}
