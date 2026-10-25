import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import CustomerHeader from './CustomerHeader';
import ProviderHeader from './ProviderHeader';
import AuthContext from '../context/AuthContext';
import SettingsInfo from '../constants/SettingsInfo';
import api from '../utils/api';
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    Eye,
    EyeOff,
    Globe,
    KeyRound,
    Loader2,
    Mail,
    Palette,
    Shield,
    SlidersHorizontal,
    Smartphone,
    Trash2,
    User,
    X,
    XCircle,
} from 'lucide-react';

const DEFAULT_SETTINGS = {
    language: 'en',
    region: 'UTC',
    theme: 'light',
    email_notifications: false,
    push_notifications: false,
};

const SECTIONS = [
    { id: 'general', label: 'General', icon: SlidersHorizontal, hint: 'Language, region and theme' },
    { id: 'profile', label: 'Profile', icon: User, hint: 'Manage your account' },
    { id: 'notifications', label: 'Notifications', icon: Bell, hint: 'Choose how we reach you' },
    { id: 'security', label: 'Security', icon: Shield, hint: 'Password and sign-in' },
];

const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';
const inputClass = `h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-300 ${focusRing}`;

/* -------------------------------------------------------------------------- */
/* Small components                                                            */
/* -------------------------------------------------------------------------- */

const Card = ({ icon: Icon, title, description, children, danger = false }) => (
    <section
        className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-6 ${
            danger ? 'border-red-200' : 'border-slate-100'
        }`}
    >
        <div className="flex items-start gap-3">
            <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}
            >
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <h2 className={`text-base font-semibold ${danger ? 'text-red-700' : 'text-slate-900'}`}>{title}</h2>
                {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
        </div>
        <div className="mt-5">{children}</div>
    </section>
);

// Label on top for mobile, label left / control right from sm up
const Row = ({ icon: Icon, label, htmlFor, children }) => (
    <div className="flex flex-col gap-2 border-t border-slate-100 py-4 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-slate-700">
            {Icon && <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />}
            {label}
        </label>
        <div className="sm:w-64">{children}</div>
    </div>
);

const Switch = ({ checked, onChange, label }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${focusRing} ${
            checked ? 'bg-blue-600' : 'bg-slate-300'
        }`}
    >
        <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);

const ToggleRow = ({ icon: Icon, title, description, checked, onChange }) => (
    <div className="flex items-center justify-between gap-4 border-t border-slate-100 py-4 first:border-t-0 first:pt-0 last:pb-0">
        <div className="flex min-w-0 items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            </div>
        </div>
        <Switch checked={checked} onChange={onChange} label={title} />
    </div>
);

const PasswordField = ({ id, label, value, onChange, autoComplete }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required
                    minLength={id === 'currentPassword' ? undefined : 8}
                    autoComplete={autoComplete}
                    className={`${inputClass} pr-11`}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    className={`absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 ${focusRing}`}
                >
                    {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
            </div>
        </div>
    );
};

const Toast = ({ message, onClose }) => {
    if (!message.text) return null;
    const ok = message.type === 'success';
    const Icon = ok ? CheckCircle2 : XCircle;
    return (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
            <div
                role={ok ? 'status' : 'alert'}
                className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
                    ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
                }`}
            >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{message.text}</span>
                <button type="button" onClick={onClose} aria-label="Dismiss" className={`rounded ${focusRing}`}>
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const Settings = () => {
    const { fetchCurrentUser, logout } = useContext(AuthContext);
    const { LanguageandRegion, Appearance } = SettingsInfo;
    const [user, setUser] = useState(null);
    const [activeSection, setActiveSection] = useState('general');
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const toastTimer = useRef(null);

    const notify = useCallback((text, type) => {
        clearTimeout(toastTimer.current);
        setMessage({ text, type });
        toastTimer.current = setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }, []);

    useEffect(() => () => clearTimeout(toastTimer.current), []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetchCurrentUser();
                setUser(res);
            } catch (error) {
                console.error('Error fetching the user:', error);
                notify('We could not load your account. Please log in again.', 'error');
            }
        };
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchUserSettings = useCallback(async () => {
        try {
            const response = await api.post('/settings/fetch-user-settings', { user });
            if (response.data) setSettings({ ...DEFAULT_SETTINGS, ...response.data });
        } catch (error) {
            console.error('Error fetching user settings:', error);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchUserSettings();
    }, [user, fetchUserSettings]);

    const handleSettingChange = (setting, value) => {
        setSettings((prev) => ({ ...prev, [setting]: value }));
        setHasChanges(true);
    };

    const handlePasswordChange = (field, value) => setPasswordData((prev) => ({ ...prev, [field]: value }));

    const saveSettings = async () => {
        if (!user || !user._id) return;
        setIsSaving(true);
        try {
            await Promise.all([
                api.post('/settings/update-language', { user: user._id, language: settings.language }),
                api.post('/settings/update-region', { user: user._id, region: settings.region }),
                api.post('/settings/update-push-notifications', {
                    user: user._id,
                    email_notification: settings.email_notifications,
                    push_notification: settings.push_notifications,
                }),
            ]);
            notify('Settings saved.', 'success');
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            notify('Could not save your settings. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            notify('New passwords do not match.', 'error');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            notify('Password must be at least 8 characters.', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await api.patch('settings/change-password', {
                user,
                currentPassword: passwordData.currentPassword,
                newConfirmedPassword: passwordData.newPassword,
            });
            notify('Password changed.', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error changing password:', error);
            notify(error.response?.data?.message || 'Could not change your password.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteConfirmation('');
    };

    const deleteAccount = async () => {
        if (deleteConfirmation !== user.email) {
            notify('The email you entered does not match.', 'error');
            return;
        }
        try {
            await api.delete(`/users/${user._id}`);
            notify('Account deleted. Redirecting…', 'success');
            setTimeout(() => {
                logout();
                window.location.href = '/';
            }, 2000);
        } catch (error) {
            console.error('Error deleting account:', error);
            notify(error.response?.data?.message || 'Could not delete your account.', 'error');
        } finally {
            closeDeleteModal();
        }
    };

    const handleCancel = () => {
        fetchUserSettings();
        setHasChanges(false);
    };

    // Close modal with Escape
    useEffect(() => {
        if (!showDeleteModal) return;
        const onKey = (e) => e.key === 'Escape' && closeDeleteModal();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showDeleteModal]);

    const showSaveBar = activeSection === 'general' || activeSection === 'notifications';
    const current = SECTIONS.find((s) => s.id === activeSection);

    return (
        <div className="min-h-screen bg-[#f5f7fb] font-[family-name:Inter,ui-sans-serif,system-ui,sans-serif] text-slate-900">
            {user && user.role === 'customer' ? <CustomerHeader /> : <ProviderHeader />}
            <Toast message={message} onClose={() => setMessage({ text: '', type: '' })} />

            <main className={`mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8 ${showSaveBar ? 'pb-28' : ''}`}>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage your preferences, notifications and account security.</p>
                </div>

                <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
                    {/* Navigation: scrollable pills on mobile, sidebar from md up */}
                    <nav aria-label="Settings sections" className="md:sticky md:top-6 md:w-60 md:shrink-0">
                        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:rounded-2xl md:border md:border-slate-100 md:bg-white md:p-2 md:shadow-sm">
                            {SECTIONS.map(({ id, label, icon: Icon }) => {
                                const active = activeSection === id;
                                return (
                                    <li key={id} className="shrink-0 md:shrink">
                                        <button
                                            type="button"
                                            onClick={() => setActiveSection(id)}
                                            aria-current={active ? 'page' : undefined}
                                            className={`flex h-11 w-full items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-colors duration-200 md:px-3 ${focusRing} ${
                                                active
                                                    ? 'bg-blue-600 text-white shadow-sm md:bg-blue-50 md:text-blue-700 md:shadow-none'
                                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 md:border-transparent'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" aria-hidden="true" />
                                            {label}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <div className="min-w-0 flex-1 space-y-6">
                        <p className="hidden text-sm text-slate-500 md:block">{current.hint}</p>

                        {activeSection === 'general' && (
                            <>
                                <Card icon={Globe} title="Language and region" description="Set how HandyConnect speaks and tells time.">
                                    <Row label="Language" htmlFor="language">
                                        <select
                                            id="language"
                                            name="language"
                                            className={inputClass}
                                            value={settings.language}
                                            onChange={(e) => handleSettingChange('language', e.target.value)}
                                        >
                                            {LanguageandRegion[0].language.map((lang, i) => (
                                                <option value={lang.code} key={i}>
                                                    {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Row>
                                    <Row label="Region" htmlFor="region">
                                        <select
                                            id="region"
                                            name="region"
                                            className={inputClass}
                                            value={settings.region}
                                            onChange={(e) => handleSettingChange('region', e.target.value)}
                                        >
                                            {LanguageandRegion[0].timezones.map((tz, i) => (
                                                <option value={tz.code} key={i}>
                                                    {tz.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Row>
                                </Card>

                                <Card icon={Palette} title="Appearance" description="Pick the look that is easiest on your eyes.">
                                    <Row label="Theme" htmlFor="theme">
                                        <select
                                            id="theme"
                                            name="theme"
                                            className={inputClass}
                                            value={settings.theme}
                                            onChange={(e) => handleSettingChange('theme', e.target.value)}
                                        >
                                            {Appearance[0].theme.map((theme, i) => (
                                                <option value={theme.code} key={i}>
                                                    {theme.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Row>
                                </Card>
                            </>
                        )}

                        {activeSection === 'profile' && (
                            <>
                                {user && (
                                    <Card icon={User} title="Your account" description="The email you use to sign in.">
                                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                                            <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                                            <span className="min-w-0 truncate text-sm font-medium text-slate-700" title={user.email}>
                                                {user.email}
                                            </span>
                                        </div>
                                    </Card>
                                )}
                                <Card
                                    danger
                                    icon={Trash2}
                                    title="Delete account"
                                    description="This is permanent. All your data will be deleted and cannot be recovered."
                                >
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-700 sm:w-auto ${focusRing}`}
                                    >
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                        Delete my account
                                    </button>
                                </Card>
                            </>
                        )}

                        {activeSection === 'notifications' && (
                            <Card icon={Bell} title="Notifications" description="Choose how you want to hear about bookings and updates.">
                                <ToggleRow
                                    icon={Mail}
                                    title="Email notifications"
                                    description="Booking updates and reminders in your inbox."
                                    checked={settings.email_notifications}
                                    onChange={(v) => handleSettingChange('email_notifications', v)}
                                />
                                <ToggleRow
                                    icon={Smartphone}
                                    title="Push notifications"
                                    description="Instant alerts on your device."
                                    checked={settings.push_notifications}
                                    onChange={(v) => handleSettingChange('push_notifications', v)}
                                />
                            </Card>
                        )}

                        {activeSection === 'security' && (
                            <Card icon={KeyRound} title="Change password" description="Use at least 8 characters.">
                                <form onSubmit={changePassword} className="max-w-md space-y-4">
                                    <PasswordField
                                        id="currentPassword"
                                        label="Current password"
                                        autoComplete="current-password"
                                        value={passwordData.currentPassword}
                                        onChange={(v) => handlePasswordChange('currentPassword', v)}
                                    />
                                    <PasswordField
                                        id="newPassword"
                                        label="New password"
                                        autoComplete="new-password"
                                        value={passwordData.newPassword}
                                        onChange={(v) => handlePasswordChange('newPassword', v)}
                                    />
                                    <PasswordField
                                        id="confirmPassword"
                                        label="Confirm new password"
                                        autoComplete="new-password"
                                        value={passwordData.confirmPassword}
                                        onChange={(v) => handlePasswordChange('confirmPassword', v)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 ${focusRing}`}
                                    >
                                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                                        {isSaving ? 'Changing…' : 'Change password'}
                                    </button>
                                </form>
                            </Card>
                        )}
                    </div>
                </div>
            </main>

            {/* Sticky save bar */}
            {showSaveBar && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-6">
                        <p className="hidden text-sm text-slate-500 sm:block" aria-live="polite">
                            {hasChanges ? 'You have unsaved changes.' : 'All changes saved.'}
                        </p>
                        <div className="flex w-full gap-3 sm:w-auto">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={!hasChanges || isSaving}
                                className={`inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent sm:flex-none ${focusRing}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={saveSettings}
                                disabled={!hasChanges || isSaving}
                                className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none sm:flex-none ${focusRing}`}
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                                {isSaving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete account modal */}
            {showDeleteModal && user && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
                    onClick={closeDeleteModal}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-title"
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
                    >
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <h2 id="delete-title" className="text-lg font-semibold text-slate-900">
                                    Delete your account?
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    This cannot be undone. Type your email{' '}
                                    <span className="break-all font-semibold text-slate-900">{user.email}</span> to confirm.
                                </p>
                            </div>
                        </div>
                        <input
                            type="email"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="Enter your email"
                            autoFocus
                            className={`${inputClass} mt-5`}
                        />
                        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className={`inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${focusRing}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={deleteAccount}
                                disabled={deleteConfirmation !== user.email}
                                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                            >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                Delete account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;