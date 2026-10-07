import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import { TAG_COLORS } from "./ctmStyles";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [tagDraft, setTagDraft] = useState("");

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || tags.includes(t)) return setTagDraft("");
    onChange([...tags, t]);
    setTagDraft("");
  };

  return (
    <div>
      <label className="ctm__label">Tags</label>
      <div className="ctm__field">
        <LocalOfferOutlinedIcon />
        <input
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Add tags..."
        />
      </div>
      {tags.length > 0 && (
        <div className="ctm__tags">
          {tags.map((t, i) => {
            const c = TAG_COLORS[i % TAG_COLORS.length];
            return (
              <span
                key={t}
                className="ctm__tag"
                style={{ backgroundColor: c.bg, color: c.text }}
              >
                {t}
                <button
                  type="button"
                  title={`Remove ${t}`}
                  onClick={() => onChange(tags.filter((x) => x !== t))}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
