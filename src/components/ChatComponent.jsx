import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const ChatComponent = ({ currentUserId, currentUserType, receiverId, chatId, bookingId }) => {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const messagesContainerRef = useRef(null);
    const messageSoundRef = useRef(new Audio('/message-notification.wav')); // Store audio locally

    useEffect(() => {
        // Connect to socket server
        const socketUrl = import.meta.env.VITE_SOCKET_API_URL || 'http://localhost:5000';
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        // Register user
        newSocket.emit('register', {
            userId: currentUserId,
            userType: currentUserType, // 'customer' or 'provider'
        });
        
        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Listen for incoming messages
        newSocket.on('receive_message', (data) => {
            // Only play sound and increment unread if message is from other user
            if (data.senderId !== currentUserId) {
                // Try to play sound (handle potential browser restrictions)
                try {
                    messageSoundRef.current.play().catch(err => console.log('Could not play notification sound', err));
                } catch (error) {
                    console.log('Audio play error:', error);
                }
                
                // Increment unread messages counter
                setUnreadMessages(prev => prev + 1);
                
                // Show notification if permitted
                showNotification(data.message);
            }
            
            // Add message to state
            setMessages(prev => [...prev, data]);
        });

        // Listen for sent message confirmations
        newSocket.on('message_sent', (data) => {
            console.log('Message sent successfully:', data);
        });

        // Cleanup on unmount
        return () => {
            newSocket.close();
        };
    }, [currentUserId, currentUserType]);

    // Show browser notification
    const showNotification = (messageText) => {
        if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
            new Notification('New Message', {
                body: messageText,
                icon: '/chat-notification-icon.png', // Store icon locally
            });
        }
    };

    // Fetch existing messages for the chat room when component mounts
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await api.post("/messages", { chatId });
                console.log('Fetched messages:', res);
                setMessages(res.data.data); // Assuming res.data.data contains the messages
            } catch (error) {
                console.log('Error fetching messages', error);
            }
        };
        
        fetchMessages();
    }, [chatId]); // Refetch messages if chatId changes

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Reset unread count when user actively views the messages
    const handleMessagesView = () => {
        setUnreadMessages(0);
    };

    const sendMessage = async () => {
        if (message.trim() && socket) {
            const messageData = {
                context: bookingId,
                senderId: currentUserId,
                receiverId: receiverId,
                message: message.trim(),
                timestamp: new Date().toISOString(),
            };

            // Emit private message to the receiver
            socket.emit('private_message', messageData);

            try {
                // Send message to backend
                await api.post('/send-message', messageData);
            } catch (error) {
                console.error('Error sending message:', error);
            }

            // Optimistically add the message to the UI
            setMessages((prev) => [
                ...prev,
                {
                    ...messageData,
                    senderId: currentUserId,
                    senderType: currentUserType,
                },
            ]);
            setMessage(''); // Clear input field
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-blue-600 text-white py-4 px-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Chat</h2>
                <div className="flex items-center">
                    {unreadMessages > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                            {unreadMessages}
                        </span>
                    )}
                    <span className="text-sm">{currentUserType === 'service provider' ? 'Service Provider' : 'Customer'}</span>
                </div>
            </div>

            {/* Messages Container */}
            <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
                onClick={handleMessagesView} // Reset unread count when clicked
                onScroll={handleMessagesView} // Reset unread count when scrolled
            >
                {messages
                    .sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp))
                    .map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs px-4 py-2 rounded-lg shadow ${
                                    msg.senderId === currentUserId 
                                        ? 'bg-blue-500 text-white rounded-br-none' 
                                        : 'bg-gray-300 text-gray-900 rounded-bl-none'
                                }`}
                            >
                                <p>{msg.message}</p>
                                <small className="text-xs block mt-1 text-right opacity-75">
                                    {(msg.createdAt || msg.timestamp) 
                                        ? new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        }) 
                                        : "Now"
                                    }
                                </small>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Input Container */}
            <div className="bg-white py-4 px-6 border-t flex items-center">
                <input
                    className="flex-1 bg-gray-200 rounded-full px-4 py-2 text-gray-800 focus:outline-none focus:ring focus:ring-blue-300"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                />
                <button
                    className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow hover:bg-blue-700"
                    onClick={sendMessage}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatComponent;