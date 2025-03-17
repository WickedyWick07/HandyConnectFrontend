import { useState, useEffect, useContext } from 'react';
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
    const [participantDetails, setParticipantDetails ] = useState([]);
    const [loading, setLoading] = useState(true);  // Added loading state

    useEffect(() => {
        const fetchUser = async () => {
            const user = await fetchCurrentUser();
            setUser(user);
            setUserId(user._id);
        };
        fetchUser();
    }, [fetchCurrentUser]);
    
    const fetchConversations = async () => {
        try {
            setLoading(true);  // Start loading
            const res = await api.post('/get-chats', { userId });
            setConversations(res.data.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);  // Stop loading
        }
    };

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
        if (userId) {
            fetchConversations();
        }
    }, [userId]);

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
            await fetchConversations();
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    if (loading) return <LoadingPage />;  // Show loading page while fetching data

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
                                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-100"
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
