import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import CustomerHeader from './CustomerHeader';
import ProviderHeader from './ProviderHeader';
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

    // silent = true -> no full-page spinner (used for live refreshes)
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

    // Live updates over the socket
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
        socket.on('connect', register); // re-join the room after reconnects

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
            // Unknown conversation: reload the list quietly
            setTimeout(() => { if (!found) fetchConversations(true); }, 0);
        });

        return () => {
            socket.off('connect', register);
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Also refresh when a notification arrives (e.g. a message notification)
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

    return (
        <div className="bg-gray-100 min-h-screen">
            {user && user.role === 'customer' ? <CustomerHeader /> : <ProviderHeader />}
            <main className="container mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Messages</h1>

                <div className="bg-white rounded-lg shadow-md p-6">
                    {userConvos.length > 0 ? (
                        <div className="space-y-4">
                            {userConvos.map((conversation) => {
                                const recipient = getRecipientDetails(conversation);

                                return (
                                    <div
                                        onClick={() => goToChat(conversation)}
                                        key={conversation._id}
                                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-100 cursor-pointer"
                                    >
                                        {recipient && (
                                            <div className="mb-2">
                                                <p className="text-lg font-medium text-gray-700">
                                                    {recipient.email}
                                                </p>
                                                {recipient.profilePicture && (
                                                    <img
                                                        src={recipient.profilePicture}
                                                        alt="Profile"
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <p className="text-lg font-medium text-gray-700">
                                            {conversation.lastMessage}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Last updated: {new Date(conversation.lastMessageAt).toLocaleString()}
                                        </p>
                                        <div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteConversation(conversation);
                                                }}
                                                className="bg-red-500 text-white px-4 py-2 rounded mt-2"
                                            >
                                                Delete Conversation
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500">No conversations available.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Messages;