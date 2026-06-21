import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axios.js";
import { Send, X, MessageSquare, Menu, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const SupportChat = ({ otherUserId, isWidget = true }) => {
  const { user } = useAuth();
  const { socket, unreadCount, setUnreadCount } = useSocket();
  const [isOpen, setIsOpen] = useState(!isWidget);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showFaqs, setShowFaqs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Admin unified UI states
  const [conversations, setConversations] = useState([]);
  const [activeChatUserId, setActiveChatUserId] = useState(otherUserId || null);
  const [adminId, setAdminId] = useState(otherUserId);

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

  const fetchConversations = async () => {
    try {
      const res = await axiosInstance.get("/message/admin/conversations");
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    }
  };

  const markAsRead = async (userId) => {
    if (!userId) return;
    try {
      await axiosInstance.post(`/message/mark-read/${userId}`);
      // Refresh global unread count
      const res = await axiosInstance.get("/message/unread-count");
      if (res.data.success) {
        setUnreadCount(res.data.data);
      }
      
      // Clear unread count locally in conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.user._id === userId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Failed to mark messages as read", error);
    }
  };

  // Socket listener for new messages
  useEffect(() => {
    if (!user || !socket) return;

    const handleMessage = (message) => {
      // Admin global conversation updater
      if (user.role === "Admin" && !activeChatUserId) {
        // We are looking at the conversation list, so we should refresh it
        fetchConversations();
        return;
      }

      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some((m) => m._id === message._id)) return prev;

        // If we are admin, only append if message is from the user we are chatting with
        if (user.role === "Admin" && activeChatUserId) {
          if (
            message.sender === activeChatUserId ||
            message.receiver === activeChatUserId
          ) {
            // Also if we receive a message while open, mark it as read
            if (message.sender === activeChatUserId && isOpen) {
              markAsRead(activeChatUserId);
            }
            return [...prev, message];
          }
          return prev;
        } else {
          // If we are normal user, append any message
          if (message.sender !== user._id && isOpen) {
            markAsRead(message.sender);
          }
          return [...prev, message];
        }
      });
    };

    socket.on("receiveMessage", handleMessage);
    return () => socket.off("receiveMessage", handleMessage);
  }, [user, activeChatUserId, socket, isOpen]);

  // Fetch conversations if admin and no active user
  useEffect(() => {
    if (user?.role === "Admin" && isOpen && !activeChatUserId) {
      fetchConversations();
    }
  }, [user, isOpen, activeChatUserId]);

  // Fetch initial messages when chat is opened
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      try {
        let targetId = activeChatUserId;

        // If no target ID and user is not admin, we need to find an admin ID
        if (!targetId && user.role !== "Admin") {
          targetId = "support";
        }

        if (targetId) {
          const res = await axiosInstance.get(`/message/${targetId}`);
          setMessages(res.data.data);
          
          if (res.data.receiverId) {
            setAdminId(res.data.receiverId);
          } else {
            setAdminId(targetId);
          }

          // Mark as read when we open the chat
          if (isOpen) {
            markAsRead(targetId === "support" ? res.data.receiverId : targetId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    if (isOpen && (user?.role !== "Admin" || activeChatUserId)) {
      fetchMessages();
    }
  }, [isOpen, activeChatUserId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, activeChatUserId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !adminId || isSending) return;

    try {
      setIsSending(true);
      await axiosInstance.post("/message/send", {
        receiverId: adminId,
        content: newMessage,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  // -------------------------------------------------------------
  // RENDERERS
  // -------------------------------------------------------------

  const renderConversationList = () => (
    <div className="flex-1 overflow-y-auto bg-zinc-950 divide-y divide-zinc-800">
      {conversations.length === 0 ? (
        <div className="p-4 text-zinc-500 text-center text-sm">
          No conversations found.
        </div>
      ) : (
        conversations.map((conv) => (
          <div
            key={conv.user._id}
            onClick={() => setActiveChatUserId(conv.user._id)}
            className={`p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors flex items-center justify-between ${
              activeChatUserId === conv.user._id ? "bg-zinc-800" : ""
            }`}
          >
            <div className="flex-1 truncate pr-4">
              <div className="font-medium text-sm text-zinc-200">
                {conv.user.name || conv.user.email}
              </div>
              <div className="text-xs text-zinc-500 truncate mt-1">
                {conv.lastMessage.content}
              </div>
            </div>
            {conv.unreadCount > 0 && (
              <div className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                {conv.unreadCount}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderChatBox = (isSmall) => (
    <>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-950/50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === user?._id ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[${isSmall ? '80' : '70'}%] rounded-2xl px-4 py-2 ${msg.sender === user?._id ? "bg-blue-600 text-white rounded-br-none" : "bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-bl-none text-sm"}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className={`p-${isSmall ? '3' : '4'} bg-zinc-900 border-t border-zinc-800 flex gap-2 items-center`}
      >
        <div className="relative">
          <button
            type="button"
            disabled={isSending}
            onClick={() => setShowFaqs(!showFaqs)}
            className={`p-2 text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800 hover:bg-zinc-700 rounded-${isSmall ? 'full' : 'lg'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Menu size={isSmall ? 18 : 20} />
          </button>
          {showFaqs && (
            <div className={`absolute bottom-full mb-3 left-0 w-${isSmall ? '60' : '64'} bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col p-1.5 z-10`}>
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1.5 border-b border-zinc-700/50 mb-1">
                {isSmall ? "FAQ" : "Quick Replies"}
              </div>
              {faqs.map((faq, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={isSending}
                  onClick={() => {
                    setNewMessage(faq);
                    setShowFaqs(false);
                  }}
                  className="text-left text-xs text-zinc-300 hover:bg-zinc-700/80 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={isSending}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Type a message...`}
          className={`flex-1 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-${isSmall ? 'full' : 'lg'} px-4 py-2 ${isSmall ? 'text-sm' : ''} focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className={`bg-blue-600 text-white p-2 rounded-${isSmall ? 'full' : 'lg'} hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Send size={isSmall ? 18 : 20} />
        </button>
      </form>
    </>
  );

  const shouldRenderList = user?.role === "Admin" && !activeChatUserId;

  if (!isWidget) {
    if (user?.role === "Admin") {
      return (
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-[600px] text-zinc-100">
          {/* Conversations List Sidebar */}
          <div className="w-1/3 border-r border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900">
              <h3 className="font-bold text-zinc-100">Conversations</h3>
            </div>
            {renderConversationList()}
          </div>

          {/* Chat View */}
          <div className="flex-1 flex flex-col bg-zinc-950">
            {activeChatUserId ? (
              <>
                <div className="bg-zinc-800 p-4 flex items-center gap-2 border-b border-zinc-700">
                  <span className="font-semibold text-sm">Support Chat</span>
                </div>
                {renderChatBox(false)}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Normal user full-page chat
      return (
        <div className="flex flex-col h-[500px] border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 text-zinc-100">
          <div className="bg-zinc-800 p-4 flex items-center gap-2 border-b border-zinc-700">
            <MessageSquare size={18} />
            <span className="font-semibold text-sm">Support Chat</span>
          </div>
          {renderChatBox(false)}
        </div>
      );
    }
  }

  return (
    <>
      {/* Widget Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-transform hover:scale-105 z-50 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100 bg-blue-600 text-white"}`}
      >
        <MessageSquare size={24} />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-zinc-950">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-zinc-900 text-zinc-100 rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right z-50 border border-zinc-800 overflow-hidden flex flex-col ${isOpen ? "scale-100 opacity-100 h-[500px]" : "scale-0 opacity-0 h-0"}`}
      >
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            {user?.role === "Admin" && activeChatUserId ? (
              <button
                onClick={() => setActiveChatUserId(null)}
                className="hover:bg-white/20 p-1 -ml-2 rounded-md transition-colors flex items-center"
              >
                <ChevronLeft size={18} />
              </button>
            ) : (
              <MessageSquare size={18} />
            )}
            {shouldRenderList ? "Conversations" : "Support Chat"}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {shouldRenderList ? renderConversationList() : renderChatBox(true)}
      </div>
    </>
  );
};

export default SupportChat;
