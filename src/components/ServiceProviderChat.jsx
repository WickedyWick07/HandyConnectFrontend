import ChatComponent from "./ChatComponent";
import ProviderHeader from "./ProviderHeader";
import { useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";


function ServiceProviderChat() {
    const location = useLocation();
    const customerFromBooking = location.state?.customer;
    const conversation = location.state?.conversation; // Get conversation from location.state
    const [customer, setCustomer] = useState( customerFromBooking || null);
    const [user, setUser] = useState(null);
    const chat = location.state?.conversation;
    const initialBookingId = location.state?.bookingId || chat?.context;
    const [chatId, setChatId] = useState(chat?._id || null);
    const [bookingId, setBookingId] = useState(initialBookingId);
    const { fetchCurrentUser } = useContext(AuthContext);
    const [fetchCustomerFromBooking, setfetchCustomerBooking] = useState(null);

    console.log("conversation info:", chatId);
    console.log('customer from booking', customerFromBooking);
    console.log('chat info:', chat);
    console.log('booking ID:', bookingId)
    
    
       
  
    
    // Move this inside a useEffect
    useEffect(() => {
        if (customerFromBooking) {
            setfetchCustomerBooking(customerFromBooking);
        }
    }, [customerFromBooking]); // Only run when customerFromBooking changes

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetchCurrentUser();
                console.log("provider info:", res);
                setUser(res);
            } catch (error) {
                console.error("Error fetching user:", error.stack);
            }
        };
        fetchUser();
    }, [fetchCurrentUser]);

    useEffect(() => {
        // Wait for `user` and `conversation` to be defined
        if (user && conversation?.participants) {
            const participants = [...conversation.participants]; // Copy the array
            const otherParticipant = participants.find(
                (participant) => participant._id !== user._id
            );
            if (otherParticipant) {
                setCustomer(otherParticipant); // Set the customer's details
            }
        }
    }, [user, conversation]);

    
    useEffect(() => {
        const initializeChat = async () => {
            if (!chatId && user && customer && bookingId) {
                 console.log("Attempting to initialize chat with:", {
            senderId: user?._id,
            receiverId: customer?._id,
            context: bookingId
        });
                try {
                    const response = await api.post("/send-message", {
                        senderId: user._id,
                        receiverId: customer._id,
                        context:bookingId
                    });
                    console.log("Chat initialized:", response.data.data);
                    setChatId(response.data.data.conversation._id); // Set the new chat ID
                } catch (error) {
                    console.error("Error initializing chat:", error);
                }
            }
        };
    
        initializeChat();
    }, [user, customer, bookingId]);

    console.log("customer info:", customer);

    return (
        <div>
            <div>
                <ProviderHeader />
            </div>

            {user && customer && (
                <ChatComponent
                    currentUserId={user._id}
                    currentUserType={user.role}
                    bookingId={bookingId}
                    receiverId={customer._id || fetchCustomerFromBooking._id}
                    chatId={chatId} // Pass the conversation ID
                />
            )}
        </div>
    );
}

export default ServiceProviderChat;