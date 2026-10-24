import './Schedule.css';
import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

const Schedule = () => {
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const { fetchCurrentUser } = useContext(AuthContext);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const calendarRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            const calendarApi = calendarRef.current?.getApi();
            if (calendarApi) {
                calendarApi.changeView(mobile ? 'listWeek' : 'dayGridMonth');
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetchCurrentUser();
                setUser(res);
            } catch (error) {
                console.error('Error fetching user', error.stack);
            }
        };
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getBookings = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.post('/fetch-provider-bookings', { user });

            const formattedEvents = (res.data.bookings || [])
                .filter((booking) => booking.status !== 'declined')
                .map((booking) => ({
                    id: booking._id,
                    title: booking.service,
                    start: booking.date,
                    end: booking.date,
                    extendedProps: { description: booking.problem_description },
                }));

            setEvents(formattedEvents);
        } catch (error) {
            if (error.response?.status === 404) {
                setEvents([]);
            } else {
                console.error('There was an error fetching bookings', error);
            }
        }
    }, [user]);

    useEffect(() => {
        getBookings();
    }, [getBookings]);

    // Refetch whenever a live notification arrives
    useEffect(() => {
        window.addEventListener('notification:new', getBookings);
        return () => window.removeEventListener('notification:new', getBookings);
    }, [getBookings]);

    return (
        <div>
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
                headerToolbar={
                    isMobile
                        ? { left: 'prev,next today', center: 'title', right: '' }
                        : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }
                }
                titleFormat={isMobile ? { month: 'short', day: 'numeric' } : { month: 'long', year: 'numeric' }}
                events={events}
                contentHeight="auto"
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                eventClick={(info) => {
                    alert(
                        `Event: ${info.event.title}\nDate: ${info.event.start?.toLocaleDateString()}\nProblem: ${info.event.extendedProps.description || 'N/A'}`
                    );
                }}
                dateClick={(info) => {
                    console.log('Date clicked:', info.dateStr);
                }}
            />
        </div>
    );
};

export default Schedule;