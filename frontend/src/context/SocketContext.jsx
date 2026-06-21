import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import axiosInstance from "../api/axios.js";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    // Connect to the root of the backend URL (removing /api if present)
    const socketInstance = io(backendUrl.replace(/\/api\/?$/, ""), {
      withCredentials: true,
      auth: {
        token: document.cookie
          .split("; ")
          .find((c) => c.startsWith("accessToken="))
          ?.split("=")[1],
      },
    });

    setSocket(socketInstance);

    // Join personal room and admin room if applicable
    socketInstance.emit("joinRoom", user._id);
    if (user.role === "Admin") {
      socketInstance.emit("joinRoom", "admin_room");
    }

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const res = await axiosInstance.get("/message/unread-count");
        if (res.data.success) {
          setUnreadCount(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch unread count", err);
      }
    };
    fetchUnreadCount();

    socketInstance.on("receiveMessage", () => {
      fetchUnreadCount();
    });

    return () => {
      socketInstance.off("receiveMessage");
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};
