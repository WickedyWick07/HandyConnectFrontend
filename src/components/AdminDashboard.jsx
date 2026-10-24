import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import FileThumb from './FileThumb';

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'customers', label: 'Customers' },
    { id: 'providers', label: 'Service Providers' },
    { id: 'jobs', label: 'Active Jobs' },
];

// services are stored as ['["plumbing","tiling"]']
const parseServices = (services) => {
    try {
        const first = Array.isArray(services) ? services[0] : services;
        const parsed = typeof first === 'string' ? JSON.parse(first || '[]') : first;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return Array.isArray(services) ? services : [];
    }
};

const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ') || '—';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function StatCard({ label, value, hint, tone = 'text-gray-900' }) {
    return (
        <div className="bg-white rounded-lg shadow p-5">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${tone}`}>{value ?? '—'}</p>
            {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

function Empty({ text }) {
    return <p className="text-center text-gray-400 py-10 font-medium">{text}</p>;
}

function SearchBox({ value, onChange, placeholder }) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full sm:w-72 border border-gray-300 rounded px-3 py-2 text-sm"
        />
    );
}

export default function AdminDashboard() {
    const { logout } = useContext(AuthContext);

    const [tab, setTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [providers, setProviders] = useState([]);
    const [jobs, setJobs] = useState([]);

    const [search, setSearch] = useState('');
    const [providerFilter, setProviderFilter] = useState('all');
    const [confirmDelete, setConfirmDelete] = useState(null); // { userId, label, kind }
    const [docsFor, setDocsFor] = useState(null); // provider being reviewed
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const [s, c, p, j] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/customers'),
                api.get('/admin/providers'),
                api.get('/admin/active-jobs'),
            ]);
            setStats(s.data);
            setCustomers(c.data.data || []);
            setProviders(p.data.data || []);
            setJobs(j.data.data || []);
        } catch (err) {
            console.error('Admin load failed', err);
            toast.error(err.response?.data?.message || 'Failed to load admin data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Keep the dashboard live when notifications arrive
    useEffect(() => {
        window.addEventListener('notification:new', load);
        return () => window.removeEventListener('notification:new', load);
    }, [load]);

    // Reset the search box when switching tabs
    useEffect(() => { setSearch(''); }, [tab]);

    const toggleVerify = async (provider) => {
        setBusy(true);
        try {
            await api.patch(`/admin/providers/${provider._id}/verify`, { verified: !provider.verified });
            toast.success(provider.verified ? 'Verification removed' : 'Provider verified');
            setDocsFor(null);
            await load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not update verification');
        } finally {
            setBusy(false);
        }
    };

    const doDelete = async () => {
        if (!confirmDelete) return;
        setBusy(true);
        try {
            await api.delete(`/admin/users/${confirmDelete.userId}`);
            toast.success('Profile deleted');
            setConfirmDelete(null);
            await load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not delete profile');
        } finally {
            setBusy(false);
        }
    };

    const q = search.trim().toLowerCase();

    const filteredCustomers = useMemo(
        () => customers.filter((c) =>
            !q || `${fullName(c)} ${c.email} ${c.location || ''}`.toLowerCase().includes(q)),
        [customers, q]
    );

    const filteredProviders = useMemo(
        () => providers.filter((p) => {
            if (providerFilter === 'verified' && !p.verified) return false;
            if (providerFilter === 'unverified' && p.verified) return false;
            return !q || `${p.companyName} ${fullName(p.user)} ${p.user?.email || ''}`.toLowerCase().includes(q);
        }),
        [providers, q, providerFilter]
    );

    const filteredJobs = useMemo(
        () => jobs.filter((j) =>
            !q || `${j.service} ${fullName(j.customer)} ${j.provider?.companyName || ''} ${j.location}`.toLowerCase().includes(q)),
        [jobs, q]
    );

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Top bar */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
                    <div>
                        <h1 className="font-extrabold text-xl">HandyConnect Admin</h1>
                        <p className="text-xs text-gray-500">Manage users, providers and jobs</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <button
                            onClick={() => logout()}
                            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <nav className="max-w-7xl mx-auto flex gap-1 px-4 overflow-x-auto">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 ${
                                tab === t.id
                                    ? 'border-purple-700 text-purple-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {t.label}
                            {t.id === 'providers' && stats?.pendingVerification > 0 && (
                                <span className="ml-2 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5">
                                    {stats.pendingVerification}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </header>

            <main className="max-w-7xl mx-auto p-4">
                {loading ? (
                    <Empty text="Loading..." />
                ) : (
                    <>
                        {/* OVERVIEW */}
                        {tab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="Customers" value={stats?.customers} />
                                    <StatCard label="Service Providers" value={stats?.providers} />
                                    <StatCard
                                        label="Verified Providers"
                                        value={stats?.verifiedProviders}
                                        tone="text-green-700"
                                        hint={`${stats?.pendingVerification ?? 0} awaiting verification`}
                                    />
                                    <StatCard
                                        label="Active Jobs"
                                        value={stats?.activeJobs}
                                        tone="text-purple-700"
                                        hint="Accepted bookings"
                                    />
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="Total Bookings" value={stats?.bookings.total} />
                                    <StatCard label="Pending" value={stats?.bookings.pending} tone="text-yellow-600" />
                                    <StatCard label="Completed" value={stats?.bookings.completed} tone="text-green-700" />
                                    <StatCard label="Declined" value={stats?.bookings.declined} tone="text-red-600" />
                                </div>

                                {stats?.pendingVerification > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                                        <p className="text-sm text-yellow-800">
                                            <b>{stats.pendingVerification}</b> provider
                                            {stats.pendingVerification === 1 ? '' : 's'} waiting to be verified.
                                        </p>
                                        <button
                                            onClick={() => { setTab('providers'); setProviderFilter('unverified'); }}
                                            className="text-sm font-semibold text-yellow-900 underline"
                                        >
                                            Review now
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CUSTOMERS */}
                        {tab === 'customers' && (
                            <section className="bg-white rounded-lg shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b">
                                    <h2 className="font-bold">Customers ({filteredCustomers.length})</h2>
                                    <SearchBox value={search} onChange={setSearch} placeholder="Search name, email or location" />
                                </div>
                                {filteredCustomers.length === 0 ? (
                                    <Empty text="No customers found" />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[700px] text-sm">
                                            <thead className="bg-gray-100 text-xs text-gray-500">
                                                <tr>
                                                    <th className="p-3 text-left">Name</th>
                                                    <th className="p-3 text-left">Email</th>
                                                    <th className="p-3 text-left">Location</th>
                                                    <th className="p-3 text-left">Joined</th>
                                                    <th className="p-3 text-left">Bookings</th>
                                                    <th className="p-3 text-left">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCustomers.map((c) => (
                                                    <tr key={c._id} className="border-t">
                                                        <td className="p-3 font-medium">{fullName(c)}</td>
                                                        <td className="p-3">{c.email}</td>
                                                        <td className="p-3">{c.location?.trim() || '—'}</td>
                                                        <td className="p-3">{fmtDate(c.createdAt)}</td>
                                                        <td className="p-3">{c.bookingCount}</td>
                                                        <td className="p-3">
                                                            <button
                                                                onClick={() => setConfirmDelete({ userId: c._id, label: fullName(c), kind: 'customer' })}
                                                                className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* PROVIDERS */}
                        {tab === 'providers' && (
                            <section className="bg-white rounded-lg shadow">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 border-b">
                                    <h2 className="font-bold">Service Providers ({filteredProviders.length})</h2>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <select
                                            value={providerFilter}
                                            onChange={(e) => setProviderFilter(e.target.value)}
                                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                                        >
                                            <option value="all">All</option>
                                            <option value="unverified">Unverified</option>
                                            <option value="verified">Verified</option>
                                        </select>
                                        <SearchBox value={search} onChange={setSearch} placeholder="Search company, owner or email" />
                                    </div>
                                </div>
                                {filteredProviders.length === 0 ? (
                                    <Empty text="No providers found" />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px] text-sm">
                                            <thead className="bg-gray-100 text-xs text-gray-500">
                                                <tr>
                                                    <th className="p-3 text-left">Company</th>
                                                    <th className="p-3 text-left">Owner</th>
                                                    <th className="p-3 text-left">Services</th>
                                                    <th className="p-3 text-left">Active jobs</th>
                                                    <th className="p-3 text-left">Status</th>
                                                    <th className="p-3 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredProviders.map((p) => {
                                                    const svc = parseServices(p.services);
                                                    return (
                                                        <tr key={p._id} className="border-t align-top">
                                                            <td className="p-3">
                                                                <p className="font-medium">{p.companyName}</p>
                                                                <p className="text-xs text-gray-500">{p.yearsInService} yrs · {p.phoneNumber}</p>
                                                            </td>
                                                            <td className="p-3">
                                                                <p>{fullName(p.user)}</p>
                                                                <p className="text-xs text-gray-500">{p.user?.email || 'User missing'}</p>
                                                            </td>
                                                            <td className="p-3 text-xs">
                                                                {svc.slice(0, 3).join(', ') || '—'}
                                                                {svc.length > 3 && ` +${svc.length - 3}`}
                                                            </td>
                                                            <td className="p-3 font-semibold">{p.activeJobs}</td>
                                                            <td className="p-3">
                                                                {p.verified ? (
                                                                    <span className="text-xs rounded-full bg-green-200 text-green-700 px-3 py-1">Verified</span>
                                                                ) : (
                                                                    <span className="text-xs rounded-full bg-yellow-200 text-yellow-700 px-3 py-1">Unverified</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex flex-wrap gap-2">
                                                                    <button
                                                                        onClick={() => setDocsFor(p)}
                                                                        className="text-xs px-3 py-1 rounded border border-purple-700 text-purple-700 hover:bg-purple-700 hover:text-white"
                                                                    >
                                                                        Review docs
                                                                    </button>
                                                                    <button
                                                                        disabled={busy}
                                                                        onClick={() => toggleVerify(p)}
                                                                        className={`text-xs px-3 py-1 rounded text-white disabled:opacity-50 ${
                                                                            p.verified ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'
                                                                        }`}
                                                                    >
                                                                        {p.verified ? 'Unverify' : 'Verify'}
                                                                    </button>
                                                                    {p.user?._id && (
                                                                        <button
                                                                            onClick={() => setConfirmDelete({ userId: p.user._id, label: p.companyName, kind: 'provider' })}
                                                                            className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* ACTIVE JOBS */}
                        {tab === 'jobs' && (
                            <section className="bg-white rounded-lg shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b">
                                    <h2 className="font-bold">Active Jobs ({filteredJobs.length})</h2>
                                    <SearchBox value={search} onChange={setSearch} placeholder="Search service, customer or provider" />
                                </div>
                                {filteredJobs.length === 0 ? (
                                    <Empty text="No active jobs" />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[800px] text-sm">
                                            <thead className="bg-gray-100 text-xs text-gray-500">
                                                <tr>
                                                    <th className="p-3 text-left">Service</th>
                                                    <th className="p-3 text-left">Customer</th>
                                                    <th className="p-3 text-left">Provider</th>
                                                    <th className="p-3 text-left">Date</th>
                                                    <th className="p-3 text-left">Location</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredJobs.map((j) => (
                                                    <tr key={j._id} className="border-t">
                                                        <td className="p-3 font-medium">{j.service}</td>
                                                        <td className="p-3">{fullName(j.customer)}</td>
                                                        <td className="p-3">{j.provider?.companyName || '—'}</td>
                                                        <td className="p-3">{j.date} {j.time}</td>
                                                        <td className="p-3 text-xs">{j.location}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </main>

            {/* Document review modal */}
            {docsFor && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDocsFor(null)}>
                    <div
                        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <FileThumb
                                    path={docsFor.profilePicture}
                                    alt={docsFor.companyName}
                                    className="w-14 h-14 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="font-bold text-lg">{docsFor.companyName}</h3>
                                    <p className="text-xs text-gray-500">
                                        {fullName(docsFor.user)} · {docsFor.user?.email}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setDocsFor(null)} className="text-gray-400 hover:text-gray-700 text-xl" aria-label="Close">×</button>
                        </div>

                        <p className="text-sm text-gray-600 mt-4">{docsFor.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                            Services: {parseServices(docsFor.services).join(', ') || '—'}
                        </p>

                        <h4 className="font-semibold mt-5 mb-2 text-sm">Certifications</h4>
                        {docsFor.certifications?.length ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {docsFor.certifications.map((cert, i) => (
                                    <FileThumb
                                        key={i}
                                        path={cert}
                                        alt={`Certification ${i + 1}`}
                                        className="object-cover w-full h-60 border rounded"
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No certifications uploaded.</p>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setDocsFor(null)} className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300">
                                Close
                            </button>
                            <button
                                disabled={busy}
                                onClick={() => toggleVerify(docsFor)}
                                className={`px-4 py-2 text-sm rounded text-white disabled:opacity-50 ${
                                    docsFor.verified ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {docsFor.verified ? 'Remove verification' : 'Verify provider'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !busy && setConfirmDelete(null)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-2">Delete {confirmDelete.kind}?</h3>
                        <p className="text-sm text-gray-700">
                            This permanently deletes <b>{confirmDelete.label}</b>
                            {confirmDelete.kind === 'provider' ? ', their provider profile,' : ''} and all of their
                            bookings, conversations and notifications. This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                disabled={busy}
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={busy}
                                onClick={doDelete}
                                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {busy ? 'Deleting...' : 'Delete permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}