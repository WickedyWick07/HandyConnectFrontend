import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import LoadingPage from './LoadingPage';

// Only lets admins through. The real protection is on the server;
// this just keeps everyone else from seeing an empty admin page.
export default function AdminRoute({ children }) {
    const { fetchCurrentUser } = useContext(AuthContext);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        if (!localStorage.getItem('access_token')) {
            setStatus('login');
            return;
        }
        fetchCurrentUser()
            .then((u) => setStatus(u?.role === 'admin' ? 'ok' : 'denied'))
            .catch(() => setStatus('login'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (status === 'loading') return <LoadingPage />;
    if (status === 'login') return <Navigate to="/login" replace />;
    if (status === 'denied') return <Navigate to="/" replace />;
    return children;
}