import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, ArrowLeft, MessageSquare, Calendar, Flag, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import InterviewRequestDialog from "@/components/messaging/InterviewRequestDialog";
import ReportUserDialog from "@/components/moderation/ReportUserDialog";
import { useSeekerSubscription } from "@/contexts/SeekerSubscriptionContext";
import SeekerPaywallDialog from "@/components/subscription/SeekerPaywallDialog";

interface Conversation {
  id: string;
  seeker_user_id: string;
  helper_user_id: string;
  updated_at: string;
  other_name: string;
  other_avatar: string | null;
  last_message?: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const Messages = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialConvoId = searchParams.get("conversation");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(initialConvoId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [showInterview, setShowInterview] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { hasActiveSubscription } = useSeekerSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    const loadConversations = async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("*")
        .or(`seeker_user_id.eq.${user.id},helper_user_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (!convos || convos.length === 0) {
        setConversations([]);
        setLoadingConvos(false);
        return;
      }

      const otherIds = convos.map((c) =>
        c.seeker_user_id === user.id ? c.helper_user_id : c.seeker_user_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", otherIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      const enriched: Conversation[] = convos.map((c) => {
        const otherId = c.seeker_user_id === user.id ? c.helper_user_id : c.seeker_user_id;
        const profile = profileMap.get(otherId);
        return {
          ...c,
          other_name: profile?.full_name ?? "User",
          other_avatar: profile?.avatar_url ?? null,
          unread_count: 0,
        };
      });

      setConversations(enriched);
      setLoadingConvos(false);
    };
    loadConversations();
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvo || !user) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConvo)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) ?? []);

      // Mark unread messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", activeConvo)
        .neq("sender_id", user.id)
        .eq("read", false);
    };
    loadMessages();
  }, [activeConvo, user]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeConvo) return;
    const channel = supabase
      .channel(`messages-${activeConvo}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvo}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvo]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConvo || !user || sending) return;
    // Gate seekers without subscription
    if (role === "seeker" && !hasActiveSubscription) {
      setShowPaywall(true);
      return;
    }
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConvo,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const activeConversation = conversations.find((c) => c.id === activeConvo);
  const activeHelperUserId = activeConversation
    ? activeConversation.helper_user_id
    : null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Please sign in to view messages.</p>
          <Button asChild className="mt-4">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Messages</h1>

        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-200px)]">
          {/* Conversation List */}
          <Card className="overflow-hidden">
            <ScrollArea className="h-full">
              {loadingConvos ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  No conversations yet.
                  {role === "seeker" && (
                    <p className="mt-1">
                      <Link to="/browse" className="text-primary hover:underline">
                        Browse helpers
                      </Link>{" "}
                      to start a conversation.
                    </p>
                  )}
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConvo(convo.id)}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b ${
                      activeConvo === convo.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      {convo.other_avatar ? (
                        <img src={convo.other_avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-bold text-muted-foreground/50">
                          {convo.other_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{convo.other_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(convo.updated_at), "MMM d, HH:mm")}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Message Area */}
          <Card className="flex flex-col overflow-hidden">
            {!activeConvo ? (
              <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
                Select a conversation to start messaging
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 border-b p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setActiveConvo(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="font-medium text-foreground">
                    {activeConversation?.other_name}
                  </h2>
                  <div className="ml-auto flex gap-2">
                    {role === "seeker" && activeHelperUserId && (
                      hasActiveSubscription ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowInterview(true)}
                          className="gap-1"
                        >
                          <Calendar className="h-4 w-4" /> Book Interview
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPaywall(true)}
                          className="gap-1"
                        >
                          <Lock className="h-4 w-4" /> Book Interview
                        </Button>
                      )
                    )}
                    {activeConversation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReport(true)}
                        className="gap-1 text-muted-foreground"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.sender_id === user.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`mt-1 text-[10px] ${
                            msg.sender_id === user.id ? "text-primary-foreground/60" : "text-muted-foreground"
                          }`}>
                            {format(new Date(msg.created_at), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-3 flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                  <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Interview Dialog */}
        {showInterview && activeHelperUserId && activeConvo && (
          <InterviewRequestDialog
            open={showInterview}
            onClose={() => setShowInterview(false)}
            helperUserId={activeHelperUserId}
            conversationId={activeConvo}
          />
        )}

        {/* Report Dialog */}
        {showReport && activeConversation && (
          <ReportUserDialog
            open={showReport}
            onClose={() => setShowReport(false)}
            reportedUserId={
              activeConversation.seeker_user_id === user.id
                ? activeConversation.helper_user_id
                : activeConversation.seeker_user_id
            }
            contextType="message"
            contextId={activeConvo ?? undefined}
          />
        )}

        <SeekerPaywallDialog open={showPaywall} onClose={() => setShowPaywall(false)} />
      </div>
    </div>
  );
};

export default Messages;
