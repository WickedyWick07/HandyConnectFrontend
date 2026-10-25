import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import CustomerHeader from './CustomerHeader';
import ProviderHeader from './ProviderHeader';
import Avatar from './Avatar';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LoadingPage from './LoadingPage';

const Messages = () => {
    const { fetchCurrentUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState({ conversations: [] });
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
    const [participantDetails, setParticipantDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const u = await fetchCurrentUser();
                setUser(u);
                setUserId(u._id);
            } catch (error) {
                console.error('Error fetching user:', error);
                setLoading(false);
            }
        };
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchConversations = useCallback(async (silent = false) => {
        if (!userId) return;
        try {
            if (!silent) setLoading(true);
            const res = await api.post('/get-chats', { userId });
            setConversations(res.data.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        const fetchParticipantDetails = async () => {
            try {
                if (!conversations?.conversations?.length || !user?._id) return;

                const recipientIds = conversations.conversations.reduce((ids, conversation) => {
                    const recipient = conversation.participants.find(p => p._id !== user._id);
                    if (recipient) ids.push(recipient._id);
                    return ids;
                }, []);

                const uniqueRecipientIds = [...new Set(recipientIds)];
                const response = await api.post('/fetch-participant-details', {
                    participants: uniqueRecipientIds
                });

                setParticipantDetails(response.data.data);
            } catch (error) {
                console.error('Error fetching recipient details:', error);
            }
        };

        fetchParticipantDetails();
    }, [conversations, user]);

    const getRecipientDetails = (conversation) => {
        if (!conversation?.participants || !user?._id) return null;

        const recipientId = conversation.participants.find(p => p._id !== user._id)?._id;
        return participantDetails.find(p => p._id === recipientId);
    };

    useEffect(() => {
        if (!userId) return;

        const socketUrl =
            import.meta.env.VITE_SOCKET_URL ||
            import.meta.env.VITE_SOCKET_API_URL ||
            'http://localhost:5000';
        const socket = io(socketUrl);
        socketRef.current = socket;

        const register = () => socket.emit('register', { userId });
        register();
        socket.on('connect', register);

        socket.on('new_conversation', (conversation) => {
            setConversations(prev => {
                const list = prev.conversations || [];
                if (list.some(c => c._id === conversation._id)) return prev;
                return { ...prev, conversations: [conversation, ...list] };
            });
        });

        socket.on('receive_message', (msg) => {
            let found = true;
            setConversations(prev => {
                const list = prev.conversations || [];
                const idx = list.findIndex(c => c._id === msg.conversationId);
                if (idx === -1) {
                    found = false;
                    return prev;
                }
                const updated = {
                    ...list[idx],
                    lastMessage: msg.message,
                    lastMessageAt: msg.createdAt || new Date().toISOString()
                };
                return {
                    ...prev,
                    conversations: [updated, ...list.filter((_, i) => i !== idx)]
                };
            });
            setTimeout(() => { if (!found) fetchConversations(true); }, 0);
        });

        return () => {
            socket.off('connect', register);
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
        const refresh = () => fetchConversations(true);
        window.addEventListener('notification:new', refresh);
        return () => window.removeEventListener('notification:new', refresh);
    }, [fetchConversations]);

    const goToChat = (conversation) => {
        if (conversation && user.role === 'customer') {
            navigate('/customer/chat', { state: { conversation } });
        } else {
            navigate('/service-provider/chat', { state: { conversation } });
        }
    };

    const deleteConversation = async (conversation) => {
        try {
            await api.delete(`/delete-conversation/${conversation._id}`);
            await fetchConversations(true);
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    if (loading) return <LoadingPage />;

    const userConvos = Array.isArray(conversations.conversations) ? conversations.conversations : [];

    const displayName = (r) =>
        [r?.firstName, r?.lastName].filter(Boolean).join(' ') || r?.name || r?.email || 'Conversation';

    const formatTime = (d) => {
        if (!d) return '';
        const date = new Date(d);
        const sameDay = date.toDateString() === new Date().toDateString();
        return sameDay
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            {user && user.role === 'customer' ? <CustomerHeader /> : <ProviderHeader />}
            <main className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                        <p className="text-xs text-gray-500">
                            {userConvos.length} conversation{userConvos.length === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {userConvos.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                            {userConvos.map((conversation) => {
                                const recipient = getRecipientDetails(conversation);
                                const name = displayName(recipient);

                                return (
                                    <li
                                        key={conversation._id}
                                        onClick={() => goToChat(conversation)}
                                        className="group flex items-center gap-4 p-4 cursor-pointer hover:bg-purple-50/50 transition"
                                    >
                                        <Avatar path={recipient?.profilePicture} name={name} size="h-12 w-12" />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-3">
                                                <p className="font-semibold text-gray-900 truncate">{name}</p>
                                                <span className="text-[11px] text-gray-400 shrink-0">
                                                    {formatTime(conversation.lastMessageAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate mt-0.5">
                                                {conversation.lastMessage || 'No messages yet'}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteConversation(conversation);
                                            }}
                                            className="shrink-0 text-xs text-red-600 border border-red-200 rounded-md px-2.5 py-1 hover:bg-red-600 hover:text-white hover:border-red-600 transition sm:opacity-0 sm:group-hover:opacity-100"
                                            aria-label="Delete conversation"
                                        >
                                            Delete
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="text-center py-16 px-4">
                            <p className="text-gray-400 font-medium">No conversations yet</p>
                            <p className="text-xs text-gray-400 mt-1">Your chats with providers and customers will show up here.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Messages;