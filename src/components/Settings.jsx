import  { useState, useContext, useEffect } from 'react';
import CustomerHeader from './CustomerHeader';
import ProviderHeader from './ProviderHeader';
import AuthContext from '../context/AuthContext';
import SettingsInfo from '../constants/SettingsInfo';
import api from '../utils/api'; // Using the api import instead of axios

const Settings = () => {
    const { fetchCurrentUser, logout } = useContext(AuthContext);
    const { LanguageandRegion, Appearance } = SettingsInfo;
    const [user, setUser] = useState(null);
    const [activeSection, setActiveSection] = useState('general');
    
    // Settings state
    const [settings, setSettings] = useState({
        language: 'en',
        region: 'UTC',
        email_notifications: false,
        push_notifications: false
    });
    
    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword:'',
        newPassword: '',
        confirmPassword: ''
    });

    // Delete account state
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // For tracking if settings have changed
    const [hasChanges, setHasChanges] = useState(false);
    // For loading state during save
    const [isSaving, setIsSaving] = useState(false);
    // For success/error messages
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchUser = async () => {
            const res = await fetchCurrentUser();
            console.log('User:', res);
            setUser(res);  
        };
        
        fetchUser();
    }, []);
    
    const fetchUserSettings = async () => {
         
        try {
            const response = await api.post('/settings/fetch-user-settings',{user});
            if (response.data) {
                console.log(response)
                setSettings(response.data);
            }
        } catch (error) {
            console.error('Error fetching user settings:', error);
        }
    };
    useEffect(() => {
        if(!user) return;


        fetchUserSettings()
    }, [user])


    const handleSettingChange = (setting, value) => {
        setSettings(prev => ({
            ...prev,
            [setting]: value
        }));
        setHasChanges(true);
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const saveSettings = async () => {
        if (!user || !user._id) return;
        
        setIsSaving(true);
        try {
            // Update all settings at once
            await Promise.all([
                api.post('/settings/update-language', { 
                    user: user._id, 
                    language: settings.language 
                }),
                api.post('/settings/update-region', { 
                    user: user._id, 
                    region: settings.region 
                }),
                api.post('/settings/update-push-notifications', { 
                    user: user._id, 
                    email_notification: settings.email_notifications,
                    push_notification: settings.push_notifications
                })
            ]);
            
            setMessage({ text: 'Settings saved successfully!', type: 'success' });
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ text: 'Failed to save settings.', type: 'error' });
        } finally {
            setIsSaving(false);
            // Clear message after 3 seconds
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        
        // Validate passwords
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ text: 'New passwords do not match', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setMessage({ text: 'Password must be at least 8 characters', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            return;
        }

        setIsSaving(true);
        try {
            await api.patch(`settings/change-password`, {
                user,
                currentPassword: passwordData.currentPassword,
                newConfirmedPassword: passwordData.newPassword
            });
            
            setMessage({ text: 'Password changed successfully!', type: 'success' });
            // Clear the form
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage({ 
                text: error.response?.data?.message || 'Failed to change password', 
                type: 'error' 
            });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    const deleteAccount = async () => {
        if (deleteConfirmation !== user.email) {
            setMessage({ text: 'Email confirmation does not match', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            return;
        }

        try {
            
            await api.delete(`/users/${user._id}`);
            setMessage({ text: 'Account deleted successfully. Redirecting...', type: 'success' });
            
            // Log out and redirect after a short delay
            setTimeout(() => {
                logout();
                window.location.href = '/';
            }, 2000);
        } catch (error) {
            console.error('Error deleting account:', error);
            setMessage({ 
                text: error.response?.data?.message || 'Failed to delete account', 
                type: 'error' 
            });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } finally {
            setShowDeleteModal(false);
            setDeleteConfirmation('');
        }
    };

    const handleCancel = () => {
        // Reset to last saved settings
        fetchUserSettings(user._id);
        setHasChanges(false);
    };

    // Navigation sections
    const sections = [
        { id: 'general', label: 'General' },
        { id: 'profile', label: 'Profile' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'security', label: 'Security' }
    ];

    return (
        <div className='bg-gray-100 min-h-screen'>
            {user && user.role === 'customer' ? <CustomerHeader /> : <ProviderHeader />}
            <main>
                <div>
                    <ul className='flex gap-4 p-4 justify-evenly'>
                        {sections.map(section => (
                            <li 
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`text-xs font-medium cursor-pointer ${
                                    activeSection === section.id 
                                        ? 'text-blue-600 border-b-2 border-blue-600' 
                                        : 'text-gray-400'
                                }`}
                            >
                                {section.label}
                            </li>
                        ))}
                    </ul>
                    <hr />
                </div>
                
                {/* Message display */}
                {message.text && (
                    <div className={`mx-20 my-2 p-2 rounded text-center ${
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message.text}
                    </div>
                )}
                
                {/* General Section */}
                {activeSection === 'general' && (
                    <section className='bg-white p-4 mx-20 m-2 rounded-lg shadow-md'>
                        <h1 className='text-lg font-semibold text-center'>Language and Region</h1>
                        <div className='mx-40 rounded'>
                            <div className='flex justify-between items-center gap-2'>
                                <h1 className='text-md font-medium'>Language</h1>
                                <select 
                                    name="language" 
                                    className='border p-2 rounded text-sm' 
                                    id="language"
                                    value={settings.language}
                                    onChange={(e) => handleSettingChange('language', e.target.value)}
                                >
                                    {LanguageandRegion[0].language.map((lang, i) => (
                                        <option className='p-2 text-sm' value={lang.code} key={i}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex justify-between items-center mt-4 gap-2'>
                                <h1 className='text-md font-medium'>Region</h1>
                                <select 
                                    name="region" 
                                    className='border p-2 rounded text-sm' 
                                    id="region"
                                    value={settings.region}
                                    onChange={(e) => handleSettingChange('region', e.target.value)}
                                >
                                    {LanguageandRegion[0].timezones.map((tz, i) => (
                                        <option className='p-2 text-sm' value={tz.code} key={i}>
                                            {tz.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                  
                        <h1 className='text-lg font-semibold text-center mt-3'>Appearance</h1>
                        <div className='mx-40 rounded'>
                            <div className='flex justify-between items-center mt-4 gap-2'>
                                <h1 className='text-md font-medium'>Theme</h1>
                                <select 
                                    name="theme" 
                                    className='border p-2 rounded text-sm' 
                                    id="theme"
                                    value={settings.theme}
                                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                                >
                                    {Appearance[0].theme.map((theme, i) => (
                                        <option className='p-2 text-sm' value={theme.code} key={i}>
                                            {theme.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>
                )}
                
                {/* Profile Section - Delete Account */}
                {activeSection === 'profile' && (
                    <section className='bg-white p-4 mx-20 m-2 rounded-lg shadow-md'>
                        <h1 className='text-lg font-semibold text-center'>Profile Settings</h1>
                        <div className='mx-auto max-w-md mt-6 p-4 border border-red-200 rounded-md'>
                            <h2 className='text-red-600 font-semibold'>Delete Account</h2>
                            <p className='text-sm text-gray-600 mt-2'>
                                This action is irreversible. All your data will be permanently deleted.
                            </p>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className='mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700'
                            >
                                Delete My Account
                            </button>
                        </div>

                        {/* Delete Account Modal */}
                        {showDeleteModal && (
                            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                                <div className='bg-white p-6 rounded-lg max-w-md w-full'>
                                    <h2 className='text-xl font-bold text-red-600'>Confirm Account Deletion</h2>
                                    <p className='my-4 text-gray-700'>
                                        This action cannot be undone. Please type your email 
                                        <span className='font-semibold'> {user.email} </span> 
                                        to confirm.
                                    </p>
                                    <input
                                        type='text'
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder='Enter your email'
                                        className='w-full p-2 border border-gray-300 rounded mb-4'
                                    />
                                    <div className='flex justify-end gap-3'>
                                        <button
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                setDeleteConfirmation('');
                                            }}
                                            className='px-4 py-2 bg-gray-200 rounded'
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={deleteAccount}
                                            className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
                                        >
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}
                
                {/* Notifications Section */}
                {activeSection === 'notifications' && (
                    <section className='bg-white p-4 mx-20 m-2 rounded-lg shadow-md'>
                        <h1 className='text-lg font-semibold text-center'>Notifications</h1>
                        <div className='mx-40 rounded'>
                            <div className='flex flex-col gap-2'>
                                <div className='flex justify-between items-center p-2 mt-4 gap-2'>
                                    <p className='text-md font-medium'>Email Notifications</p>
                                    <button 
                                        onClick={() => handleSettingChange('email_notifications', !settings.email_notifications)} 
                                        className={`w-12 h-6 flex items-center rounded-full p-1 ${settings.email_notifications ? 'bg-green-400' : 'bg-gray-300'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform ${settings.email_notifications ? 'translate-x-6' : ''}`}></div>
                                    </button>
                                </div>
                                <div className='flex justify-between items-center mt-4 gap-2'>
                                    <p className='text-md font-medium'>Push Notifications</p>
                                    <button 
                                        onClick={() => handleSettingChange('push_notifications', !settings.push_notifications)} 
                                        className={`w-12 h-6 flex items-center rounded-full p-1 ${settings.push_notifications ? 'bg-green-400' : 'bg-gray-300'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform ${settings.push_notifications ? 'translate-x-6' : ''}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
                
                {/* Security Section - Change Password */}
                {activeSection === 'security' && (
                    <section className='bg-white p-4 mx-20 m-2 rounded-lg shadow-md'>
                        <h1 className='text-lg font-semibold text-center'>Security Settings</h1>
                        <div className='mx-auto max-w-md mt-6'>
                            <h2 className='text-md font-semibold'>Change Password</h2>
                            <form onSubmit={changePassword} className='mt-4 space-y-4'>
                                <div>
                                    <label htmlFor='currentPassword' className='block text-sm font-medium text-gray-700'>
                                        Current Password
                                    </label>
                                    <input
                                        type='password'
                                        id='currentPassword'
                                        value={passwordData.currentPassword}
                                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                        required
                                        className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2'
                                    />
                                </div>
                                <div>
                                    <label htmlFor='newPassword' className='block text-sm font-medium text-gray-700'>
                                        New Password
                                    </label>
                                    <input
                                        type='password'
                                        id='newPassword'
                                        value={passwordData.newPassword}
                                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                        required
                                        minLength={8}
                                        className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2'
                                    />
                                </div>
                                <div>
                                    <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700'>
                                        Confirm New Password
                                    </label>
                                    <input
                                        type='password'
                                        id='confirmPassword'
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                        required
                                        minLength={8}
                                        className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2'
                                    />
                                </div>
                                <div>
                                    <button
                                        type='submit'
                                        disabled={isSaving}
                                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                            ${isSaving ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {isSaving ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                )}
                
                {/* Action buttons - Only show for General and Notifications sections */}
                {(activeSection === 'general' || activeSection === 'notifications') && (
                    <div className='flex gap-2 p-4 mx-20 justify-end'>
                        <button 
                            onClick={handleCancel}
                            disabled={!hasChanges || isSaving}
                            className={`border text-black p-2 rounded text-xs font-medium ${
                                hasChanges ? 'bg-gray-200 border-gray-700' : 'bg-gray-100 border-gray-400 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={saveSettings}
                            disabled={!hasChanges || isSaving}
                            className={`p-2 rounded text-xs font-medium ${
                                hasChanges && !isSaving 
                                    ? 'bg-black text-white' 
                                    : 'bg-gray-400 text-gray-100 cursor-not-allowed'
                            }`}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Settings;