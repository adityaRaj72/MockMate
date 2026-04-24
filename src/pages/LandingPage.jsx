import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  { icon: "🎯", title: "Role-Specific Questions", desc: "Tailored to your role and experience level." },
  { icon: "💬", title: "Instant AI Feedback", desc: "Score, strengths, and improvements every turn." },
  { icon: "📊", title: "Track Your Score", desc: "See your overall performance and review answers." },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl text-center space-y-10">
        <div className="space-y-4 fade-in">
          <div className="inline-flex items-center gap-2 text-4xl sm:text-5xl font-bold tracking-tight">
            <span aria-hidden>💼</span>
            <span>MockMate</span>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Practice interviews with AI. Get real feedback. Get hired.
          </p>
        </div>

        <div className="flex justify-center fade-in">
          <Button
            size="lg"
            onClick={() => navigate("/setup")}
            className="text-base h-12 px-8 transition-all duration-200 hover:bg-primary-hover"
          >
            Start Interview →
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 pt-6">
          {features.map((f) => (
            <Card
              key={f.title}
              className="p-5 text-left bg-card border-border transition-all duration-200 hover:border-primary/50"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold mb-1 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
