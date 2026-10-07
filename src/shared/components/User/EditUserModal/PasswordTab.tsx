import type { Dispatch, SetStateAction } from "react";
import { TextField } from "@mui/material";
import { FiInfo } from "react-icons/fi";
import { Eye, EyeOff } from "lucide-react";
import EuField from "./EuField";
import type { FieldErrors, Passwords } from "./editUserUtils";

interface PasswordTabProps {
  passwords: Passwords;
  setPasswords: Dispatch<SetStateAction<Passwords>>;
  showPassword: boolean;
  onToggleShow: () => void;
  errors: FieldErrors;
  clearErrors: () => void;
  sx: (field: string) => object;
  fullName: string;
}

const PasswordTab = ({
  passwords,
  setPasswords,
  showPassword,
  onToggleShow,
  errors,
  clearErrors,
  sx,
  fullName,
}: PasswordTabProps) => {
  const update = (field: keyof Passwords) => (value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
    clearErrors();
  };

  return (
    <div className="eu-body">
      <p className="eu-section-title">Set a New Password</p>
      <div className="eu-grid">
        {/* Error goes above the hint here, so it is rendered inline rather than via EuField. */}
        <EuField label="New Password" required full>
          <TextField
            fullWidth
            size="small"
            type={showPassword ? "text" : "password"}
            name="newPassword"
            autoComplete="new-password"
            sx={sx("password")}
            value={passwords.password}
            onChange={(e) => update("password")(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <button
                    type="button"
                    onClick={onToggleShow}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--text-muted)",
                      display: "flex",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                ),
              },
            }}
          />
          {errors.password && <p className="eu-error">{errors.password}</p>}
          <p className="eu-hint">
            At least 8 characters, with an uppercase letter, a number and a special
            character.
          </p>
        </EuField>

        <EuField label="Confirm Password" required full error={errors.confirmPassword}>
          <TextField
            fullWidth
            size="small"
            type={showPassword ? "text" : "password"}
            name="confirmNewPassword"
            autoComplete="new-password"
            sx={sx("confirmPassword")}
            value={passwords.confirmPassword}
            onChange={(e) => update("confirmPassword")(e.target.value)}
          />
        </EuField>
      </div>

      <p className="eu-note">
        <FiInfo size={13} />
        {fullName} is not notified automatically — pass the new password on yourself.
      </p>
    </div>
  );
};

export default PasswordTab;
