import { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!userPubkey) {
      setError("Please connect your wallet to chat");
      setLoading(false);
      return;
    }

    loadMessages();

    try {
      const unsubscribe = subscribeToNip04Messages(message => {
        const isPartOfConversation =
          (message.senderPubkey === userPubkey && message.receiverPubkey === otherPubkey) ||
          (message.senderPubkey === otherPubkey && message.receiverPubkey === userPubkey);

        if (!isPartOfConversation) return;
        if (interest.moonshotId && message.moonshotId && message.moonshotId !== interest.moonshotId)
          return;

        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message].sort((a, b) => a.timestamp - b.timestamp);
        });

        const isIncoming = message.senderPubkey === otherPubkey;
        if (isIncoming && onNewMessage) {
          onNewMessage(1);
        }
      }, interest.moonshotId);

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
  }, [userPubkey, otherPubkey, interest.moonshotId, onNewMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!userPubkey) return;

    setLoading(true);
    setError(null);

    try {
      const loadedMessages = await fetchNip04Messages(otherPubkey, interest.moonshotId, 100);
      setMessages(loadedMessages);
    } catch (err: any) {
      console.error("Load failed:", err);
      setError(
        err.message?.includes("NIP-04")
          ? "Your extension doesn't support NIP-04"
          : "Failed to load messages"
      );
    } finally {
      setLoading(false);
    }
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
    } catch (err: any) {
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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="card-style max-w-2xl w-full h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-sky-500/30">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <BsArrowLeft className="text-xl" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isCreator ? "Chat with Builder" : "Chat with Creator"}
              </h2>
              <p className="text-gray-400 text-sm">
                {otherNpub.slice(0, 16)}...{otherNpub.slice(-8)}
              </p>
              <p className="text-gray-500 text-xs mt-1">{messages.length} messages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <BsX className="text-2xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && !loading && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-lg mb-4">
              <p className="text-sm">{error}</p>
              <button
                onClick={loadMessages}
                className="text-xs text-red-400 hover:text-red-300 mt-2 underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
              <p className="mt-4">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Start the conversation!</p>
              <p className="text-sm mt-2">
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
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isMyMessage ? "bg-sky-600 text-white" : "bg-gray-700 text-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                      {isMyMessage && !message.id.startsWith("temp-") && " ✓"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-sky-500/30">
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={2}
              className="flex-1 bg-blackish border border-sky-500/30 text-white px-4 py-3 rounded focus:border-sky-400 focus:outline-none transition-colors resize-none"
              disabled={sending || loading || !userPubkey}
            />
            <button
              onClick={sendMessage}
              disabled={sending || loading || !newMessage.trim() || !userPubkey}
              className="bg-sky-600 hover:bg-sky-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded transition-colors flex items-center gap-2"
            >
              <BsSend />
              {sending ? "..." : "Send"}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">End-to-end encrypted</p>
        </div>
      </div>
    </div>
  );
}

export default BuilderChatBox;
