import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ChatBubble from "@/components/ChatBubble";
import FeedbackCard from "@/components/FeedbackCard";
import ProgressBar from "@/components/ProgressBar";
import { buildSystemPrompt } from "@/utils/prompts";
import { callGemini } from "@/utils/gemini";
import { parseResponse } from "@/utils/parseResponse";
import { toast } from "sonner";
import { AlertCircle, RefreshCw } from "lucide-react";

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-muted-foreground mr-1">AI is thinking</span>
      <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
    </div>
  );
}

export default function InterviewScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config;

  const [messages, setMessages] = useState([]); // {role, content, feedback?}
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [feedbackList, setFeedbackList] = useState([]); // {q, a, feedback, skipped}
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [interviewDone, setInterviewDone] = useState(false);
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);
  const [inputError, setInputError] = useState("");

  const scrollRef = useRef(null);
  const startedRef = useRef(false);
  const lastQuestionRef = useRef("");
  const feedbackListRef = useRef([]);

  useEffect(() => {
    feedbackListRef.current = feedbackList;
  }, [feedbackList]);

  // Refresh detection: missing config = session lost
  if (!config) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4 bg-card border border-border rounded-xl p-8">
          <AlertCircle className="h-10 w-10 text-warning mx-auto" />
          <h2 className="text-xl font-bold">Session lost</h2>
          <p className="text-sm text-muted-foreground">
            Your interview session can't be restored after a refresh. Start a new one to continue.
          </p>
          <Button onClick={() => navigate("/setup")} className="hover:bg-primary-hover">
            Start a new interview
          </Button>
        </div>
      </main>
    );
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [shake]);

  const buildHistoryForApi = (extraUser) => {
    const history = [
      { role: "system", content: buildSystemPrompt(config) },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    if (extraUser) history.push({ role: "user", content: extraUser });
    return history;
  };

  const handleAiTurn = async (history, { isOpening = false, retried = false } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const text = await callGemini(history);
      const parsed = parseResponse(text);

      if (!parsed) {
        if (!retried) {
          toast.message("AI response error. Retrying...");
          return handleAiTurn(history, { isOpening, retried: true });
        }
        throw new Error("Could not parse AI response");
      }

      // Save feedback for the previous user answer
      if (parsed.feedback && !isOpening) {
        const last = feedbackListRef.current[feedbackListRef.current.length - 1];
        if (last && last.feedback == null) {
          last.feedback = parsed.feedback;
          last.score = Number(parsed.feedback.score) || 0;
          setFeedbackList([...feedbackListRef.current]);
          // attach feedback to the latest user message visually
          setMessages((prev) => {
            const copy = [...prev];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === "user" && !copy[i].feedback) {
                copy[i] = { ...copy[i], feedback: parsed.feedback };
                break;
              }
            }
            return copy;
          });
        }
      }

      const next = parsed.next_question;
      if (typeof next === "string" && next.trim() === "INTERVIEW_COMPLETE") {
        setInterviewDone(true);
        setIsLoading(false);
        setTimeout(() => {
          navigate("/results", {
            state: { config, feedbackList: feedbackListRef.current },
          });
        }, 600);
        return;
      }

      if (next && typeof next === "string") {
        lastQuestionRef.current = next;
        setMessages((prev) => [...prev, { role: "assistant", content: next }]);
        if (!isOpening) {
          setCurrentQuestion((q) => Math.min(config.numberOfQuestions, q + 1));
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Kick off interview
  useEffect(() => {
    if (startedRef.current) return;
    const key = import.meta.env.VITE_GEMINI_API;

    if (!key) {
      toast.error("Missing VITE_GEMINI_API in .env");
      navigate("/setup");
      return;
    }
    startedRef.current = true;
    const history = [
      { role: "system", content: buildSystemPrompt(config) },
      { role: "user", content: "Please begin the interview now." },
    ];
    handleAiTurn(history, { isOpening: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitAnswer = (answerText, { skipped = false } = {}) => {
    if (!answerText.trim() && !skipped) {
      setShake(true);
      setInputError("Please type your answer before submitting");
      return;
    }
    setInputError("");
    const content = skipped ? "[Skipped]" : answerText.trim();

    // Record pending feedback slot
    const entry = {
      questionNumber: currentQuestion,
      question: lastQuestionRef.current,
      answer: content,
      skipped,
      feedback: null,
      score: 0,
    };
    feedbackListRef.current = [...feedbackListRef.current, entry];
    setFeedbackList(feedbackListRef.current);

    setMessages((prev) => [...prev, { role: "user", content }]);
    setUserInput("");

    const history = buildHistoryForApi(content);
    handleAiTurn(history);
  };

  const handleSubmit = () => submitAnswer(userInput);
  const handleSkip = () => submitAnswer("", { skipped: true });

  const handleRetry = () => {
    setError(null);
    // Retry the last AI turn using current message history
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) {
      // Retry opening
      const history = [
        { role: "system", content: buildSystemPrompt(config) },
        { role: "user", content: "Please begin the interview now." },
      ];
      handleAiTurn(history, { isOpening: true });
    } else {
      const history = [
        { role: "system", content: buildSystemPrompt(config) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ];
      handleAiTurn(history);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="font-bold text-base sm:text-lg shrink-0 hover:opacity-80 transition-all duration-200"
          >
            💼 MockMate
          </button>
          <div className="flex-1 flex justify-center">
            <ProgressBar current={currentQuestion} total={config.numberOfQuestions} />
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex shrink-0">
            {config.jobRole} · {config.interviewType}
          </Badge>
        </div>
      </header>

      {/* Chat */}
      <section
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {messages.map((m, i) => (
            <div key={i} className="space-y-2">
              <ChatBubble role={m.role}>{m.content}</ChatBubble>
              {m.role === "user" && m.feedback && (
                <div className="flex justify-end">
                  <div className="w-full max-w-[80%]">
                    <FeedbackCard feedback={m.feedback} />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 fade-in">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card border border-border text-lg">
                🤖
              </div>
              <div className="bg-card border border-border rounded-xl rounded-tl-sm px-4 py-3">
                <ThinkingDots />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">Something went wrong</p>
                  <p className="text-xs text-muted-foreground break-all">{error}</p>
                  <Button size="sm" onClick={handleRetry} className="gap-1.5 hover:bg-primary-hover">
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bottom input */}
      {!interviewDone && (
        <footer className="border-t border-border bg-card/60 backdrop-blur sticky bottom-0">
          <div className="max-w-3xl mx-auto px-4 py-3 space-y-2">
            <div className="relative">
              <Textarea
                rows={3}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={isLoading ? "Wait for the question..." : "Type your answer here..."}
                disabled={isLoading || !!error}
                className={`resize-none bg-background pr-16 ${shake ? "shake border-destructive" : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                {userInput.length}
              </span>
            </div>
            {inputError && <p className="text-xs text-destructive">{inputError}</p>}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
                disabled={isLoading || !!error}
                className="transition-all duration-200"
              >
                Skip Question
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !!error}
                className="transition-all duration-200 hover:bg-primary-hover"
              >
                Submit Answer
              </Button>
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}
