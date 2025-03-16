import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const ChatComponent = ({ currentUserId, currentUserType, receiverId, chatId, bookingId }) => {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const messagesContainerRef = useRef(null);
    const messageSoundRef = useRef(null);

    useEffect(() => {
        // Initialize audio object when component mounts
        messageSoundRef.current = new Audio('/message-notification.wav');
        
        // Connect to socket server
        const socketUrl = import.meta.env.VITE_SOCKET_API_URL || 'http://localhost:5000';
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        // Register user
        newSocket.emit('register', {
            userId: currentUserId,
            userType: currentUserType, // 'customer' or 'provider'
        });
        
        // Request notification permission immediately
        if ("Notification" in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
        
        // Listen for incoming messages
        newSocket.on('receive_message', (data) => {
            console.log('Received message:', data);
            
            // Only play sound and increment unread if message is from other user
            if (data.senderId !== currentUserId) {
                // Try to play sound
                if (messageSoundRef.current) {
                    messageSoundRef.current.play().catch(err => console.log('Audio play error:', err));
                }
                
                // Increment unread messages counter
                setUnreadMessages(prev => prev + 1);
                
                // Show notification
                showNotification(data.message);
            }
            
            // Add message to state immediately
            setMessages(prev => [...prev, {
                ...data,
                // Ensure there's a timestamp if not provided
                timestamp: data.timestamp || new Date().toISOString(),
                // Use temporary ID for new messages if needed
                id: data.id || `temp-${Date.now()}`
            }]);
        });

        // Listen for sent message confirmations
        newSocket.on('message_sent', (data) => {
            console.log('Message sent successfully:', data);
        });

        // Cleanup on unmount
        return () => {
            if (newSocket) newSocket.disconnect();
            if (messageSoundRef.current) {
                messageSoundRef.current.pause();
                messageSoundRef.current = null;
            }
        };
    }, [currentUserId, currentUserType]);

    // Show browser notification
    const showNotification = (messageText) => {
        console.log('Attempting to show notification, permission:', Notification.permission);
        
        if ("Notification" in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification('New Message', {
                    body: messageText,
                    icon: '/chat-notification-icon.png',
                    tag: 'chat-message', // Prevents multiple notifications from stacking
                });
                
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
                
                console.log('Notification created:', notification);
            } catch (error) {
                console.error('Error creating notification:', error);
            }
        }
    };

    // Fetch existing messages for the chat room when component mounts
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await api.post("/messages", { chatId });
                console.log('Fetched messages:', res);
                if (res.data && res.data.data) {
                    setMessages(res.data.data);
                }
            } catch (error) {
                console.log('Error fetching messages', error);
            }
        };
        
        if (chatId) {
            fetchMessages();
        }
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
            const currentTime = new Date();
            const messageData = {
                context: bookingId,
                senderId: currentUserId,
                receiverId: receiverId,
                message: message.trim(),
                timestamp: currentTime.toISOString(),
                tempId: `temp-${currentTime.getTime()}` // Add a temporary ID for tracking
            };

            // Immediately add message to UI before sending
            const optimisticMessage = {
                ...messageData,
                senderId: currentUserId,
                senderType: currentUserType,
                pending: true // Mark as pending until confirmed
            };
            
            setMessages(prev => [...prev, optimisticMessage]);
            setMessage(''); // Clear input field immediately

            // Emit private message to the receiver
            socket.emit('private_message', messageData, (acknowledgement) => {
                console.log('Message delivered acknowledgement:', acknowledgement);
                
                // Update the message status if we got acknowledgement
                if (acknowledgement && acknowledgement.success) {
                    setMessages(prev => prev.map(msg => 
                        msg.tempId === messageData.tempId 
                            ? {...msg, pending: false, id: acknowledgement.messageId} 
                            : msg
                    ));
                }
            });

            try {
                // Send message to backend
                const response = await api.post('/send-message', messageData);
                console.log('Message saved to database:', response);
                
                // Update message in state with DB info if needed
                if (response.data && response.data.id) {
                    setMessages(prev => prev.map(msg => 
                        msg.tempId === messageData.tempId 
                            ? {...msg, pending: false, id: response.data.id} 
                            : msg
                    ));
                }
            } catch (error) {
                console.error('Error sending message:', error);
                
                // Mark message as failed
                setMessages(prev => prev.map(msg => 
                    msg.tempId === messageData.tempId 
                        ? {...msg, error: true} 
                        : msg
                ));
            }
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-blue-600 text-white py-4 px-6 flex items-center justify-between">
                <div className="flex items-center">
                    <h2 className="text-lg font-semibold">Chat</h2>
                    {unreadMessages > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 ml-2 text-xs font-bold text-white bg-red-600 rounded-full">
                            {unreadMessages}
                        </span>
                    )}
                </div>
                <span className="text-sm">{currentUserType === 'service provider' ? 'Service Provider' : 'Customer'}</span>
            </div>

            {/* Messages Container */}
            <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
                onClick={handleMessagesView}
                onScroll={handleMessagesView}
            >
                {messages
                    .sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp))
                    .map((msg, index) => (
                        <div
                            key={msg.id || msg.tempId || index}
                            className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs px-4 py-2 rounded-lg shadow ${
                                    msg.senderId === currentUserId 
                                        ? `bg-blue-500 text-white rounded-br-none ${msg.pending ? 'opacity-70' : ''}` 
                                        : 'bg-gray-300 text-gray-900 rounded-bl-none'
                                }`}
                            >
                                <p>{msg.message}</p>
                                <div className="flex justify-between items-center mt-1 text-xs opacity-75">
                                    {msg.pending && (
                                        <span>Sending...</span>
                                    )}
                                    {msg.error && (
                                        <span className="text-red-300">Failed to send</span>
                                    )}
                                    <span className="ml-auto">
                                        {(msg.createdAt || msg.timestamp) 
                                            ? new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            }) 
                                            : "Now"
                                        }
                                    </span>
                                </div>
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