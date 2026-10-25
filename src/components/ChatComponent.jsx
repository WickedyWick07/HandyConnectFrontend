import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import notificationSound from '../../src/assets/notification_sound.mp3';
import notificationIcon from '../../src/assets/Icons/alarm-fill.svg'

const ChatComponent = ({ currentUserId, currentUserType, receiverId, chatId, bookingId }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const messagesContainerRef = useRef(null);
    const messageSoundRef = useRef(null);

    // Latest chatId for the socket listener (which is only set up once)
    const chatIdRef = useRef(chatId);
    useEffect(() => {
        chatIdRef.current = chatId;
    }, [chatId]);

    useEffect(() => {
        messageSoundRef.current = new Audio(notificationSound);

        const socketUrl =
            import.meta.env.VITE_SOCKET_URL ||
            import.meta.env.VITE_SOCKET_API_URL ||
            'http://localhost:5000';
        const newSocket = io(socketUrl);

        const register = () =>
            newSocket.emit('register', { userId: currentUserId, userType: currentUserType });
        register();
        newSocket.on('connect', register); // re-join the room after reconnects

        if ("Notification" in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        newSocket.on('receive_message', (data) => {
            // Ignore messages for a different conversation than the one open
            if (chatIdRef.current && data.conversationId && String(data.conversationId) !== String(chatIdRef.current)) {
                return;
            }

            // My own message: the optimistic copy is already on screen
            if (String(data.senderId) === String(currentUserId)) return;

            if (messageSoundRef.current) {
                messageSoundRef.current.play().catch(err => console.log('Audio play error:', err));
            }
            setUnreadMessages(prev => prev + 1);
            showNotification(data.message);

            setMessages(prev => {
                if (data._id && prev.some(m => m._id === data._id)) return prev; // already have it
                return [...prev, {
                    ...data,
                    timestamp: data.timestamp || new Date().toISOString(),
                    id: data._id || data.id || `temp-${Date.now()}`
                }];
            });
        });

        return () => {
            newSocket.off('connect', register);
            newSocket.disconnect();
            if (messageSoundRef.current) {
                messageSoundRef.current.pause();
                messageSoundRef.current = null;
            }
        };
    }, [currentUserId, currentUserType]);

    const showNotification = (messageText) => {
        if ("Notification" in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification('New Message', {
                    body: messageText,
                    icon: notificationIcon,
                    tag: 'chat-message',
                });
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch (error) {
                console.error('Error creating notification:', error);
            }
        }
    };

    // Load existing messages (polling every 3s stays as a safety net)
    useEffect(() => {
        if (!chatId) return;

        let cancelled = false;

        const fetchMessages = async () => {
            try {
                const res = await api.post("/messages", { chatId });
                if (!cancelled && res.data?.data) {
                    setMessages(res.data.data);
                }
            } catch (error) {
                console.log('Error fetching messages', error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [chatId]);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleMessagesView = () => {
        setUnreadMessages(0);
    };

    const sendMessage = async () => {
        if (message.trim()) {
            const currentTime = new Date();
            const messageData = {
                context: bookingId,
                senderId: currentUserId,
                receiverId: receiverId,
                message: message.trim(),
                timestamp: currentTime.toISOString(),
                tempId: `temp-${currentTime.getTime()}`
            };

            const optimisticMessage = {
                ...messageData,
                senderId: currentUserId,
                senderType: currentUserType,
                pending: true
            };

            setMessages(prev => [...prev, optimisticMessage]);
            setMessage('');

            try {
                const response = await api.post('/send-message', messageData);

                if (response.data?.data?.chat) {
                    const savedChat = response.data.data.chat;
                    setMessages(prev => prev.map(msg =>
                        msg.tempId === messageData.tempId
                            ? { ...msg, pending: false, id: savedChat._id, _id: savedChat._id }
                            : msg
                    ));
                }
            } catch (error) {
                console.error('Error sending message:', error);
                setMessages(prev => prev.map(msg =>
                    msg.tempId === messageData.tempId
                        ? { ...msg, error: true }
                        : msg
                ));
            }
        }
    };

    const isMine = (msg) => String(msg.senderId) === String(currentUserId);

    return (
        <div className="h-full w-full max-w-3xl mx-auto flex flex-col bg-white sm:border-x border-gray-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">Chat</h2>
                    {unreadMessages > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-red-600 rounded-full">
                            {unreadMessages}
                        </span>
                    )}
                </div>
                <span className="text-xs font-medium text-purple-700 bg-purple-50 rounded-full px-3 py-1">
                    {currentUserType === 'service provider' ? 'Service Provider' : 'Customer'}
                </span>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-gray-50"
                onClick={handleMessagesView}
                onScroll={handleMessagesView}
            >
                {messages.length === 0 && (
                    <p className="text-center text-sm text-gray-400 pt-10">No messages yet. Say hello!</p>
                )}

                {[...messages]
                    .sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp))
                    .map((msg, index) => (
                        <div
                            key={msg._id || msg.id || msg.tempId || index}
                            className={`flex ${isMine(msg) ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] sm:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm break-words ${
                                    isMine(msg)
                                        ? `bg-purple-700 text-white rounded-br-sm ${msg.pending ? 'opacity-70' : ''}`
                                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                <div className={`flex items-center justify-end gap-2 mt-1 text-[10px] ${isMine(msg) ? 'text-purple-200' : 'text-gray-400'}`}>
                                    {msg.pending && <span>Sending...</span>}
                                    {msg.error && <span className="text-red-300">Failed to send</span>}
                                    <span>
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

            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 bg-white">
                <input
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                />
                <button
                    className="bg-purple-700 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow hover:bg-purple-800 disabled:opacity-50"
                    onClick={sendMessage}
                    disabled={!message.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatComponent;