import { useContext, useEffect, useMemo, useState } from 'react';
import AuthContext from '../context/AuthContext';
import Header from './Header';
import CustomerHeader from './CustomerHeader';
import ProviderHeader from './ProviderHeader';

// TODO: replace with your team's real support email
const SUPPORT_EMAIL = 'support@handyconnect.com';

// audience: 'all' | 'customer' | 'provider'
const FAQS = [
    {
        audience: 'customer',
        category: 'Bookings',
        question: 'How do I book a service?',
        answer:
            'Choose a service on your dashboard, pick a provider, then fill in the service type, date, time and address. Click "Book Service" and confirm your booking.',
    },
    {
        audience: 'customer',
        category: 'Bookings',
        question: 'What do Pending, Accepted and Completed mean?',
        answer:
            'Pending means your request is waiting for the provider to respond. Accepted means the provider has agreed to the job. Completed means the job is finished. If a provider cannot take the job, the booking is marked Declined.',
    },
    {
        audience: 'customer',
        category: 'Bookings',
        question: 'Where can I see my past bookings?',
        answer:
            'Open History from the menu to see all your previous bookings, with their date, location and status.',
    },
    {
        audience: 'customer',
        category: 'Reviews',
        question: 'How do I rate and review a provider?',
        answer:
            'Once a booking is Completed, go to your dashboard and click "Rate & Review" on that booking. Choose a star rating, write your review and submit it.',
    },
    {
        audience: 'provider',
        category: 'Bookings',
        question: 'How do I respond to a booking request?',
        answer:
            'New booking requests appear on your dashboard. Open a request to see the details, then accept or decline it.',
    },
    {
        audience: 'provider',
        category: 'Bookings',
        question: 'Where can I see my past jobs?',
        answer:
            'Open History from the menu to see your previous bookings and their status.',
    },
    {
        audience: 'all',
        category: 'Messages',
        question: 'How do I message a customer or provider?',
        answer:
            'Open Messages from the menu and choose a conversation. New messages appear straight away without refreshing the page.',
    },
    {
        audience: 'all',
        category: 'Account',
        question: 'How do I update my account details?',
        answer:
            'Open Settings from the menu to change your profile information.',
    },
    {
        audience: 'all',
        category: 'Account',
        question: 'I cannot log in. What should I do?',
        answer:
            'Check that your email and password are typed correctly. If you are still locked out, contact support using the details below.',
    },
];

const Help = () => {
    const { fetchCurrentUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [search, setSearch] = useState('');
    const [openQuestion, setOpenQuestion] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            // Visitors have no access token. Skip the user lookup entirely,
            // because fetchCurrentUser redirects to /sign-in when it fails.
            if (!localStorage.getItem('access_token')) {
                setUser(null);
                setLoadingUser(false);
                return;
            }

            try {
                const response = await fetchCurrentUser();
                setUser(response || null);
            } catch (err) {
                // Could not load the user: the page still works with general help
                setUser(null);
            } finally {
                setLoadingUser(false);
            }
        };
        loadUser();
    }, []);

    const isCustomer = !!user && user.role === 'customer';
    const isProvider = !!user && user.role !== 'customer';

    const visibleFaqs = useMemo(() => {
        const term = search.trim().toLowerCase();
        return FAQS.filter((faq) => {
            // Signed-in users only see FAQs for their own role (visitors see everything)
            if (isProvider && faq.audience === 'customer') return false;
            if (isCustomer && faq.audience === 'provider') return false;
            if (!term) return true;
            return (
                faq.question.toLowerCase().includes(term) ||
                faq.answer.toLowerCase().includes(term)
            );
        });
    }, [search, isCustomer, isProvider]);

    const categories = [...new Set(visibleFaqs.map((faq) => faq.category))];

    const toggleQuestion = (question) => {
        setOpenQuestion((current) => (current === question ? null : question));
    };

    const renderHeader = () => {
        if (loadingUser) return null;
        if (isCustomer) return <CustomerHeader />;
        if (isProvider) return <ProviderHeader />;
        return <Header />;
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            {renderHeader()}

            <main className="max-w-3xl mx-auto p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Help Centre</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Find answers to common questions or get in touch with our team.
                    </p>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <label htmlFor="help-search" className="sr-only">
                        Search help topics
                    </label>
                    <input
                        id="help-search"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search for help (e.g. booking, review, messages)"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* FAQs */}
                {visibleFaqs.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <p className="text-sm text-gray-600">
                            No help topics match &quot;{search}&quot;. Try a different word, or
                            contact support below.
                        </p>
                    </div>
                ) : (
                    categories.map((category) => (
                        <section key={category} className="bg-white rounded-lg shadow mb-4">
                            <h2 className="font-bold text-md px-4 py-3 border-b">
                                {category}
                            </h2>
                            <div>
                                {visibleFaqs
                                    .filter((faq) => faq.category === category)
                                    .map((faq) => {
                                        const isOpen = openQuestion === faq.question;
                                        return (
                                            <div
                                                key={faq.question}
                                                className="border-b last:border-b-0"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleQuestion(faq.question)}
                                                    aria-expanded={isOpen}
                                                    className="w-full flex justify-between items-center gap-4 text-left px-4 py-3 text-sm font-medium hover:bg-gray-50"
                                                >
                                                    <span>{faq.question}</span>
                                                    <span
                                                        className={`text-gray-400 transition-transform ${
                                                            isOpen ? 'rotate-180' : ''
                                                        }`}
                                                        aria-hidden="true"
                                                    >
                                                        ▾
                                                    </span>
                                                </button>
                                                {isOpen && (
                                                    <p className="px-4 pb-4 text-sm text-gray-600">
                                                        {faq.answer}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </section>
                    ))
                )}

                {/* Contact */}
                <section className="bg-white rounded-lg shadow p-4 mt-6">
                    <h2 className="font-bold text-md mb-1">Still need help?</h2>
                    <p className="text-sm text-gray-600 mb-3">
                        Can&apos;t find what you are looking for? Our team is happy to help.
                    </p>
                    <a
                        href={`mailto:${SUPPORT_EMAIL}?subject=HandyConnect%20Support%20Request`}
                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded transition"
                    >
                        Email support
                    </a>
                    <p className="text-xs text-gray-500 mt-2 break-words">{SUPPORT_EMAIL}</p>
                </section>
            </main>
        </div>
    );
};

export default Help;