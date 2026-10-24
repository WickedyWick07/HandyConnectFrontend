import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import socket from "../socket";
import AuthContext from "../context/AuthContext";

export default function NotificationBell() {
  console.log("BELL RENDERED");
  const { fetchCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // 1) Get the logged-in user's id
  useEffect(() => {
    if (!localStorage.getItem("access_token")) return;
    fetchCurrentUser()
      .then((u) => {
        console.log("🔔 bell user:", u?._id);
        setUserId(u?._id || null);
      })
      .catch((err) => console.error("🔔 could not get user:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Load existing notifications
  useEffect(() => {
    if (!userId) return;
    api
      .get("/notifications")
      .then((res) => {
        console.log("🔔 fetched:", res.data);
        setItems(res.data.items || []);
        setUnread(res.data.unread || 0);
      })
      .catch((err) => console.error("🔔 fetch failed:", err.response?.data || err.message));
  }, [userId]);

  // 3) Live updates
  useEffect(() => {
    if (!userId) return;

    const register = () => {
      console.log("🔔 registering socket for", userId);
      socket.emit("register", { userId });
    };
    if (socket.connected) register();
    socket.on("connect", register);

    const onNotification = (n) => {
      console.log("🔔 live notification:", n);
      setItems((prev) => [n, ...prev]);
      setUnread((c) => c + 1);
      toast.info(n.title);
      // tells booking pages to refetch their data
      window.dispatchEvent(new CustomEvent("notification:new", { detail: n }));
    };
    socket.on("notification", onNotification);

    return () => {
      socket.off("connect", register);
      socket.off("notification", onNotification);
    };
  }, [userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleClick = (n) => {
    if (!n.read) {
      setItems((prev) => prev.map((i) => (i._id === n._id ? { ...i, read: true } : i)));
      setUnread((c) => Math.max(0, c - 1));
      api.patch(`/notifications/${n._id}/read`).catch(console.error);
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnread(0);
    api.patch("/notifications/read-all").catch(console.error);
  };

  if (!userId) return null;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative text-2xl"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white text-black border rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center p-3 border-b">
            <strong className="text-sm">Notifications</strong>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs text-blue-600">
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 && <p className="p-3 text-sm text-gray-500">No notifications yet</p>}

          {items.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClick(n)}
              className={`p-3 cursor-pointer border-b hover:bg-gray-50 ${n.read ? "" : "bg-blue-50"}`}
            >
              <div className={`text-sm ${n.read ? "" : "font-bold"}`}>{n.title}</div>
              <div className="text-xs text-gray-700">{n.message}</div>
              <div className="text-[10px] text-gray-400 mt-1">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}