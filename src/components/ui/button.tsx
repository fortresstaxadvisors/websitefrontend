import Link from "next/link";
import type { ReactNode } from "react";

/*
  Button — renders as a Link (href) or a native button. Variants map to the
  .btn-* classes in globals.css. On a dark band, .btn-primary automatically
  flips to a brass fill (AA-safe) via the band CSS, so callers don't special-case.
*/

type Variant = "primary" | "secondary" | "ghost";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** Append a trailing arrow that nudges on hover. */
  arrow?: boolean;
};

const variantClass: Record<Variant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  arrow = false,
  type = "button",
  ...rest
}: CommonProps & {
  href?: string;
  type?: "button" | "submit";
}) {
  const classes = `${variantClass[variant]} ${className}`;
  const content = (
    <>
      {children}
      {arrow ? (
        <span className="arrow" aria-hidden="true">
          &rarr;
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
