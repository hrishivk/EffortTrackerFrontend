import type { ReactNode } from "react";

/** Label, control and inline error — the wrapper every field in the modal uses. */
const EuField = ({
  label,
  required,
  error,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  full?: boolean;
  children: ReactNode;
}) => (
  <div className={full ? "eu-field-full" : undefined}>
    <label className="eu-label">
      {label}
      {required && <span className="eu-req">*</span>}
    </label>
    {children}
    {error && <p className="eu-error">{error}</p>}
  </div>
);

export default EuField;
