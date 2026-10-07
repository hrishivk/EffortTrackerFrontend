import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MenuItem, Select, TextField } from "@mui/material";
import { FiCalendar } from "react-icons/fi";

import { PROJECT_CATEGORIES } from "../constants";
import { NAME_MAX, REASON_MAX, errorSx, inputSx } from "./constants";
import { showDay } from "./dateUtils";

export type ProjectForm = {
  name: string;
  category: string;
  endDate: string;
};

interface DetailsFormProps {
  form: ProjectForm;
  errors: Record<string, string>;
  setField: (field: keyof ProjectForm, value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  extending: boolean;
  savedDay: string | null;
  extensionCount: number;
}

const DetailsForm = ({
  form,
  errors,
  setField,
  reason,
  onReasonChange,
  extending,
  savedDay,
  extensionCount,
}: DetailsFormProps) => {
  const categoryOptions = useMemo(
    () =>
      form.category && !PROJECT_CATEGORIES.includes(form.category)
        ? [form.category, ...PROJECT_CATEGORIES]
        : PROJECT_CATEGORIES,
    [form.category],
  );

  const sx = (field: string) => (errors[field] ? errorSx : inputSx);

  return (
    <div>
      <div className="ep-field">
        <label className="ep-label">
          Project Name<span className="ep-req">*</span>
        </label>
        <TextField
          fullWidth
          size="small"
          sx={sx("name")}
          value={form.name}
          slotProps={{ htmlInput: { maxLength: NAME_MAX } }}
          onChange={(e) => setField("name", e.target.value)}
        />
        {errors.name ? (
          <p className="ep-error">{errors.name}</p>
        ) : (
          <p className="ep-count">
            {form.name.length} / {NAME_MAX}
          </p>
        )}
      </div>

      <div className="ep-grid">
        <div>
          <label className="ep-label">
            Project Category<span className="ep-req">*</span>
          </label>
          <Select
            fullWidth
            size="small"
            displayEmpty
            sx={sx("category")}
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
            renderValue={(value) =>
              value ? (
                (value as string)
              ) : (
                <span style={{ color: "var(--text-faint)" }}>
                  Select a category
                </span>
              )
            }
          >
            {categoryOptions.map((c) => (
              <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>
                {c}
              </MenuItem>
            ))}
          </Select>
          {errors.category && (
            <p className="ep-error">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="ep-label">
            Due Date<span className="ep-req">*</span>
          </label>
          <TextField
            fullWidth
            size="small"
            type="datetime-local"
            sx={sx("endDate")}
            value={form.endDate}
            onChange={(e) => setField("endDate", e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <FiCalendar
                    size={15}
                    style={{
                      marginRight: 10,
                      color: "var(--text-muted)",
                    }}
                  />
                ),
              },
            }}
          />
          {errors.endDate ? (
            <p className="ep-error">{errors.endDate}</p>
          ) : (
            <p className="ep-hint">
              {savedDay
                ? `Currently ${showDay(savedDay)}`
                : "Select project due date and time"}
              {extensionCount > 0 && (
                <span className="ep-slip">Extended {extensionCount}×</span>
              )}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {extending && (
          <motion.div
            key="reason"
            className="ep-field ep-reason"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            <label className="ep-label">
              Why is the due date moving later?
              <span className="ep-req">*</span>
            </label>
            <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              sx={sx("reason")}
              value={reason}
              placeholder="e.g. Client pushed the UAT window"
              slotProps={{ htmlInput: { maxLength: REASON_MAX } }}
              onChange={(e) => onReasonChange(e.target.value)}
            />
            {errors.reason ? (
              <p className="ep-error">{errors.reason}</p>
            ) : (
              <p className="ep-hint">
                Recorded as an extension with your name · {reason.length} / {REASON_MAX}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DetailsForm;
