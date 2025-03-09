import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const ChatComponent = ({ currentUserId, currentUserType, receiverId, chatId, bookingId }) => {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    console.log(bookingId)

    useEffect(() => {
        // Connect to socket server
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        // Register user
        newSocket.emit('register', {
            userId: currentUserId,
            userType: currentUserType, // 'customer' or 'provider'
        });

        // Listen for incoming messages
        newSocket.on('receive_message', (data) => {
            setMessages((prev) => [...prev, data]);
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

    // Fetch existing messages for the chat room when the component mounts
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

    const sendMessage = async () => {
        if (message.trim() && socket) {
            const messageData = {
                context:bookingId,
                senderId: currentUserId,
                receiverId: receiverId,
                message: message.trim(),
                timestamp: new Date().toISOString(),
            };

            // Emit private message to the receiver
            socket.emit('private_message', messageData);

            try {
                // Send message to backend (assuming API endpoint exists)
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
                <span className="text-sm">{currentUserType === 'service provider' ? 'Service Provider' : 'Customer'}</span>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // Sort messages by `createdAt`
                    .map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs px-4 py-2 rounded-lg shadow ${msg.senderId === currentUserId ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-300 text-gray-900 rounded-bl-none'}`}
                            >
                                <p>{msg.message}</p>
                                <small className="text-xs block mt-1 text-right opacity-75">
                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Now"}
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
