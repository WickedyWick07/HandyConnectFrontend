import { toast } from 'react-toastify';

const defaultOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: 'light',
};

const toastByType = {
    success: toast.success,
    error: toast.error,
    warning: toast.warning || toast.warn,
    info: toast.info,
};

/**
 * Shows a toast message in the top-right corner.
 *
 * type: 'success' | 'error' | 'warning' | 'info'
 * message: text to show
 * options: optional react-toastify options for a single toast
 *
 * Example: notify('error', 'Something went wrong');
 */
export const notify = (type, message, options = {}) => {
    const show = toastByType[type] || toast.info;
    return show(message, { ...defaultOptions, ...options });
};

export const notifySuccess = (message, options) => notify('success', message, options);
export const notifyError = (message, options) => notify('error', message, options);
export const notifyWarning = (message, options) => notify('warning', message, options);
export const notifyInfo = (message, options) => notify('info', message, options);

export default notify;