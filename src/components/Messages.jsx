import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import CustomerHeader from './CustomerHeader';
import ProviderHeader from './ProviderHeader'; 
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
    const { fetchCurrentUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState({ conversations: [] });
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
    const [participantDetails, setParticipantDetails ] = useState([])

    useEffect(() => {
        const fetchUser = async () => {
            const user = await fetchCurrentUser();
            setUser(user);
            console.log('current user:', user);
            setUserId(user._id);
        };
        fetchUser();
    }, [fetchCurrentUser]);
    
    const fetchConversations = async () => {
        try {
            const res = await api.post('/get-chats', { userId });
            console.log('conversations', res);
            setConversations(res.data.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };
   console.log('conversations pariticipants:', conversations.participants)
   useEffect(() => {
    const fetchParticipantDetails = async () => {
        try {
            // Check if we have conversations data
            if (!conversations?.conversations?.length) {
                return;
            }

            // Extract all unique participant IDs from all conversations
            const allParticipantIds = conversations.conversations.reduce((ids, conversation) => {
                const participantIds = conversation.participants.map(p => p._id);
                return [...ids, ...participantIds];
            }, []);

            // Remove duplicates
            const uniqueParticipantIds = [...new Set(allParticipantIds)];

            const response = await api.post('/fetch-participant-details', {
                participants: uniqueParticipantIds
            });

            console.log('participant details:', response);
            setParticipantDetails(response.data.data);
        } catch (error) {
            console.log('Error fetching participant details:', error);
        }
    };

    fetchParticipantDetails();
}, [conversations]);
useEffect(() => {
    const fetchParticipantDetails = async () => {
        try {
            if (!conversations?.conversations?.length || !user?._id) {
                return;
            }

            // Get only recipient IDs (filtering out the current user)
            const recipientIds = conversations.conversations.reduce((ids, conversation) => {
                // Find the participant that isn't the current user
                const recipient = conversation.participants.find(p => p._id !== user._id);
                if (recipient) {
                    ids.push(recipient._id);
                }
                return ids;
            }, []);

            // Remove any duplicates
            const uniqueRecipientIds = [...new Set(recipientIds)];

            const response = await api.post('/fetch-participant-details', {
                participants: uniqueRecipientIds
            });

            console.log('recipient details:', response);
            setParticipantDetails(response.data.data);
        } catch (error) {
            console.log('Error fetching recipient details:', error);
        }
    };

    fetchParticipantDetails();
}, [conversations, user]);

// Helper function to get recipient details for a specific conversation
const getRecipientDetails = (conversation) => {
    if (!conversation?.participants || !user?._id) return null;
    
    // Find the participant that isn't the current user
    const recipientId = conversation.participants.find(p => p._id !== user._id)?._id;
    return participantDetails.find(p => p._id === recipientId);
};
    useEffect(() => {
        if (userId) {
            fetchConversations();
        }
    }, [userId]);

    const goToChat = (conversation) => {
        console.log('conversation ID:', conversation._id);
        if (conversation && user.role === 'customer') {
            navigate('/customer/chat', { state: { conversation } });
        } else {
            navigate('/service-provider/chat', { state: { conversation } });
        }
    };

    if (Array.isArray(conversations.conversations)) {
        conversations.conversations.forEach((conversation) => {
            if (Array.isArray(conversation.participants)) {
                conversation.participants.forEach((participant) => {
                    if (user._id === participant._id) {
                        console.log('Participant ID:', participant._id);
                    }
                });
            }
        });
    }


    const deleteConversation = async (conversation) => {
        try {
            console.log('Deleting conversation ID:', conversation._id);
            const conversationId = conversation._id
            await api.delete(`/delete-conversation/${conversationId}`);
            await fetchConversations()
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };
    

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
                                                {recipient.email} {/* Or whatever fields you have */}
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
    </div>    );
};

export default Messages;
