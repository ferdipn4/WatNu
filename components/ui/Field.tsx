"use client";

import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { useT } from "@/app/_lib/i18n";
import { Icon, cx } from "./Icon";

export interface FieldProps {
  label?: string;
  id?: string;
  /** text (default) · textarea · select · search · switch */
  kind?: "text" | "textarea" | "select" | "search" | "switch";
  value?: string;
  placeholder?: string;
  /** switch only */
  checked?: boolean;
  /** amber ground and border: the AI could not read this from the poster */
  missing?: boolean;
  /** under the control; a missing field gets a default hint */
  hint?: string;
  /** small text right of the label, e.g. "AI guess" */
  trailing?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches design/components/index.d.ts exactly
  onChange?: (value: any) => void;
  /** select only */
  onOpen?: () => void;
  type?: string;
  inputMode?: string;
  className?: string;
}

const INPUT_SHAPE =
  "flex h-11 w-full items-center gap-2 rounded-xl px-3 text-[15px] font-medium leading-5 text-ink placeholder:text-ink-muted focus:outline-none focus:shadow-ring focus-within:shadow-ring";

function controlToneClasses(missing?: boolean) {
  return missing ? "border-[1.5px] border-warn-line bg-warn-soft placeholder:text-warn" : "border border-line bg-surface-raised";
}

/** Every input in the create flow and the directory search. */
export function Field({
  label,
  id,
  kind = "text",
  value,
  placeholder,
  checked,
  missing,
  hint,
  trailing,
  onChange,
  onOpen,
  type,
  inputMode,
  className,
}: FieldProps) {
  const t = useT();
  const resolvedHint = hint ?? (missing ? t("field.missing") : undefined);
  const hintEl = resolvedHint ? (
    <span className={cx("flex items-center gap-1 text-xs font-medium leading-4 text-ink-muted", missing && "text-warn")}>
      {missing ? <Icon name="warning" size={14} /> : null}
      {resolvedHint}
    </span>
  ) : null;

  const labelEl = label ? (
    <label htmlFor={id} className="flex items-center justify-between text-[13px] font-semibold leading-4 text-ink-muted">
      <span>{label}</span>
      {trailing ? <span>{trailing}</span> : null}
    </label>
  ) : null;

  if (kind === "switch") {
    return (
      <div className={cx("flex flex-col gap-1.5", className)}>
        <div className="flex min-h-11 items-center justify-between gap-3">
          <span className="text-[15px] font-semibold leading-5 text-ink">{label}</span>
          <button
            type="button"
            role="switch"
            aria-checked={checked ? "true" : "false"}
            aria-label={label}
            onClick={() => onChange?.(!checked)}
            className={cx(
              "relative h-7 w-[46px] flex-none rounded-full p-0 transition-colors focus-visible:outline-none focus-visible:shadow-ring",
              checked ? "bg-accent" : "bg-line",
            )}
          >
            <span
              className={cx(
                "absolute top-[3px] left-[3px] h-[22px] w-[22px] rounded-full bg-surface-raised shadow-[0_1px_2px_#0000002e] transition-transform",
                checked && "translate-x-[18px]",
              )}
            />
          </button>
        </div>
        {hintEl}
      </div>
    );
  }

  const handleChange = onChange ? (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value) : undefined;

  let control: ReactNode;
  if (kind === "textarea") {
    control = (
      <textarea
        id={id}
        className={cx(INPUT_SHAPE, controlToneClasses(missing), "h-auto min-h-[88px] resize-none py-2.5 text-[15px] font-normal leading-[22px]")}
        placeholder={placeholder}
        value={value ?? ""}
        readOnly={!onChange}
        onChange={handleChange}
      />
    );
  } else if (kind === "select") {
    control = (
      <button type="button" id={id} onClick={onOpen} className={cx(INPUT_SHAPE, controlToneClasses(missing), "cursor-pointer justify-between")}>
        <span>{value || placeholder}</span>
        <Icon name="chevron-down" className="text-ink-muted" />
      </button>
    );
  } else if (kind === "search") {
    control = (
      <div className={cx(INPUT_SHAPE, "border border-transparent bg-surface-sunken text-ink-muted")}>
        <Icon name="search" />
        <input
          id={id}
          type="search"
          placeholder={placeholder}
          value={value ?? ""}
          readOnly={!onChange}
          onChange={handleChange}
          aria-label={label || placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] font-medium text-ink focus:outline-none"
        />
      </div>
    );
  } else {
    control = (
      <input
        id={id}
        type={type || "text"}
        className={cx(INPUT_SHAPE, controlToneClasses(missing))}
        placeholder={placeholder}
        value={value ?? ""}
        readOnly={!onChange}
        onChange={handleChange}
        inputMode={inputMode as InputHTMLAttributes<HTMLInputElement>["inputMode"]}
      />
    );
  }

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {labelEl}
      {control}
      {hintEl}
    </div>
  );
}
