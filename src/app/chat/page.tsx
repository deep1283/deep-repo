"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Message, ChatUser } from "@/types";
import { Send, Users, Trash2, LogOut } from "lucide-react";

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let messagesSubscription: ReturnType<typeof supabase.channel> | null;
    let usersSubscription: ReturnType<typeof supabase.channel> | null;

    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const userEmail = session.user.email!;
      const isAdmin = userEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      // Check if user is removed
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", userEmail)
        .single();

      if (userError || !userData) {
        // Create user if doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            email: userEmail,
            name: session.user.user_metadata?.full_name || session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url,
            is_admin: isAdmin,
            is_removed: false,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating user:", createError);
          return;
        }

        setUser(newUser);
      } else {
        if (userData.is_removed) {
          router.push("/removed");
          return;
        }
        setUser(userData);
      }

      // Load messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (messagesData) {
        setMessages(messagesData);
      }

      // Load users
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .eq("is_removed", false);

      if (usersData) {
        setUsers(usersData);
      }

      setLoading(false);

      // Set up realtime subscriptions
      messagesSubscription = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            setMessages((prev) => {
              const incoming = payload.new as Message;
              return prev.some((m) => m.id === incoming.id)
                ? prev
                : [...prev, incoming];
            });
          }
        )
        .subscribe();

      usersSubscription = supabase
        .channel("users")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "users" },
          (payload) => {
            if (
              payload.new.is_removed &&
              payload.new.email === session.user.email
            ) {
              router.push("/removed");
            }
            setUsers((prev) =>
              prev.map((u) =>
                u.id === payload.new.id ? (payload.new as ChatUser) : u
              )
            );
          }
        )
        .subscribe();
    };

    checkUser();

    return () => {
      if (messagesSubscription) {
        messagesSubscription.unsubscribe();
      }
      if (usersSubscription) {
        usersSubscription.unsubscribe();
      }
    };
  }, [router]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      // Insert user message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          content: messageContent,
          sender_id: user.id,
          sender_name: user.name,
          sender_email: user.email,
          is_ai: false,
        })
        .select()
        .single();

      if (messageError) {
        console.error("Error sending message:", messageError);
        return;
      }

      setMessages((prev) =>
        prev.some((m) => m.id === messageData.id)
          ? prev
          : [...prev, messageData]
      );

      // Check if message mentions @chad
      if (messageContent.toLowerCase().includes("@chad")) {
        try {
          const res = await fetch("/api/ai-response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: messageContent }),
          });
          const json = await res.json();
          if (!res.ok || !json.response) {
            console.error("AI response error:", json?.error || "No response");
            return;
          }
          const aiText = json.response;

          const { data: aiMessageData, error: aiError } = await supabase
            .from("messages")
            .insert({
              content: aiText,
              sender_id: "ai-chad",
              sender_name: "@chad",
              sender_email: "chad@dukhiatma.ai",
              is_ai: true,
            })
            .select()
            .single();

          if (!aiError && aiMessageData) {
            setMessages((prev) =>
              prev.some((m) => m.id === aiMessageData.id)
                ? prev
                : [...prev, aiMessageData]
            );
          }
        } catch (error) {
          console.error("Error generating AI response:", error);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const removeUser = async (userId: string) => {
    if (!user?.is_admin) return;

    try {
      // Uses RLS policy "Admins can update users" to authorize this update on the client
      const { error } = await supabase
        .from("users")
        .update({ is_removed: true })
        .eq("id", userId);

      if (error) {
        console.error("Error removing user:", error);
      }
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Aggressively clear any cached Supabase session (localStorage)
      if (typeof window !== "undefined") {
        try {
          Object.keys(localStorage)
            .filter((k) => k.startsWith("sb-") || k === "supabase.auth.token")
            .forEach((k) => localStorage.removeItem(k));
        } catch {}
      }
      router.replace("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c63ff]"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f9fafc] flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">DukhiAtma</h1>
            <p className="text-sm text-gray-500">{users.length} members</p>
          </div>
          <div className="flex items-center space-x-2">
            {user?.is_admin && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Admin</span>
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === user?.id;
          const isAIMessage = message.is_ai;

          return (
            <div
              key={message.id}
              className={`flex ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isOwnMessage
                    ? "bg-[#6c63ff] text-white"
                    : isAIMessage
                    ? "bg-[#ffcaaf] text-gray-800"
                    : "bg-[#e0e7ff] text-gray-800"
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {message.sender_name}
                </div>
                <div className="text-sm">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    isOwnMessage ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Admin Controls */}
      {user?.is_admin && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Admin Controls
            </h3>
            <div className="space-y-2">
              {users
                .filter((u) => u.id !== user.id)
                .map((chatUser) => (
                  <div
                    key={chatUser.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-[#6c63ff] rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {chatUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {chatUser.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {chatUser.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeUser(chatUser.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message... (mention @chad for AI therapist)"
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6c63ff] focus:border-transparent"
              disabled={sending}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-[#6c63ff] text-white p-3 rounded-2xl hover:bg-[#5a52e5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
