import { useState, useEffect, useRef, useCallback } from "react";
import { BsX, BsSend, BsArrowLeft } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";
import { nip19 } from "nostr-tools";
import type { Interest, ChatMessage } from "../../types/types";
import { sendNip04Message, fetchNip04Messages, subscribeToNip04Messages } from "../../utils/nip04";

interface BuilderChatBoxProps {
  interest: Interest;
  onClose: () => void;
  onNewMessage?: (count: number) => void;
}

function BuilderChatBox({ interest, onClose, onNewMessage }: BuilderChatBoxProps) {
  const { userPubkey } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const otherPubkey =
    userPubkey === interest.builderPubkey
      ? interest.moonshotCreatorPubkey || interest.builderPubkey
      : interest.builderPubkey;

  const otherNpub = nip19.npubEncode(otherPubkey);
  const isCreator = userPubkey !== interest.builderPubkey;

  const loadMessages = useCallback(async () => {
    if (!userPubkey) return;

    setLoading(true);
    setError(null);

    try {
      const loadedMessages = await fetchNip04Messages(otherPubkey, 100);
      setMessages(loadedMessages);
    } catch (err) {
      console.error("Load failed:", err);
      setError("Load Failed");
    } finally {
      setLoading(false);
    }
  }, [userPubkey, otherPubkey]);

  useEffect(() => {
    if (!userPubkey) {
      setError("Please connect your wallet to chat");
      setLoading(false);
      return;
    }

    loadMessages();

    try {
      // Simple subscription - just need otherPubkey
      const unsubscribe = subscribeToNip04Messages(message => {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          const newMessages = [...prev, message].sort((a, b) => a.timestamp - b.timestamp);
          return newMessages;
        });

        const isIncoming = message.senderPubkey === otherPubkey;
        if (isIncoming && onNewMessage) {
          onNewMessage(1);
        }
      }, otherPubkey);

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error("Subscription failed:", err);
      setError("Failed to setup real-time messaging");
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userPubkey, otherPubkey, interest.moonshotId, onNewMessage, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userPubkey) return;

    setSending(true);
    setError(null);

    const messageToSend = newMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    try {
      const optimisticMessage: ChatMessage = {
        id: tempId,
        senderPubkey: userPubkey,
        receiverPubkey: otherPubkey,
        content: messageToSend,
        timestamp: Date.now(),
        encrypted: true,
        moonshotId: interest.moonshotId,
        interestId: interest.id,
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage("");

      const messageId = await sendNip04Message(
        otherPubkey,
        messageToSend,
        interest.moonshotId,
        interest.id
      );

      setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, id: messageId } : m)));
    } catch (err) {
      console.error("Send failed:", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageToSend);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="rounded-2xl border border-white/10 bg-linear-to-br from-dark via-card to-card/95 shadow-[0_0_40px_rgba(0,0,0,0.9)] max-w-3xl w-full h-[90vh] sm:h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <BsArrowLeft className="text-base sm:text-lg" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white truncate">
                {isCreator ? "Chat with Builder" : "Chat with Creator"}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate font-mono">
                {otherNpub.slice(0, 12)}...{otherNpub.slice(-6)}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {messages.length} message{messages.length !== 1 && "s"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <BsX className="text-xl sm:text-2xl" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {error && !loading && (
            <div className="rounded-xl border border-red-500/40 bg-red-900/20 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-red-200">{error}</p>
              <button
                onClick={loadMessages}
                className="mt-2 text-[10px] sm:text-xs text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <div className="mb-3 h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-2 border-white/10 border-t-bitcoin" />
              <p className="text-xs sm:text-sm">Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <p className="text-xs sm:text-sm mb-1">No messages yet. Start the conversation!</p>
              <p className="text-[10px] sm:text-xs text-gray-500">
                Discuss the project requirements, timeline, and next steps.
              </p>
            </div>
          ) : (
            messages.map(message => {
              const isMyMessage = message.senderPubkey === userPubkey;

              return (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl ${
                      isMyMessage
                        ? "bg-bitcoin text-black rounded-br-sm"
                        : "bg-white/10 text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap wrap-break-words">
                      {message.content}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMyMessage ? "text-black/60" : "text-gray-400"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isMyMessage && !message.id.startsWith("temp-") && " ✓"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 bg-black/40 px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex-1 rounded-2xl bg-black/60 border border-white/10 px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 focus-within:border-bitcoin transition-colors">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 max-h-28 resize-none bg-transparent text-xs sm:text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
                disabled={sending || loading || !userPubkey}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={sending || loading || !newMessage.trim() || !userPubkey}
              className="shrink-0 inline-flex items-center justify-center rounded-full bg-bitcoin px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-black hover:bg-orange-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-600"
            >
              <BsSend className="text-sm sm:text-base" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-gray-500">End-to-end encrypted</p>
            {(sending || loading) && (
              <p className="text-[10px] text-gray-400">
                {sending ? "Sending…" : "Syncing messages…"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuilderChatBox;
