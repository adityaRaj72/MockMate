import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function scoreColor(score) {
  if (score >= 7) return "bg-success text-success-foreground";
  if (score >= 5) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
}

export default function FeedbackCard({ feedback }) {
  const [open, setOpen] = useState(true);
  if (!feedback) return null;

  const score = Number(feedback.score) || 0;
  const stars = "⭐".repeat(Math.max(0, Math.min(10, Math.round(score))));

  return (
    <div className="ml-12 mr-2 my-2 rounded-xl border border-border bg-card/60 backdrop-blur p-4 fade-in">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${scoreColor(score)}`}>
            Score: {score}/10
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{stars}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-2 text-sm">
          {feedback.good && (
            <p>
              <span className="text-success font-medium">✅ Good:</span>{" "}
              <span className="text-foreground/90">{feedback.good}</span>
            </p>
          )}
          {feedback.improve && (
            <p>
              <span className="text-warning font-medium">⚠️ Improve:</span>{" "}
              <span className="text-foreground/90">{feedback.improve}</span>
            </p>
          )}
          {feedback.hint && (
            <p>
              <span className="text-hint font-medium">💡 Hint:</span>{" "}
              <span className="text-foreground/90">{feedback.hint}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
