'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const createConversation = async (): Promise<number> => {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "NFL Intelligence Chat" }),
    });
    if (!response.ok) throw new Error("Failed to create conversation");
    const conversation: Conversation = await response.json();
    return conversation.id;
  };

  const sendMessage = async (content: string, convId: number) => {
    const response = await fetch(`/api/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) throw new Error("Failed to send message");
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullContent += data.content;
              setStreamingContent(fullContent);
            }
            if (data.done) {
              return fullContent;
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }
      }
    }

    return fullContent;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      let currentConvId = conversationId;
      if (!currentConvId) {
        currentConvId = await createConversation();
        setConversationId(currentConvId);
      }

      const newUserMessage: Message = {
        id: Date.now(),
        role: "user",
        content: userMessage,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newUserMessage]);

      const assistantContent = await sendMessage(userMessage, currentConvId);

      const newAssistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: assistantContent,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newAssistantMessage]);
      setStreamingContent("");
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setStreamingContent("");
  };

  return (
    <>
      {!isOpen && (
        <Button
          data-testid="button-open-chat"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-espn shadow-lg hover:shadow-xl transition-all duration-300 box-glow-red"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {isOpen && (
        <Card
          data-testid="chat-panel"
          className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] flex flex-col bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl"
        >
          <div className="flex items-center justify-between p-4 border-b border-border/50 gradient-espn rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white" data-testid="text-chat-title">
                  Edge Loop Intelligence
                </h3>
                <p className="text-xs text-white/70">AI-Powered Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                data-testid="button-new-chat"
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs"
              >
                New Chat
              </Button>
              <Button
                data-testid="button-close-chat"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div ref={scrollRef} className="space-y-4">
              {messages.length === 0 && !streamingContent && (
                <div className="text-center py-8" data-testid="chat-empty-state">
                  <div className="h-12 w-12 rounded-full gradient-espn mx-auto mb-4 flex items-center justify-center box-glow-red">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Welcome to NFL Intelligence
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                    Ask me about NFL betting analytics, team performance, player stats, exploit signals, and more.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  data-testid={`message-${message.role}-${message.id}`}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full gradient-espn flex-shrink-0 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-xl px-3 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {streamingContent && (
                <div
                  data-testid="message-streaming"
                  className="flex gap-3 justify-start"
                >
                  <div className="h-7 w-7 rounded-full gradient-espn flex-shrink-0 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="max-w-[75%] rounded-xl px-3 py-2 text-sm bg-muted text-foreground">
                    <p className="whitespace-pre-wrap">{streamingContent}</p>
                  </div>
                </div>
              )}

              {isLoading && !streamingContent && (
                <div
                  data-testid="chat-loading"
                  className="flex gap-3 justify-start"
                >
                  <div className="h-7 w-7 rounded-full gradient-espn flex-shrink-0 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-xl px-3 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-border/50"
          >
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                data-testid="input-chat-message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about NFL analytics..."
                className="flex-1 bg-muted/50 border-border/50"
                disabled={isLoading}
              />
              <Button
                data-testid="button-send-message"
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isLoading}
                className="gradient-espn shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
