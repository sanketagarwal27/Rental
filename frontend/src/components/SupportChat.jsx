import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axios.js";
import { Send, X, MessageSquare, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const SupportChat = ({ otherUserId, isWidget = true }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(!isWidget);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showFaqs, setShowFaqs] = useState(false);
  const messagesEndRef = useRef(null);

  const faqs = user?.role === "Admin" ? [
    "Please check your Dashboard for the pickup location.",
    "Your security deposit is held and released upon vehicle return.",
    "Cancellation is permitted under our policy from your Dashboard.",
    "We are checking this issue with the host right now.",
  ] : [
    "Where is my pickup location?",
    "Can I cancel my booking?",
    "What if the host is late?",
    "How does the security deposit work?",
  ];

  // If otherUserId is not provided, and current user is NOT admin,
  // we assume we are sending messages to "Admin" (we will let backend handle it
  // or we can fetch admin ID. For simplicity, we can just send it to a known admin
  // or handle "support" in backend).
  // Wait, our backend needs `receiverId`. Let's fetch the first admin if not provided.
  const [adminId, setAdminId] = useState(otherUserId);

  useEffect(() => {
    if (!user || !socket) return;

    const handleMessage = (message) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some((m) => m._id === message._id)) return prev;

        // If we are admin, only append if message is from the user we are chatting with
        if (user.role === "Admin" && otherUserId) {
          if (
            message.sender === otherUserId ||
            message.receiver === otherUserId
          ) {
            return [...prev, message];
          }
          return prev;
        } else {
          // If we are normal user, append any message (from admin)
          return [...prev, message];
        }
      });
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [user, otherUserId, socket]);

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      if (!user) return;
      try {
        let targetId = otherUserId;

          // If no target ID and user is not admin, we need to find an admin ID
        if (!targetId && user.role !== "Admin") {
          // We modified the backend to handle 'support' as receiverId
          targetId = "support";
        }

        if (targetId) {
          const res = await axiosInstance.get(`/message/${targetId}`);
          setMessages(res.data.data);

          // If we used "support", backend will return the actual admin ID in receiverId
          if (res.data.receiverId) {
            setAdminId(res.data.receiverId);
          } else {
            setAdminId(targetId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, otherUserId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !adminId) return;

    try {
      // The backend sendMessage route expects receiverId and content
      await axiosInstance.post("/message/send", {
        receiverId: adminId,
        content: newMessage,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  if (!isWidget) {
    // Full page/embedded version (for admin panel)
    return (
      <div className="flex flex-col h-[500px] border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 text-zinc-100">
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-950/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === user?._id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender === user?._id ? "bg-blue-600 text-white rounded-br-none" : "bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-bl-none"}`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2 items-center"
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFaqs(!showFaqs)}
              className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800 hover:bg-zinc-700 rounded-lg"
            >
              <Menu size={20} />
            </button>
            {showFaqs && (
              <div className="absolute bottom-full mb-3 left-0 w-64 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col p-1.5 z-10">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1.5 border-b border-zinc-700/50 mb-1">
                  Quick Replies
                </div>
                {faqs.map((faq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNewMessage(faq);
                      setShowFaqs(false);
                    }}
                    className="text-left text-xs text-zinc-300 hover:bg-zinc-700/80 px-3 py-2 rounded-lg transition-colors"
                  >
                    {faq}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      {/* Widget Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-transform hover:scale-105 z-50 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100 bg-blue-600 text-white"}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-zinc-900 text-zinc-100 rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right z-50 border border-zinc-800 overflow-hidden flex flex-col ${isOpen ? "scale-100 opacity-100 h-[500px]" : "scale-0 opacity-0 h-0"}`}
      >
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare size={18} />
            Support Chat
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-950/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === user?._id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.sender === user?._id ? "bg-blue-600 text-white rounded-br-none" : "bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-bl-none text-sm"}`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2 items-center"
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFaqs(!showFaqs)}
              className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800 hover:bg-zinc-700 rounded-full"
            >
              <Menu size={18} />
            </button>
            {showFaqs && (
              <div className="absolute bottom-full mb-3 left-0 w-60 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col p-1.5 z-10">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1.5 border-b border-zinc-700/50 mb-1">
                  FAQ
                </div>
                {faqs.map((faq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNewMessage(faq);
                      setShowFaqs(false);
                    }}
                    className="text-left text-xs text-zinc-300 hover:bg-zinc-700/80 px-3 py-2 rounded-lg transition-colors"
                  >
                    {faq}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
};

export default SupportChat;
