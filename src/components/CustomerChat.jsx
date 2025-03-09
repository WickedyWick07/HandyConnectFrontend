import ChatComponent from "./ChatComponent";
import CustomerHeader from "./CustomerHeader";
import { useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";

function CustomerChat() {
    const location = useLocation();
    const chat = location.state?.conversation;
    const [chatId, setChatId] = useState(chat?._id || null)
    const [provider, setProvider] = useState(null);
    const [user, setUser] = useState(null);
    const booking = location.state?.booking

    const { fetchCurrentUser } = useContext(AuthContext);
    const providerInfo = location.state?.providerInfo

    console.log("chat info:", chat);
    console.log("provider info:", providerInfo);
    console.log('booking', booking
    )
    
    const bookingId = chat.context
    console.log('booking ID:', bookingId)
    

    
         
    useEffect(() => {
        if (providerInfo) {
            setProvider(providerInfo);
        }
    }, [providerInfo]); // Only run when providerInfo changes

    useEffect(() => {
        // Fetch the current user
        const fetchUser = async () => {
            try {
                const res = await fetchCurrentUser();
                console.log("customer info:", res);
                setUser(res);
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };
        fetchUser();
    }, [fetchCurrentUser]);

    useEffect(() => {
        // Wait for `user` and `chat` to be defined
        
        if (user && chat?.participants) {
            const participants = [...chat.participants]; // Copy the array
            const otherParticipant = participants.find(
                (participant) => participant._id !== user._id
            );
            if (otherParticipant) {
                console.log('other participant:', otherParticipant);
                setProvider(otherParticipant._id); // Set the provider's ID
            }
        }

    }, [user, chat]);

    console.log("provider id:", provider);

    useEffect(() => {
        const initializeChat = async () => {
            if (!chatId && user && provider) {
                try {
                    const response = await api.post("/send-message", {
                        senderId: user._id,
                        receiverId: provider._id,
                        context:{bookingId: booking._id}
                    });
                    console.log("Chat initialized:", response.data.data);
                    setChatId(response.data.data.conversation._id); // Set the new chat ID
                } catch (error) {
                    console.error("Error initializing chat:", error);
                }
            }
        };
    
        initializeChat();
    }, [chatId, user, provider]);


   

    return (
        <div>
            <div>
                <CustomerHeader />
            </div>

            {user && provider && (
                <ChatComponent
                    currentUserId={user._id}
                    bookingId={bookingId}
                    currentUserType={user.role}
                    receiverId={provider || provider._id}
                    chatId={chatId}
                />
            )}
        </div>
    );
}

export default CustomerChat;
