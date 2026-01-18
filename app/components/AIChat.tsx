/**
 * AI Chat Component
 * 
 * Free AI chat powered by Gemini for NFL analysis and questions
 * 
 * @module app/components/AIChat
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";
// Simple button and input components
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "icon" | "default";
}

const Button = ({ type, disabled, size, children, ...props }: ButtonProps) => (
  <button
    type={type || "button"}
    disabled={disabled}
    className={`rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed ${size === "icon" ? "p-2" : ""}`}
    {...props}
  >
    {children}
  </button>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = ({ className, ...props }: InputProps) => (
  <input
    className={`rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${className || ""}`}
    {...props}
  />
);

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  apiBase?: string;
}

export default function AIChat({ apiBase }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createConversation = async () => {
    if (!apiBase) return null;
    try {
      const res = await fetch(`${apiBase}/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "NFL Analysis Chat" }),
      });
      const data = await res.json();
      return data.id;
    } catch (error) {
      // Failed to create conversation - return null
      return null;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !apiBase) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let convId = conversationId;
      if (!convId) {
        convId = await createConversation();
        if (convId) setConversationId(convId);
      }

      if (!convId) {
        throw new Error("Failed to create conversation");
      }

      const res = await fetch(`${apiBase}/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage.content }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  assistantContent += data.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg?.role === "assistant") {
                      lastMsg.content = assistantContent;
                    }
                    return updated;
                  });
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please check your API configuration.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI chat"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed bottom-6 right-6 z-50 h-[600px] w-[400px] rounded-2xl border border-border/50 bg-background shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">NFL AI Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 hover:bg-secondary transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ask me anything about NFL matchups, stats, or analysis!</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/50 p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                  placeholder="Ask about NFL matchups..."
                  disabled={isLoading || !apiBase}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim() || !apiBase} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {!apiBase && (
                <p className="text-xs text-muted-foreground mt-2">
                  Configure API to enable AI chat
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
