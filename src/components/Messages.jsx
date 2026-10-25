import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCheck,
    Clock3,
    FileText,
    LayoutDashboard,
    Loader2,
    MessageCircle,
    MoreVertical,
    Paperclip,
    Phone,
    RefreshCw,
    Search,
    Send,
    Smile,
    Trash2,
    User,
    Video,
    X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const EMOJIS = ['👍', '❤️', '😊', '😂', '🙏', '🎉', '👌', '🔥', '😮', '😢', '✅', '🙌'];

const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';
const iconButton = `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-800 ${focusRing}`;

const getId = (value) => {
    if (!value) return '';
    return typeof value === 'string' ? value : String(value._id || value.id || '');
};

const getParticipantName = (participant) => {
    if (!participant) return 'HandyConnect user';
    const fullName = [participant.firstName, participant.lastName].filter(Boolean).join(' ').trim();
    return fullName || participant.name || participant.email || 'HandyConnect user';
};

const getAvatarUrl = (participant) => {
    const path = participant?.profilePicture;
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const apiBase =
        import.meta.env.VITE_IMAGES_API_URL ||
        import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
        'http://localhost:5000';
    return `${apiBase.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const formatRelativeTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return 'Now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
};

const formatMessageTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ''
        : new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
};

const formatFullDateTime = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ''
        : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const getDateLabel = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
};

const dayKey = (message) => new Date(message?.createdAt || Date.now()).toDateString();

const getMessageText = (message) => message?.message || (message?.attachment ? 'Attachment' : '');

const sortByLatest = (list) =>
    [...list].sort((first, second) => new Date(second.lastMessageAt || 0) - new Date(first.lastMessageAt || 0));

/* -------------------------------------------------------------------------- */
/* Small components                                                            */
/* -------------------------------------------------------------------------- */

const Avatar = ({ participant, online = false, size = 'h-12 w-12' }) => {
    const [failed, setFailed] = useState(false);
    const avatarUrl = getAvatarUrl(participant);
    const name = getParticipantName(participant);
    const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

    return (
        <div
            className={`${size} relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-sm font-semibold text-blue-700`}
        >
            {avatarUrl && !failed ? (
                <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                <span aria-hidden="true">{initials || <User size={20} />}</span>
            )}
            {online && (
                <span
                    className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
                    title="Online"
                />
            )}
        </div>
    );
};

const Modal = ({ title, description, onClose, children }) => {
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="messages-modal-title"
                className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:pb-6"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 id="messages-modal-title" className="text-lg font-semibold text-slate-900">
                            {title}
                        </h2>
                        {description && <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>}
                    </div>
                    <button type="button" aria-label="Close dialog" onClick={onClose} className={`-mr-2 -mt-2 ${iconButton}`}>
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const MessageSkeleton = () => (
    <div className="mx-auto flex w-full max-w-3xl animate-pulse flex-col gap-3" aria-busy="true">
        <div className="h-12 w-3/5 rounded-2xl rounded-bl-md bg-slate-200/70" />
        <div className="ml-auto h-10 w-2/5 rounded-2xl rounded-br-md bg-blue-200/60" />
        <div className="h-16 w-2/3 rounded-2xl rounded-bl-md bg-slate-200/70" />
        <div className="ml-auto h-12 w-1/2 rounded-2xl rounded-br-md bg-blue-200/60" />
    </div>
);

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const Messages = () => {
    const { fetchCurrentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState('');
    const [messages, setMessages] = useState([]);
    const [search, setSearch] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [pageError, setPageError] = useState('');
    const [messageError, setMessageError] = useState('');
    const [messageReloadKey, setMessageReloadKey] = useState(0);
    const [draft, setDraft] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [openMenuId, setOpenMenuId] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
    const [attachmentDraft, setAttachmentDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [, setClock] = useState(0);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const activeConversationRef = useRef('');
    const socketRef = useRef(null);
    const currentUserRef = useRef('');
    const seenMessageIdsRef = useRef(new Set());

    const authHeaders = useMemo(() => {
        const token = localStorage.getItem('access_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    const getOtherParticipant = useCallback(
        (conversation) => {
            const participants = conversation?.participants || [];
            return participants.find((participant) => getId(participant) !== getId(user)) || null;
        },
        [user]
    );

    /* ---- Data: conversations ------------------------------------------- */
    const fetchConversations = useCallback(async () => {
        setPageError('');
        try {
            const response = await api.get('/conversations', { headers: authHeaders });
            const list = Array.isArray(response.data.conversations) ? response.data.conversations : [];
            setConversations(list);
            return list;
        } catch (error) {
            console.error('Error loading conversations:', error);
            setPageError(
                error.response?.data?.message ||
                    'Your conversations could not be loaded. Check your connection and try again.'
            );
            throw error;
        } finally {
            setLoadingConversations(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        let mounted = true;
        const loadCurrentUser = async () => {
            try {
                const currentUser = await fetchCurrentUser();
                if (mounted) setUser(currentUser);
            } catch (error) {
                console.error('Error loading the signed-in user:', error);
                if (!mounted) return;
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    try {
                        setUser(JSON.parse(savedUser));
                    } catch (parseError) {
                        console.error('Saved user information is invalid:', parseError);
                        setPageError('Your sign-in information could not be read. Please sign in again.');
                        setLoadingConversations(false);
                    }
                } else {
                    setPageError('Please sign in to view your messages.');
                    setLoadingConversations(false);
                }
            }
        };

        loadCurrentUser();
        return () => {
            mounted = false;
        };
    }, [fetchCurrentUser]);

    useEffect(() => {
        const userId = getId(user);
        if (!userId) return;
        currentUserRef.current = userId;
        fetchConversations().catch(() => {});
    }, [fetchConversations, user]);

    useEffect(() => {
        activeConversationRef.current = activeConversationId;
    }, [activeConversationId]);

    // Keep "2m ago" labels fresh
    useEffect(() => {
        const id = setInterval(() => setClock((tick) => tick + 1), 60000);
        return () => clearInterval(id);
    }, []);

    /* ---- Socket.IO (same events as before) ----------------------------- */
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return undefined;

        const socketUrl =
            import.meta.env.VITE_SOCKET_API_URL ||
            import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
            'http://localhost:5000';
        const connection = io(socketUrl, { auth: { token } });
        socketRef.current = connection;

        connection.on('connect', () => setSocketConnected(true));
        connection.on('disconnect', () => {
            setSocketConnected(false);
            setTypingUsers([]);
        });
        connection.on('connect_error', (error) => {
            console.error('Socket.IO connection failed:', error);
            setSocketConnected(false);
        });
        connection.on('presence', (ids) => setOnlineUsers(Array.isArray(ids) ? ids.map(String) : []));
        connection.on('presenceUpdate', ({ userId, online }) => {
            setOnlineUsers((current) =>
                online ? [...new Set([...current, String(userId)])] : current.filter((id) => id !== String(userId))
            );
        });

        const handleIncomingMessage = (incoming) => {
            const conversationId = String(incoming?.conversationId || '');
            if (!conversationId || !incoming?._id) return;

            // The server may emit both event names; only count a message once
            const messageId = String(incoming._id);
            if (seenMessageIdsRef.current.has(messageId)) return;
            seenMessageIdsRef.current.add(messageId);

            setConversations((current) => {
                const existing = current.find((conversation) => String(conversation._id) === conversationId);
                if (!existing) return current;
                const isActive = activeConversationRef.current === conversationId;
                const incomingFromOther = getId(incoming.senderId) !== currentUserRef.current;
                return sortByLatest(
                    current.map((conversation) =>
                        String(conversation._id) === conversationId
                            ? {
                                  ...conversation,
                                  lastMessage: getMessageText(incoming),
                                  lastMessageAt: incoming.createdAt || new Date().toISOString(),
                                  unreadCount:
                                      isActive || !incomingFromOther ? 0 : (Number(conversation.unreadCount) || 0) + 1,
                              }
                            : conversation
                    )
                );
            });

            if (activeConversationRef.current === conversationId) {
                setMessages((current) =>
                    current.some((message) => String(message._id) === messageId) ? current : [...current, incoming]
                );
            }
        };

        connection.on('receiveMessage', handleIncomingMessage);
        connection.on('receive_message', handleIncomingMessage);
        connection.on('typing', ({ conversationId, userId, isTyping }) => {
            if (String(conversationId) !== activeConversationRef.current || String(userId) === currentUserRef.current) {
                return;
            }
            setTypingUsers((current) =>
                isTyping ? [...new Set([...current, String(userId)])] : current.filter((id) => id !== String(userId))
            );
        });

        return () => {
            connection.disconnect();
            socketRef.current = null;
        };
    }, []);

    const activeConversation = conversations.find((conversation) => String(conversation._id) === activeConversationId);
    const recipient = getOtherParticipant(activeConversation);
    const recipientId = getId(recipient);
    const isRecipientOnline = onlineUsers.includes(recipientId);
    const recipientTyping = typingUsers.length > 0;
    const chatOpen = Boolean(activeConversationId);

    /* ---- Data: messages ------------------------------------------------ */
    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return undefined;
        }

        let mounted = true;
        setLoadingMessages(true);
        setMessageError('');
        setTypingUsers([]);

        api.get(`/messages/${activeConversationId}`, { headers: authHeaders })
            .then((response) => {
                if (!mounted) return;
                const loaded = Array.isArray(response.data.messages) ? response.data.messages : [];
                loaded.forEach((message) => message?._id && seenMessageIdsRef.current.add(String(message._id)));
                setMessages(loaded);
                setConversations((current) =>
                    current.map((conversation) =>
                        String(conversation._id) === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation
                    )
                );
            })
            .catch((error) => {
                console.error('Error loading messages:', error);
                if (mounted) setMessageError(error.response?.data?.message || 'Messages could not be loaded. Try again.');
            })
            .finally(() => {
                if (mounted) setLoadingMessages(false);
            });

        return () => {
            mounted = false;
        };
    }, [activeConversationId, authHeaders, messageReloadKey]);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, activeConversationId, recipientTyping, loadingMessages]);

    useEffect(
        () => () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        },
        []
    );

    // Grow the message box with its content (up to ~5 lines)
    useEffect(() => {
        const element = textareaRef.current;
        if (!element) return;
        element.style.height = 'auto';
        element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
    }, [draft, activeConversationId]);

    // Close menus when clicking elsewhere or pressing ESC
    useEffect(() => {
        if (!openMenuId && !showEmojiPicker) return undefined;
        const onPointerDown = (event) => {
            if (!event.target.closest?.('[data-conv-menu]')) setOpenMenuId('');
            if (!event.target.closest?.('[data-emoji-root]')) setShowEmojiPicker(false);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpenMenuId('');
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [openMenuId, showEmojiPicker]);

    /* ---- Derived ------------------------------------------------------- */
    const filteredConversations = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return conversations;
        return conversations.filter((conversation) => {
            const other = getOtherParticipant(conversation);
            return `${getParticipantName(other)} ${other?.email || ''} ${conversation.lastMessage || ''}`
                .toLowerCase()
                .includes(query);
        });
    }, [conversations, getOtherParticipant, search]);

    /* ---- Actions ------------------------------------------------------- */
    const selectConversation = (conversation) => {
        setActiveConversationId(String(conversation._id));
        setOpenMenuId('');
        setShowEmojiPicker(false);
    };

    const handleRefresh = () => {
        setLoadingConversations(true);
        fetchConversations().catch(() => {});
    };

    const goToDashboard = () =>
        navigate(user?.role === 'service provider' ? '/dashboard/service-provider' : '/dashboard/customer');

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const conversationId = String(deleteTarget._id);
        setDeleting(true);
        try {
            await api.delete(`/conversations/${conversationId}`, { headers: authHeaders });
            setConversations((current) => current.filter((conversation) => String(conversation._id) !== conversationId));
            if (activeConversationRef.current === conversationId) {
                setActiveConversationId('');
                setMessages([]);
            }
            setDeleteTarget(null);
            toast.success('Conversation deleted.');
        } catch (error) {
            console.error('Error deleting conversation:', error);
            toast.error(error.response?.data?.message || 'Conversation could not be deleted.');
        } finally {
            setDeleting(false);
        }
    };

    const emitTyping = (isTyping) => {
        if (!socketRef.current?.connected || !activeConversationId) return;
        socketRef.current.emit('typing', { conversationId: activeConversationId, isTyping });
    };

    const handleDraftChange = (event) => {
        setDraft(event.target.value);
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            emitTyping(true);
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            emitTyping(false);
        }, 1200);
    };

    const sendMessage = async (event) => {
        event.preventDefault();
        const trimmedMessage = draft.trim();
        const attachment = attachmentUrl.trim();
        if ((!trimmedMessage && !attachment) || !activeConversationId || sending) return;

        setSending(true);
        setDraft('');
        setAttachmentUrl('');
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        isTypingRef.current = false;
        emitTyping(false);

        try {
            const response = await api.post(
                '/messages',
                {
                    conversationId: activeConversationId,
                    message: trimmedMessage,
                    attachment: attachment || undefined,
                },
                { headers: authHeaders }
            );
            const savedMessage = response.data.message;
            if (savedMessage?._id) seenMessageIdsRef.current.add(String(savedMessage._id));
            setMessages((current) =>
                current.some((message) => String(message._id) === String(savedMessage._id))
                    ? current
                    : [...current, savedMessage]
            );
            setConversations((current) =>
                sortByLatest(
                    current.map((conversation) =>
                        String(conversation._id) === activeConversationId
                            ? {
                                  ...conversation,
                                  lastMessage: getMessageText(savedMessage),
                                  lastMessageAt: savedMessage.createdAt,
                                  unreadCount: 0,
                              }
                            : conversation
                    )
                )
            );

            if (socketRef.current?.connected) {
                socketRef.current.emit(
                    'sendMessage',
                    { conversationId: activeConversationId, messageId: savedMessage._id },
                    (acknowledgement) => {
                        if (!acknowledgement?.success) {
                            console.error('Socket message delivery failed:', acknowledgement?.message);
                            return;
                        }
                        setMessages((current) =>
                            current.map((message) =>
                                String(message._id) === String(savedMessage._id) ? { ...message, delivered: true } : message
                            )
                        );
                    }
                );
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setDraft(trimmedMessage);
            setAttachmentUrl(attachment);
            toast.error(error.response?.data?.message || 'Your message could not be sent.');
        } finally {
            setSending(false);
        }
    };

    const handleComposerKeyDown = (event) => {
        // On touch screens Enter adds a new line; on desktop Enter sends (Shift+Enter = new line)
        const touchDevice = window.matchMedia?.('(pointer: coarse)')?.matches;
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent?.isComposing && !touchDevice) {
            event.preventDefault();
            sendMessage(event);
        }
    };

    const handleEmoji = (emoji) => {
        setDraft((current) => `${current}${emoji}`);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    };

    const saveAttachmentLink = () => {
        const value = attachmentDraft.trim();
        if (value && !/^https?:\/\//i.test(value)) {
            toast.error('Enter a valid http or https link.');
            return;
        }
        setAttachmentUrl(value);
        setAttachmentDraft('');
        setShowAttachmentDialog(false);
    };

    const getRoleLabel = (participant) => (participant?.role === 'service provider' ? 'Service provider' : 'Customer');

    /* ---- Render pieces ------------------------------------------------- */
    const renderMessageBody = (message, mine) => (
        <>
            {message.message && (
                <p className="whitespace-pre-wrap break-words text-[15px] leading-6">{message.message}</p>
            )}
            {message.attachment && (
                <a
                    href={message.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-2 inline-flex max-w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium underline-offset-2 hover:underline ${
                        mine ? 'bg-white/15 text-white' : 'bg-slate-100 text-blue-700'
                    }`}
                >
                    <FileText size={16} aria-hidden="true" />
                    <span className="truncate">Open attachment</span>
                </a>
            )}
        </>
    );

    if (loadingConversations && !user) {
        return (
            <main className="flex h-[100dvh] items-center justify-center bg-slate-50 p-6">
                <div className="text-center">
                    <Loader2 className="mx-auto animate-spin text-blue-600" size={36} aria-hidden="true" />
                    <p className="mt-4 font-medium text-slate-700">Loading your messages…</p>
                </div>
            </main>
        );
    }

    return (
        <main className="h-[100dvh] overflow-hidden bg-slate-100 font-[family-name:Inter,ui-sans-serif,system-ui,sans-serif] text-slate-900 md:p-4">
            <div className="relative mx-auto flex h-full max-w-[1600px] overflow-hidden bg-white md:rounded-2xl md:border md:border-slate-200 md:shadow-sm">
                {/* ============================ Conversation list ============================ */}
                <aside
                    aria-label="Conversations"
                    className={`absolute inset-0 z-10 flex min-h-0 flex-col bg-white transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none md:visible md:relative md:inset-auto md:z-auto md:w-[35%] md:min-w-[300px] md:max-w-[440px] md:shrink-0 md:translate-x-0 md:border-r md:border-slate-200 ${
                        chatOpen ? 'invisible -translate-x-full' : 'visible translate-x-0'
                    }`}
                >
                    <header className="shrink-0 border-b border-slate-100 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500" aria-live="polite">
                                    <span
                                        className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                        aria-hidden="true"
                                    />
                                    {socketConnected ? 'Connected' : 'Connecting…'}
                                </p>
                            </div>
                            <div className="-mr-2 flex items-center">
                                <button type="button" onClick={goToDashboard} aria-label="Back to dashboard" title="Back to dashboard" className={iconButton}>
                                    <LayoutDashboard size={20} aria-hidden="true" />
                                </button>
                                <button type="button" onClick={handleRefresh} aria-label="Refresh conversations" title="Refresh" className={iconButton}>
                                    <RefreshCw size={19} className={loadingConversations ? 'animate-spin' : ''} aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        <div className="relative mt-4">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                aria-hidden="true"
                            />
                            <label htmlFor="conversation-search" className="sr-only">
                                Search conversations
                            </label>
                            <input
                                id="conversation-search"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name or email"
                                className="h-12 w-full min-w-0 rounded-xl border border-transparent bg-slate-100 pl-11 pr-11 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 md:text-sm [&::-webkit-search-cancel-button]:hidden"
                            />
                            {search && (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setSearch('')}
                                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:text-slate-700"
                                >
                                    <X size={16} aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </header>

                    <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-label="Conversation list">
                        {loadingConversations ? (
                            <div className="space-y-5 p-5" aria-busy="true">
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <div key={item} className="flex animate-pulse items-center gap-3">
                                        <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />
                                        <div className="flex-1">
                                            <div className="h-3.5 w-2/5 rounded bg-slate-200" />
                                            <div className="mt-2.5 h-3 w-3/4 rounded bg-slate-100" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : pageError ? (
                            <div role="alert" className="m-4 rounded-2xl border border-rose-100 bg-rose-50 p-5 text-center">
                                <AlertCircle className="mx-auto text-rose-500" size={26} aria-hidden="true" />
                                <p className="mt-3 text-sm font-medium text-rose-800">{pageError}</p>
                                <button
                                    type="button"
                                    onClick={handleRefresh}
                                    className={`mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-rose-700 shadow-sm transition-colors hover:bg-rose-100 ${focusRing}`}
                                >
                                    <RefreshCw size={15} aria-hidden="true" /> Try again
                                </button>
                            </div>
                        ) : filteredConversations.length ? (
                            <ul className="py-1">
                                {filteredConversations.map((conversation) => {
                                    const conversationId = String(conversation._id);
                                    const other = getOtherParticipant(conversation);
                                    const name = getParticipantName(other);
                                    const isActive = conversationId === activeConversationId;
                                    const unreadCount = Number(conversation.unreadCount) || 0;
                                    const menuOpen = openMenuId === conversationId;
                                    return (
                                        <li key={conversationId} className="group relative px-2">
                                            <div
                                                className={`flex items-center rounded-2xl transition-colors duration-200 ${
                                                    isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => selectConversation(conversation)}
                                                    aria-current={isActive ? 'true' : undefined}
                                                    className={`flex min-h-[76px] min-w-0 flex-1 items-center gap-3 rounded-2xl py-3 pl-3 pr-1 text-left ${focusRing} focus-visible:ring-inset`}
                                                >
                                                    <Avatar participant={other} online={onlineUsers.includes(getId(other))} />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex items-baseline justify-between gap-2">
                                                            <span
                                                                className={`truncate text-[15px] text-slate-900 ${
                                                                    unreadCount > 0 ? 'font-bold' : 'font-semibold'
                                                                }`}
                                                            >
                                                                {name}
                                                            </span>
                                                            <span
                                                                className={`shrink-0 text-xs ${
                                                                    unreadCount > 0 ? 'font-semibold text-blue-600' : 'text-slate-400'
                                                                }`}
                                                            >
                                                                {formatRelativeTime(conversation.lastMessageAt)}
                                                            </span>
                                                        </span>
                                                        <span className="mt-0.5 flex items-center justify-between gap-2">
                                                            <span
                                                                className={`truncate text-sm ${
                                                                    unreadCount > 0 ? 'font-medium text-slate-700' : 'text-slate-500'
                                                                }`}
                                                            >
                                                                {conversation.lastMessage || 'Start the conversation'}
                                                            </span>
                                                            {unreadCount > 0 && (
                                                                <span
                                                                    className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white"
                                                                    aria-label={`${unreadCount} unread`}
                                                                >
                                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </span>
                                                </button>

                                                <div data-conv-menu className="relative shrink-0 pr-1">
                                                    <button
                                                        type="button"
                                                        aria-label={`Options for ${name}`}
                                                        aria-haspopup="menu"
                                                        aria-expanded={menuOpen}
                                                        onClick={() => setOpenMenuId(menuOpen ? '' : conversationId)}
                                                        className={`${iconButton} md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 ${
                                                            menuOpen || isActive ? 'md:opacity-100' : ''
                                                        }`}
                                                    >
                                                        <MoreVertical size={19} aria-hidden="true" />
                                                    </button>
                                                    {menuOpen && (
                                                        <div
                                                            role="menu"
                                                            className="absolute right-1 top-12 z-30 w-52 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg"
                                                        >
                                                            <button
                                                                type="button"
                                                                role="menuitem"
                                                                onClick={() => {
                                                                    setOpenMenuId('');
                                                                    setDeleteTarget(conversation);
                                                                }}
                                                                className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 ${focusRing}`}
                                                            >
                                                                <Trash2 size={16} aria-hidden="true" /> Delete conversation
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="px-6 py-16 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    {search ? <Search size={24} aria-hidden="true" /> : <MessageCircle size={25} aria-hidden="true" />}
                                </div>
                                <h2 className="mt-4 font-semibold text-slate-800">
                                    {search ? 'No matches found' : 'No conversations yet'}
                                </h2>
                                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                    {search
                                        ? 'Try another name or email address.'
                                        : 'When you start a conversation about a booking, it will appear here.'}
                                </p>
                            </div>
                        )}
                    </section>
                </aside>

                {/* ================================ Chat panel =============================== */}
                <section
                    aria-label="Chat"
                    className={`absolute inset-0 z-20 flex min-h-0 min-w-0 flex-col bg-slate-50 transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none md:visible md:relative md:inset-auto md:z-auto md:flex-1 md:translate-x-0 ${
                        chatOpen ? 'visible translate-x-0' : 'invisible translate-x-full'
                    }`}
                >
                    {activeConversation && recipient ? (
                        <>
                            <header className="z-10 flex min-h-[68px] shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-3 sm:px-4 md:pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveConversationId('')}
                                    aria-label="Back to conversations"
                                    className={`${iconButton} md:hidden`}
                                >
                                    <ArrowLeft size={21} aria-hidden="true" />
                                </button>
                                <Avatar participant={recipient} online={isRecipientOnline} size="h-11 w-11" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="truncate font-semibold text-slate-900">{getParticipantName(recipient)}</h2>
                                        <span className="hidden shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 sm:inline">
                                            {getRoleLabel(recipient)}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500" aria-live="polite">
                                        <span
                                            className={`h-2 w-2 shrink-0 rounded-full ${isRecipientOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                            aria-hidden="true"
                                        />
                                        <span className="truncate">
                                            {recipientTyping ? (
                                                <span className="font-medium text-blue-600">typing…</span>
                                            ) : isRecipientOnline ? (
                                                'Online via Socket.IO'
                                            ) : (
                                                getRoleLabel(recipient)
                                            )}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center">
                                    <button
                                        type="button"
                                        aria-label="Voice call"
                                        title="Voice calls are not available yet"
                                        onClick={() => toast.info('Voice calls are not available yet.')}
                                        className={iconButton}
                                    >
                                        <Phone size={19} aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Video call"
                                        title="Video calls are not available yet"
                                        onClick={() => toast.info('Video calls are not available yet.')}
                                        className={iconButton}
                                    >
                                        <Video size={20} aria-hidden="true" />
                                    </button>
                                </div>
                            </header>

                            <div
                                role="log"
                                aria-label="Messages"
                                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6 md:px-8"
                            >
                                {loadingMessages ? (
                                    <MessageSkeleton />
                                ) : messageError ? (
                                    <div role="alert" className="flex h-full flex-col items-center justify-center p-6 text-center">
                                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                                            <AlertCircle size={28} aria-hidden="true" />
                                        </span>
                                        <p className="mt-4 font-semibold text-slate-800">Couldn&apos;t load messages</p>
                                        <p className="mt-1 max-w-sm text-sm text-slate-500">{messageError}</p>
                                        <button
                                            type="button"
                                            onClick={() => setMessageReloadKey((current) => current + 1)}
                                            className={`mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 ${focusRing}`}
                                        >
                                            <RefreshCw size={15} aria-hidden="true" /> Retry
                                        </button>
                                    </div>
                                ) : messages.length ? (
                                    <div className="mx-auto flex w-full max-w-3xl flex-col">
                                        {messages.map((message, index) => {
                                            const mine = getId(message.senderId) === getId(user);
                                            const previous = messages[index - 1];
                                            const next = messages[index + 1];
                                            const showDate = index === 0 || dayKey(message) !== dayKey(previous);
                                            const firstInGroup =
                                                showDate || getId(previous?.senderId) !== getId(message.senderId);
                                            const lastInGroup =
                                                !next ||
                                                getId(next.senderId) !== getId(message.senderId) ||
                                                dayKey(next) !== dayKey(message);
                                            const iso = message.createdAt ? new Date(message.createdAt).toISOString?.() : undefined;
                                            const sentAt = formatMessageTime(message.createdAt);
                                            return (
                                                <div key={message._id || `${dayKey(message)}-${index}`}>
                                                    {showDate && (
                                                        <div className="my-4 flex justify-center">
                                                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                                                                {getDateLabel(message.createdAt || Date.now())}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`flex ${mine ? 'justify-end' : 'justify-start'} ${
                                                            index === 0 || showDate ? '' : firstInGroup ? 'mt-3' : 'mt-0.5'
                                                        }`}
                                                    >
                                                        <article
                                                            className={`max-w-[85%] rounded-2xl px-3.5 pb-1.5 pt-2.5 shadow-sm sm:max-w-[75%] ${
                                                                mine
                                                                    ? `bg-blue-600 text-white ${lastInGroup ? 'rounded-br-md' : ''}`
                                                                    : `border border-slate-100 bg-white text-slate-800 ${lastInGroup ? 'rounded-bl-md' : ''}`
                                                            }`}
                                                        >
                                                            {renderMessageBody(message, mine)}
                                                            <div
                                                                className={`mt-1 flex items-center justify-end gap-1 text-xs ${
                                                                    mine ? 'text-blue-100' : 'text-slate-400'
                                                                }`}
                                                            >
                                                                {sentAt && (
                                                                    <time dateTime={iso} title={formatFullDateTime(message.createdAt)}>
                                                                        {sentAt}
                                                                    </time>
                                                                )}
                                                                {mine &&
                                                                    (message.isRead ? (
                                                                        <CheckCheck size={15} className="text-sky-200" aria-label="Read" />
                                                                    ) : message.delivered ? (
                                                                        <CheckCheck size={15} aria-label="Delivered" />
                                                                    ) : (
                                                                        <Check size={15} aria-label="Sent" />
                                                                    ))}
                                                            </div>
                                                        </article>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {recipientTyping && (
                                            <div className="mt-3 flex items-center gap-2 self-start rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                                                <span className="flex gap-1" aria-hidden="true">
                                                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                                                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                                                    <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                                                </span>
                                                {getParticipantName(recipient).split(' ')[0]} is typing…
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                                            <MessageCircle size={30} aria-hidden="true" />
                                        </div>
                                        <h3 className="mt-5 text-lg font-semibold text-slate-800">Start the conversation</h3>
                                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                            Send a message to {getParticipantName(recipient)} about your service or booking.
                                        </p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <footer className="shrink-0 border-t border-slate-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
                                {attachmentUrl && (
                                    <div className="mx-auto mb-3 flex max-w-3xl items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-1.5 text-sm text-blue-800">
                                        <span className="flex min-w-0 items-center gap-2">
                                            <FileText size={16} aria-hidden="true" />
                                            <span className="truncate">Attachment link ready</span>
                                        </span>
                                        <button
                                            type="button"
                                            aria-label="Remove attachment"
                                            onClick={() => setAttachmentUrl('')}
                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-blue-100"
                                        >
                                            <X size={16} aria-hidden="true" />
                                        </button>
                                    </div>
                                )}
                                <form onSubmit={sendMessage} className="mx-auto flex max-w-3xl items-end gap-1.5 sm:gap-2">
                                    <div data-emoji-root className="relative shrink-0">
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-14 left-0 z-20 grid w-max grid-cols-6 gap-1 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                                                {EMOJIS.map((emoji) => (
                                                    <button
                                                        type="button"
                                                        key={emoji}
                                                        onClick={() => handleEmoji(emoji)}
                                                        className="flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-colors hover:bg-slate-100"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            aria-label="Choose emoji"
                                            aria-expanded={showEmojiPicker}
                                            onClick={() => setShowEmojiPicker((current) => !current)}
                                            className={`${iconButton} rounded-full`}
                                        >
                                            <Smile size={21} aria-hidden="true" />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Attach a link"
                                        onClick={() => setShowAttachmentDialog(true)}
                                        className={`${iconButton} rounded-full`}
                                    >
                                        <Paperclip size={20} aria-hidden="true" />
                                    </button>
                                    <label htmlFor="message-input" className="sr-only">
                                        Type a message
                                    </label>
                                    <textarea
                                        id="message-input"
                                        ref={textareaRef}
                                        rows={1}
                                        value={draft}
                                        onChange={handleDraftChange}
                                        onKeyDown={handleComposerKeyDown}
                                        onFocus={() => setShowEmojiPicker(false)}
                                        placeholder="Write a message…"
                                        maxLength={2000}
                                        className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-base leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 md:text-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || (!draft.trim() && !attachmentUrl)}
                                        aria-label="Send message"
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:active:scale-100 ${focusRing}`}
                                    >
                                        {sending ? (
                                            <Loader2 size={19} className="animate-spin" aria-hidden="true" />
                                        ) : (
                                            <Send size={19} className="translate-x-0.5" aria-hidden="true" />
                                        )}
                                    </button>
                                </form>
                                <p className="mx-auto mt-2 hidden max-w-3xl items-center justify-center gap-1 text-xs text-slate-400 md:flex">
                                    <Clock3 size={12} aria-hidden="true" /> Enter to send · Shift+Enter for a new line
                                </p>
                            </footer>
                        </>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
                                <MessageCircle size={36} aria-hidden="true" />
                            </div>
                            <h2 className="mt-6 text-xl font-semibold text-slate-800">Select a conversation to start messaging</h2>
                            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                Choose a customer or service provider from your conversation list. Your messages will appear here.
                            </p>
                        </div>
                    )}
                </section>
            </div>

            {/* ================================== Dialogs ================================= */}
            {deleteTarget && (
                <Modal
                    title="Delete this conversation?"
                    description={`Your conversation with ${getParticipantName(getOtherParticipant(deleteTarget))} will be removed from your list. This can't be undone.`}
                    onClose={() => !deleting && setDeleteTarget(null)}
                >
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleting}
                            className={`h-11 rounded-xl border border-slate-200 px-5 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 ${focusRing}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            disabled={deleting}
                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60 ${focusRing}`}
                        >
                            {deleting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                            {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                    </div>
                </Modal>
            )}

            {showAttachmentDialog && (
                <Modal
                    title="Attach a link"
                    description="Share a file or image URL. The chat service stores attachments as links."
                    onClose={() => setShowAttachmentDialog(false)}
                >
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            saveAttachmentLink();
                        }}
                    >
                        <label htmlFor="attachment-url" className="mb-1.5 mt-5 block text-sm font-medium text-slate-700">
                            Attachment URL
                        </label>
                        <input
                            id="attachment-url"
                            type="url"
                            autoFocus
                            value={attachmentDraft}
                            onChange={(event) => setAttachmentDraft(event.target.value)}
                            placeholder="https://…"
                            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:text-sm"
                        />
                        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowAttachmentDialog(false)}
                                className={`h-11 rounded-xl border border-slate-200 px-5 font-semibold text-slate-700 transition-colors hover:bg-slate-50 ${focusRing}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`h-11 rounded-xl bg-blue-600 px-5 font-semibold text-white transition-colors hover:bg-blue-700 ${focusRing}`}
                            >
                                Add attachment
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </main>
    );
};

export default Messages;