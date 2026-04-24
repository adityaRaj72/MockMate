import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ScoreCircle from "@/components/ScoreCircle";
import { ChevronDown, ChevronUp, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function scoreBadgeClass(score) {
  if (score >= 7) return "bg-success text-success-foreground hover:bg-success";
  if (score >= 5) return "bg-warning text-warning-foreground hover:bg-warning";
  return "bg-destructive text-destructive-foreground hover:bg-destructive";
}

export default function ResultsScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config;
  const feedbackList = location.state?.feedbackList || [];
  const [openIdx, setOpenIdx] = useState(null);

  if (!config || feedbackList.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4 bg-card border border-border rounded-xl p-8">
          <AlertCircle className="h-10 w-10 text-warning mx-auto" />
          <h2 className="text-xl font-bold">No results to show</h2>
          <p className="text-sm text-muted-foreground">
            Start a new interview to see your performance breakdown.
          </p>
          <Button onClick={() => navigate("/setup")} className="hover:bg-primary-hover">
            Start a new interview
          </Button>
        </div>
      </main>
    );
  }

  const answered = feedbackList.filter((f) => !f.skipped);
  const skippedCount = feedbackList.length - answered.length;
  const avg =
    answered.length > 0
      ? answered.reduce((s, f) => s + (Number(f.score) || 0), 0) / answered.length
      : 0;
  const total100 = Math.round((avg / 10) * 100);

  let subtext = "Keep practicing — you're getting there!";
  if (total100 >= 70) subtext = "Great performance! You're interview-ready.";
  else if (total100 >= 50) subtext = "Good performance! Keep practicing.";

  const strongest = answered.reduce(
    (best, f) => ((Number(f.score) || 0) > (Number(best?.score) || -1) ? f : best),
    null
  );

  const handleCopy = async () => {
    const lines = [];
    lines.push(`MockMate — Interview Report`);
    lines.push(`Candidate: ${config.candidateName || "—"}`);
    lines.push(`Role: ${config.jobRole} (${config.experienceLevel})`);
    lines.push(`Type: ${config.interviewType}`);
    lines.push(`Overall Score: ${total100}/100`);
    lines.push(`Average per question: ${avg.toFixed(1)}/10`);
    lines.push(`Answered: ${answered.length} | Skipped: ${skippedCount}`);
    lines.push("");
    feedbackList.forEach((f, i) => {
      lines.push(`Q${i + 1}. ${f.question}`);
      lines.push(`Your answer: ${f.answer}`);
      if (f.feedback) {
        lines.push(`Score: ${f.feedback.score}/10`);
        if (f.feedback.good) lines.push(`✅ Good: ${f.feedback.good}`);
        if (f.feedback.improve) lines.push(`⚠️ Improve: ${f.feedback.improve}`);
        if (f.feedback.hint) lines.push(`💡 Hint: ${f.feedback.hint}`);
      }
      lines.push("");
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Report copied to clipboard");
    } catch {
      toast.error("Couldn't copy. Please try again.");
    }
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-2 fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold">Interview Complete! 🎉</h1>
          <p className="text-muted-foreground">
            {config.candidateName ? `${config.candidateName} · ` : ""}
            {config.jobRole} · {config.interviewType}
          </p>
        </header>

        {/* Score */}
        <Card className="p-8 flex flex-col items-center gap-3 bg-card border-border">
          <ScoreCircle score={total100} total={100} />
          <p className="text-sm text-muted-foreground">{subtext}</p>
        </Card>

        {/* Breakdown */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-card border-border">
            <p className="text-xs text-muted-foreground mb-1">Average Score</p>
            <p className="text-2xl font-bold">{avg.toFixed(1)}<span className="text-base font-normal text-muted-foreground">/10</span></p>
          </Card>
          <Card className="p-5 bg-card border-border">
            <p className="text-xs text-muted-foreground mb-1">Answered vs Skipped</p>
            <p className="text-2xl font-bold">
              {answered.length}<span className="text-base font-normal text-muted-foreground"> / {skippedCount} skipped</span>
            </p>
          </Card>
          <Card className="p-5 bg-card border-border">
            <p className="text-xs text-muted-foreground mb-1">Strongest Answer</p>
            <p className="text-2xl font-bold">
              {strongest ? `Q${strongest.questionNumber}` : "—"}
              {strongest && (
                <span className="text-base font-normal text-muted-foreground"> · {strongest.score}/10</span>
              )}
            </p>
          </Card>
        </div>

        {/* Review */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Question Review</h2>
          {feedbackList.map((f, i) => {
            const open = openIdx === i;
            const score = Number(f?.feedback?.score) || 0;
            return (
              <Card key={i} className="bg-card border-border overflow-hidden">
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="w-full text-left p-4 flex items-start gap-3 hover:bg-secondary/30 transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                      {f.feedback ? (
                        <Badge className={`${scoreBadgeClass(score)} rounded-full`}>
                          {score}/10
                        </Badge>
                      ) : f.skipped ? (
                        <Badge variant="secondary" className="rounded-full">Skipped</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-foreground">{f.question}</p>
                  </div>
                  {open ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  )}
                </button>

                {open && (
                  <div className="px-4 pb-4 space-y-3 fade-in">
                    <div className="rounded-lg bg-background border border-border p-3">
                      <p className="text-xs text-muted-foreground mb-1">Your answer</p>
                      <p className="text-sm whitespace-pre-wrap">{f.answer}</p>
                    </div>
                    {f.feedback && (
                      <div className="space-y-1.5 text-sm">
                        {f.feedback.good && (
                          <p><span className="text-success font-medium">✅ Good:</span> {f.feedback.good}</p>
                        )}
                        {f.feedback.improve && (
                          <p><span className="text-warning font-medium">⚠️ Improve:</span> {f.feedback.improve}</p>
                        )}
                        {f.feedback.hint && (
                          <p><span className="text-hint font-medium">💡 Hint:</span> {f.feedback.hint}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => navigate("/setup")}
            size="lg"
            className="hover:bg-primary-hover transition-all duration-200"
          >
            Start New Interview
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="lg"
            className="gap-2 transition-all duration-200"
          >
            <Copy className="h-4 w-4" /> Copy Full Report
          </Button>
        </div>
      </div>
    </main>
  );
}
