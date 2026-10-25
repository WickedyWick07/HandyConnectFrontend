import ChatComponent from "./ChatComponent";
import CustomerHeader from "./CustomerHeader";
import { useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";

function CustomerChat() {
    const location = useLocation();
    const chat = location.state?.conversation;
    const booking = location.state?.booking;
    const providerInfo = location.state?.providerInfo;

    const [chatId, setChatId] = useState(chat?._id || null);
    const [provider, setProvider] = useState(null); // provider's USER id (string)
    const [user, setUser] = useState(null);
    const { fetchCurrentUser } = useContext(AuthContext);

    const bookingId = chat?.context || booking?._id;

    useEffect(() => {
        if (providerInfo) {
            setProvider(providerInfo._id || providerInfo);
        }
    }, [providerInfo]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetchCurrentUser();
                setUser(res);
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (user && chat?.participants) {
            const otherParticipant = chat.participants.find(
                (participant) => participant._id !== user._id
            );
            if (otherParticipant) {
                setProvider(otherParticipant._id);
            }
        }
    }, [user, chat]);

    useEffect(() => {
        const initializeChat = async () => {
            if (!chatId && user && provider && bookingId) {
                try {
                    const response = await api.post("/send-message", {
                        senderId: user._id,
                        receiverId: provider,
                        context: bookingId,
                    });
                    setChatId(response.data.data.conversation._id);
                } catch (error) {
                    console.error("Error initializing chat:", error);
                }
            }
        };

        initializeChat();
    }, [chatId, user, provider, bookingId]);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <CustomerHeader />

            <div className="flex-1 min-h-0">
                {user && provider ? (
                    <ChatComponent
                        currentUserId={user._id}
                        bookingId={bookingId}
                        currentUserType={user.role}
                        receiverId={provider}
                        chatId={chatId}
                    />
                ) : (
                    <p className="text-center text-gray-400 py-16">Loading chat...</p>
                )}
            </div>
        </div>
    );
}

export default CustomerChat;