import type { ReactNode } from "react";

export const ErrorText = ({ message }: { message?: string }) =>
  message ? (
    <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 500, margin: "4px 0 0" }}>{message}</p>
  ) : null;

type Props = {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

const FormField = ({ label, error, className, children }: Props) => (
  <div className={className}>
    <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
      {label}
    </label>
    {children}
    <ErrorText message={error} />
  </div>
);

export default FormField;
