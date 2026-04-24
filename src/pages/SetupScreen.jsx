import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Software Engineer",
  "Business Analyst",
  "DevOps Engineer",
];

const LEVELS = [
  { id: "Fresher", label: "Fresher", sub: "0-1 years" },
  { id: "Junior", label: "Junior", sub: "1-3 years" },
  { id: "Mid-level", label: "Mid-level", sub: "3-5 years" },
];

const TYPES = [
  { id: "Technical", label: "Technical", icon: "🛠️" },
  { id: "HR / Behavioral", label: "HR / Behavioral", icon: "🤝" },
  { id: "Mixed (Both)", label: "Mixed", icon: "🎯" },
];

const COUNTS = [5, 8, 10];

export default function SetupScreen() {
  const navigate = useNavigate();
  const [candidateName, setCandidateName] = useState("");
  const [jobRole, setJobRole] = useState(ROLES[0]);
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [interviewType, setInterviewType] = useState("Technical");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const btnRef = useRef(null);

  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [shake]);

  const handleBegin = () => {
    const key = import.meta.env.VITE_GEMINI_API;
    navigate("/interview", {
      state: {
        config: {
          candidateName,
          jobRole,
          experienceLevel,
          interviewType,
          numberOfQuestions,
        },
      },
    });
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Set up your interview</h1>
          <p className="text-muted-foreground text-sm">
            Customize your mock to match the role you're prepping for.
          </p>
        </header>

        <Card className="p-6 space-y-6 bg-card border-border">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Your Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="name"
              placeholder="e.g. Rahul"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Job Role</Label>
            <Select value={jobRole} onValueChange={setJobRole}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label>Experience Level</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {LEVELS.map((l) => {
                const active = experienceLevel === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setExperienceLevel(l.id)}
                    className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                      active
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <div className="font-medium text-sm">{l.label}</div>
                    <div className="text-xs text-muted-foreground">{l.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <Label>Interview Type</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TYPES.map((t) => {
                const active = interviewType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInterviewType(t.id)}
                    className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                      active
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <div className="text-lg">{t.icon}</div>
                    <div className="font-medium text-sm">{t.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* # Questions */}
          <div className="space-y-2">
            <Label>Number of Questions</Label>
            <Select
              value={String(numberOfQuestions)}
              onValueChange={(v) => setNumberOfQuestions(Number(v))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            ref={btnRef}
            onClick={handleBegin}
            size="lg"
            className={`w-full h-12 text-base transition-all duration-200 hover:bg-primary-hover ${shake ? "shake" : ""}`}
          >
            Begin Interview →
          </Button>
        </Card>
      </div>
    </main>
  );
}
