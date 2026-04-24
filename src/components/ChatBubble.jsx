export default function ChatBubble({ role, children }) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full gap-3 fade-in ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card border border-border text-lg">
          🤖
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-200 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card text-card-foreground border border-border rounded-tl-sm"
        }`}
      >
        {typeof children === "string" ? (
          <p className="whitespace-pre-wrap">{children}</p>
        ) : (
          children
        )}
      </div>
      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/40 text-lg">
          👤
        </div>
      )}
    </div>
  );
}
