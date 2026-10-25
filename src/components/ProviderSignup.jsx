import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Armchair, Award, Briefcase, Building2, Calendar, Check, Cpu, Droplets, FileText, FileUp, Hammer, Image as ImageIcon, Layers, Loader2, Mail, PaintRoller, Phone, ShieldCheck, Trees, User, Wrench, X, Zap, } from 'lucide-react';
import api from '../utils/api';

/* -------------------------------------------------------------------------- */
/* Small UI helpers (kept in this file: no extra files or packages needed)     */
/* -------------------------------------------------------------------------- */

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Input = ({ className = '', type = 'text', ...props }) => (
    <input
        type={type}
        className={`block w-full rounded-md border border-gray-300 bg-white pr-3 text-base text-gray-900 transition-shadow placeholder:text-gray-400 read-only:bg-gray-50 read-only:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500 md:text-sm ${className}`}
        {...props}
    />
);

const Textarea = ({ className = '', ...props }) => (
    <textarea
        className={`block w-full rounded-md border border-gray-300 bg-white pb-2 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
        {...props}
    />
);

const BUTTON_VARIANTS = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
};

const Button = ({ variant = 'primary', className = '', type = 'button', ...props }) => (
    <button
        type={type}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
        {...props}
    />
);

// Accessible checkbox (role="checkbox"); a <label htmlFor> toggles it too
const Checkbox = ({ checked = false, onCheckedChange, className = '', ...props }) => (
    <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        onClick={() => onCheckedChange?.(!checked)}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-gray-400 bg-white text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 ${className}`}
        {...props}
    >
        {checked && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
    </button>
);
// Values are sent to the backend, so they are unchanged from the original form.
const SERVICES = [
    { value: 'exterior maintenance', icon: Trees },
    { value: 'home security', icon: ShieldCheck },
    { value: 'flooring', icon: Layers },
    { value: 'plumbing', icon: Droplets },
    { value: 'electrical', icon: Zap },
    { value: 'carpentry', icon: Hammer },
    { value: 'painting', icon: PaintRoller },
    { value: 'interior design', icon: Armchair },
    { value: 'home automation', icon: Cpu },
    { value: 'home installation', icon: Wrench },
];
const STEPS = [
    { id: 'section-personal', label: 'Personal' },
    { id: 'section-company', label: 'Company' },
    { id: 'section-services', label: 'Services' },
];
const PHONE_REGEX = /^\d{9,10}$/;
// These match the backend upload rules in middleware/upload.js (PDF, JPEG, PNG, 5 MB each)
const PROFILE_MAX_MB = 5;
const CERT_MAX_MB = 5;
const CERT_MAX_FILES = 5;
const PROFILE_ACCEPT = 'image/jpeg,image/png';
const CERT_ACCEPT = 'application/pdf,image/jpeg,image/png';
// Element ids used to focus the first invalid field
const FIELD_IDS = {
    phoneNumber: 'phone',
    companyName: 'companyName',
    yearsInService: 'yearsInService',
    profilePicture: 'profile_picture',
    certifications: 'certifications',
    services: `${SERVICES[0].value}-0`,
};
/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
const fetchCurrentUser = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        throw new Error('No access token available');
    }
    const response = await api.get('/auth/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data.user;
};
const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }
    catch {
        return null;
    }
};
const formatSize = (bytes) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
const inputClass = () => 'h-11 pl-10';
/* -------------------------------------------------------------------------- */
/* Small building blocks                                                       */
/* -------------------------------------------------------------------------- */
const StepIndicator = ({ done, current }) => (<nav aria-label="Registration progress">
        <ol className="flex w-full items-center">
            {STEPS.map((step, i) => {
        const isDone = done[i];
        const isCurrent = i === current;
        const isLast = i === STEPS.length - 1;
        return (<li key={step.id} className={cn('flex items-center', !isLast && 'flex-1')}>
                        <a href={`#${step.id}`} onClick={(e) => {
                e.preventDefault();
                scrollToId(step.id);
            }} aria-current={isCurrent ? 'step' : undefined} className="group flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors duration-300', isDone && 'border-blue-600 bg-blue-600 text-white', !isDone && isCurrent && 'border-blue-600 bg-white text-blue-600', !isDone && !isCurrent && 'border-gray-300 bg-white text-gray-400')}>
                                {isDone ? <Check className="h-4 w-4" aria-hidden="true"/> : i + 1}
                            </span>
                            <span className={cn('flex-col text-left', isCurrent ? 'flex' : 'hidden sm:flex')}>
                                <span className="hidden text-[11px] font-medium uppercase tracking-wide text-gray-400 sm:block">
                                    Step {i + 1}
                                </span>
                                <span className={cn('text-sm font-medium', isCurrent || isDone ? 'text-gray-900' : 'text-gray-500')}>
                                    {step.label}
                                </span>
                            </span>
                        </a>
                        {!isLast && (<span aria-hidden="true" className={cn('mx-3 h-px flex-1 transition-colors duration-300 sm:mx-4', isDone ? 'bg-blue-600' : 'bg-gray-200')}/>)}
                    </li>);
    })}
        </ol>
    </nav>);
const SectionHeader = ({ icon: Icon, title, description, }) => (<div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-5 w-5" aria-hidden="true"/>
        </span>
        <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    </div>);
const Field = ({ id, label, icon: Icon, error, hint, required, iconTop, children }) => (<div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && (<span className="ml-0.5 text-red-500" aria-hidden="true">
                    *
                </span>)}
        </label>
        <div className="relative">
            <Icon className={cn('pointer-events-none absolute left-3 h-4 w-4 text-gray-400', iconTop ? 'top-3' : 'top-1/2 -translate-y-1/2')} aria-hidden="true"/>
            {children}
        </div>
        {error ? (<p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/>
                {error}
            </p>) : hint ? (<p id={`${id}-hint`} className="text-xs text-gray-500">
                {hint}
            </p>) : null}
    </div>);
const FileDropzone = ({ id, name, label, icon: Icon, accept, hint, maxSizeMB, files, onChange, multiple = false, maxFiles = 1, round = false, }) => {
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState('');
    const [urls, setUrls] = useState([]);
    // Object URLs are created in an effect so previews survive React StrictMode's double-mount
    useEffect(() => {
        const created = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null));
        setUrls(created);
        return () => created.forEach((u) => u && URL.revokeObjectURL(u));
    }, [files]);
    const acceptList = accept.split(',').map((a) => a.trim().toLowerCase());
    const isAccepted = (f) => acceptList.some((a) => a.endsWith('/*')
        ? f.type.toLowerCase().startsWith(a.slice(0, -1))
        : a.startsWith('.')
            ? f.name.toLowerCase().endsWith(a)
            : f.type.toLowerCase() === a);
    const addFiles = (incoming) => {
        if (incoming.length === 0)
            return;
        const problems = [];
        const ok = [];
        for (const f of incoming) {
            if (!isAccepted(f))
                problems.push(`${f.name} is not a supported file type`);
            else if (f.size > maxSizeMB * 1024 * 1024)
                problems.push(`${f.name} is larger than ${maxSizeMB} MB`);
            else
                ok.push(f);
        }
        let next = files;
        if (multiple) {
            const fresh = ok.filter((n) => !files.some((f) => f.name === n.name && f.size === n.size));
            next = [...files, ...fresh];
            if (next.length > maxFiles) {
                problems.push(`You can upload up to ${maxFiles} files`);
                next = next.slice(0, maxFiles);
            }
        }
        else if (ok.length > 0) {
            next = ok.slice(0, 1);
        }
        setError(problems.join('. '));
        onChange(next);
    };
    const handleInput = (e) => {
        addFiles(Array.from(e.target.files ?? []));
        e.target.value = ''; // allow picking the same file again after removing it
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };
    const remove = (index) => {
        setError('');
        onChange(files.filter((_, i) => i !== index));
    };
    return (<div>
            <label htmlFor={id} onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
        }} onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
                setDragging(false);
        }} onDrop={handleDrop} className={cn('flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2', dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50')}>
                <input id={id} name={name} type="file" accept={accept} multiple={multiple} onChange={handleInput} className="sr-only"/>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" aria-hidden="true"/>
                </span>
                <span className="text-sm font-medium text-gray-900">
                    <span className="sr-only">{label}: </span>
                    <span className="text-blue-600">Click to upload</span> or drag and drop
                </span>
                <span className="text-xs text-gray-500">{hint}</span>
            </label>

            {error && (<p role="alert" className="mt-2 flex items-start gap-1 text-xs text-red-600">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true"/>
                    {error}
                </p>)}

            {files.length > 0 && (<ul className="mt-3 space-y-2">
                    {files.map((f, i) => {
                const url = urls.length === files.length ? urls[i] : null;
                const size = round ? 'h-14 w-14' : 'h-12 w-12';
                return (<li key={`${f.name}-${f.size}-${i}`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
                                {url ? (<img src={url} alt="" className={cn('shrink-0 object-cover', size, round ? 'rounded-full' : 'rounded-lg')}/>) : (<span className={cn('flex shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500', size)}>
                                        <FileText className="h-5 w-5" aria-hidden="true"/>
                                    </span>)}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900" title={f.name}>
                                        {f.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{formatSize(f.size)}</p>
                                </div>
                                <Button type="button" variant="ghost" onClick={() => remove(i)} aria-label={`Remove ${f.name}`} className="h-8 w-8 shrink-0 text-gray-500 hover:text-red-600">
                                    <X className="h-4 w-4" aria-hidden="true"/>
                                </Button>
                            </li>);
            })}
                </ul>)}
        </div>);
};
/* -------------------------------------------------------------------------- */
/* Selectable service card                                                     */
/* -------------------------------------------------------------------------- */
const ServiceCard = ({ id, value, icon: Icon, selected, onToggle, }) => (<label htmlFor={id} className={cn('relative flex cursor-pointer flex-col items-start gap-3 rounded-xl border p-4 text-left font-medium leading-normal transition-all duration-200 hover:shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2', selected ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600' : 'border-gray-200 bg-white hover:border-gray-300')}>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200', selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}>
            <Icon className="h-5 w-5" aria-hidden="true"/>
        </span>
        <span className="text-sm capitalize text-gray-900">{value}</span>
        <Checkbox id={id} name="services" value={value} checked={selected} onCheckedChange={onToggle} className="absolute right-3 top-3"/>
    </label>);
/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */
const ProviderSignup = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [description, setDescription] = useState('');
    const [yearsInService, setYearsInService] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [certifications, setCertifications] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');
    /* ---- Load the signed-in user (same logic as before) ----------------- */
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            const stored = readStoredUser();
            if (stored && !cancelled)
                setUser(stored);
            try {
                const current = await fetchCurrentUser();
                if (!cancelled)
                    setUser(current);
            }
            catch (error) {
                console.error('Failed to load current user:', error);
                if (!cancelled)
                    setUser(stored);
            }
            finally {
                if (!cancelled)
                    setUserLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);
    /* ---- Validation ----------------------------------------------------- */
    const errors = useMemo(() => {
        const e = {};
        if (!phoneNumber)
            e.phoneNumber = 'Phone number is required';
        else if (!PHONE_REGEX.test(phoneNumber))
            e.phoneNumber = 'Enter a valid phone number (9 to 10 digits)';
        if (!companyName.trim())
            e.companyName = 'Company name is required';
        if (yearsInService === '')
            e.yearsInService = 'Years in service is required';
        else {
            const n = Number(yearsInService);
            if (!Number.isInteger(n) || n < 0 || n > 80)
                e.yearsInService = 'Enter a whole number between 0 and 80';
        }
        if (!profilePicture)
            e.profilePicture = 'A profile picture is required';
        if (certifications.length === 0)
            e.certifications = 'Upload at least one certification';
        if (selectedServices.length === 0)
            e.services = 'Select at least one service';
        return e;
    }, [phoneNumber, companyName, yearsInService, profilePicture, certifications, selectedServices]);
    const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));
    const showError = (field) => (touched[field] || submitted ? errors[field] : undefined);
    const stepDone = [
        Boolean(user) && !errors.phoneNumber,
        !errors.companyName && !errors.yearsInService && !errors.profilePicture && !errors.certifications,
        !errors.services,
    ];
    const firstIncomplete = stepDone.findIndex((d) => !d);
    const currentStep = firstIncomplete === -1 ? STEPS.length - 1 : firstIncomplete;
    /* ---- Handlers ------------------------------------------------------- */
    const toggleService = (service) => {
        touch('services');
        setSelectedServices((prev) => prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]);
    };
    const blockNonInteger = (e) => {
        if (['e', 'E', '+', '-', '.'].includes(e.key))
            e.preventDefault();
    };
    const focusField = (field) => {
        const el = document.getElementById(FIELD_IDS[field]);
        if (!el)
            return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        const userId = user?._id || user?.id;
        if (!user || !userId) {
            setFormError('Unable to load your account information. Please log in again.');
            return;
        }
        setSubmitted(true);
        const firstInvalid = ['phoneNumber', 'companyName', 'yearsInService', 'profilePicture', 'certifications', 'services'].find((f) => errors[f]);
        if (firstInvalid) {
            focusField(firstInvalid);
            return;
        }
        setLoading(true);
        // Same field names as before, so the backend needs no changes
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('firstName', user.firstName);
        formData.append('lastName', user.lastName);
        formData.append('email', user.email);
        formData.append('phoneNumber', phoneNumber);
        formData.append('companyName', companyName);
        formData.append('description', description);
        formData.append('yearsInService', yearsInService);
        if (profilePicture) {
            formData.append('profile_picture', profilePicture);
        }
        certifications.forEach((file) => {
            formData.append('certifications', file); // same key for every file
        });
        formData.append('services', JSON.stringify(selectedServices));
        try {
            const response = await api.post('auth/complete-provider-signup', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.status >= 200 && response.status < 300) {
                navigate('/dashboard/service-provider');
            }
        }
        catch (error) {
            console.error('An error occurred during the application', error);
            const serverMessage = error?.response?.data?.message;
            setFormError(serverMessage && serverMessage !== 'Internal Server Error'
                ? serverMessage
                : 'The server could not save your application. Check that your files are JPG, PNG or PDF and 5 MB or smaller, then try again.');
        }
        finally {
            setLoading(false);
        }
    };
    /* ---- Render --------------------------------------------------------- */
    const phoneError = showError('phoneNumber');
    const companyError = showError('companyName');
    const yearsError = showError('yearsInService');
    const servicesError = showError('services');
    const profileError = showError('profilePicture');
    const certError = showError('certifications');
    return (<div className="min-h-screen w-full overflow-x-clip bg-gray-50 font-[family-name:Inter,ui-sans-serif,system-ui,sans-serif] text-gray-900 antialiased">
            <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-8 md:pt-12">
                <header className="mb-6 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Service Provider Registration</h1>
                    <p className="mt-2 text-sm text-gray-500 md:text-base">
                        Complete your profile to join our network of service providers.
                    </p>
                </header>

                <div className="sticky top-0 z-20 -mx-4 mb-4 bg-gray-50/80 px-4 py-3 backdrop-blur">
                    <StepIndicator done={stepDone} current={currentStep}/>
                </div>

                <form onSubmit={handleSubmit} noValidate autoComplete="on">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div>
                            {/* ---------------- Step 1: Personal ---------------- */}
                            <section id="section-personal" className="scroll-mt-24 p-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 md:p-8">
                                <SectionHeader icon={User} title="Personal Information" description="Your account details. Only your phone number needs filling in."/>

                                {!userLoading && !user && (<div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/>
                                        We could not load your account details. Please log in again.
                                    </div>)}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field id="firstName" label="First name" icon={User}>
                                        <Input id="firstName" name="firstName" type="text" autoComplete="given-name" readOnly value={user?.firstName ?? ''} placeholder={userLoading ? 'Loading...' : ''} className={inputClass()}/>
                                    </Field>
                                    <Field id="lastName" label="Last name" icon={User}>
                                        <Input id="lastName" name="lastName" type="text" autoComplete="family-name" readOnly value={user?.lastName ?? ''} placeholder={userLoading ? 'Loading...' : ''} className={inputClass()}/>
                                    </Field>
                                    <Field id="phone" label="Phone" icon={Phone} required error={phoneError}>
                                        <Input id="phone" name="phoneNumber" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} required placeholder="e.g. 0821234567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} onBlur={() => touch('phoneNumber')} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? 'phone-error' : undefined} className={inputClass(Boolean(phoneError))}/>
                                    </Field>
                                    <Field id="email" label="Email" icon={Mail}>
                                        <Input id="email" name="email" type="email" autoComplete="email" readOnly value={user?.email ?? ''} placeholder={userLoading ? 'Loading...' : ''} className={inputClass()}/>
                                    </Field>
                                </div>
                            </section>

                            <div className="border-t border-gray-100"/>

                            {/* ---------------- Step 2: Company ---------------- */}
                            <section id="section-company" className="scroll-mt-24 p-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 md:p-8">
                                <SectionHeader icon={Building2} title="Company Information" description="Tell customers who you are and how long you have been working."/>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field id="companyName" label="Company name" icon={Building2} required error={companyError}>
                                        <Input id="companyName" name="companyName" type="text" autoComplete="organization" placeholder="e.g. Zek's Plumbing Co" value={companyName} onChange={(e) => setCompanyName(e.target.value)} onBlur={() => touch('companyName')} aria-invalid={Boolean(companyError)} aria-describedby={companyError ? 'companyName-error' : undefined} className={inputClass(Boolean(companyError))}/>
                                    </Field>
                                    <Field id="yearsInService" label="Years in service" icon={Calendar} required error={yearsError}>
                                        <Input id="yearsInService" name="yearsInService" type="number" inputMode="numeric" min={0} max={80} autoComplete="off" placeholder="e.g. 6" value={yearsInService} onChange={(e) => setYearsInService(e.target.value)} onKeyDown={blockNonInteger} onBlur={() => touch('yearsInService')} aria-invalid={Boolean(yearsError)} aria-describedby={yearsError ? 'yearsInService-error' : undefined} className={inputClass(Boolean(yearsError))}/>
                                    </Field>
                                </div>

                                <div className="mt-4">
                                    <Field id="description" label="Description" icon={FileText} iconTop hint={`${description.length} characters`}>
                                        <Textarea id="description" name="description" autoComplete="off" placeholder="Tell customers about your business, your experience and what makes you stand out." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px] resize-y pl-10 pt-2.5"/>
                                    </Field>
                                </div>

                                <div className="mt-8 grid gap-8 md:grid-cols-2">
                                    <div>
                                        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <ImageIcon className="h-4 w-4 text-blue-600" aria-hidden="true"/>
                                            Profile picture
                                        </h3>
                                        <p className="mb-3 text-xs text-gray-500">Shown on your provider card. Required.</p>
                                        <FileDropzone id="profile_picture" name="profile_picture" label="Profile picture" icon={ImageIcon} accept={PROFILE_ACCEPT} hint={`JPG or PNG, up to ${PROFILE_MAX_MB} MB`} maxSizeMB={PROFILE_MAX_MB} files={profilePicture ? [profilePicture] : []} onChange={(files) => setProfilePicture(files[0] ?? null)} round/>
                                        {profileError && (<p role="alert" className="mt-2 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/>{profileError}</p>)}
                                    </div>
                                    <div>
                                        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <Award className="h-4 w-4 text-blue-600" aria-hidden="true"/>
                                            Professional certifications
                                        </h3>
                                        <p className="mb-3 text-xs text-gray-500">Trade license or certificates. Required.</p>
                                        <FileDropzone id="certifications" name="certifications" label="Professional certifications" icon={FileUp} accept={CERT_ACCEPT} hint={`PDF, JPG or PNG, up to ${CERT_MAX_MB} MB each (max ${CERT_MAX_FILES})`} maxSizeMB={CERT_MAX_MB} maxFiles={CERT_MAX_FILES} multiple files={certifications} onChange={setCertifications}/>
                                        {certError && (<p role="alert" className="mt-2 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/>{certError}</p>)}
                                    </div>
                                </div>
                            </section>

                            <div className="border-t border-gray-100"/>

                            {/* ---------------- Step 3: Services ---------------- */}
                            <section id="section-services" className="scroll-mt-24 p-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 md:p-8">
                                <SectionHeader icon={Briefcase} title="Service Information" description="Choose every service category you offer."/>

                                <div role="group" aria-label="Service categories" className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {SERVICES.map(({ value, icon }, index) => {
            const serviceId = `${value}-${index}`;
            return (<ServiceCard key={serviceId} id={serviceId} value={value} icon={icon} selected={selectedServices.includes(value)} onToggle={() => toggleService(value)}/>);
        })}
                                </div>

                                <div className="mt-3 flex min-h-5 items-center justify-between gap-3 text-sm">
                                    {servicesError ? (<p role="alert" className="flex items-center gap-1 text-xs text-red-600">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/>
                                            {servicesError}
                                        </p>) : (<span />)}
                                    <p className="text-xs font-medium text-gray-500" aria-live="polite">
                                        {selectedServices.length} selected
                                    </p>
                                </div>
                            </section>

                            {formError && (<div role="alert" className="mx-6 mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:mx-8">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/>
                                    {formError}
                                </div>)}
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
                            <p className="hidden text-xs text-gray-500 sm:block">
                                <span className="text-red-500">*</span> Required fields
                            </p>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading} className="h-11 w-full px-5 sm:w-auto">
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" disabled={loading} aria-busy={loading} className="h-11 w-full px-5 sm:w-auto sm:min-w-40">
                                    {loading ? (<>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true"/>
                                            Submitting...
                                        </>) : ('Submit Application')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {loading && (<p role="status" className="sr-only">
                            Processing your application
                        </p>)}
                </form>
            </div>
        </div>);
};
export default ProviderSignup;