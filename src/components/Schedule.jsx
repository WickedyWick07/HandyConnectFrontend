import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const Schedule = () => {
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const { fetchCurrentUser } = useContext(AuthContext);

    
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetchCurrentUser()
                console.log(res)
                setUser(res)
            } catch (error) {
                console.error('Error fetching user', error.stack)
            }
        }
        fetchUser()
    }, [])

    useEffect(() => {
        const getBookings = async () => {
            if (!user) return; // Wait until user is set
            try {
                console.log("Sending user:", user);
                const res = await api.post('/fetch-provider-bookings', { user });
                console.log('Fetched bookings:', res.data);
                
                // Map the bookings into the correct format for FullCalendar
                const formattedEvents = res.data.bookings.map(booking => ({
                    title: booking.service, // Event title
                    start: booking.date, // Event start time
                    end: booking.date, // Event end time
                    description: booking.description, // Event description
                    id: booking.id // Event id, if you need to reference it later
                }));
    
                setEvents(formattedEvents);
            } catch (error) {
                console.error('There was an error fetching bookings', error);
            }
        };
    
        getBookings();
    }, [user]); // Runs when `user` changes
     // Runs when `user` changes

    return (
        <div>
           <FullCalendar
    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
    initialView="dayGridMonth"
    headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    }}
    events={events}
    aspectRatio={1.5}
    contentHeight="auto"
    height="800px"
    editable={true}
    selectable={true}
    selectMirror={true}
    dayMaxEvents={true}
    eventClick={(info) => {
        console.log('Event clicked:', info.event);

        // Example: Show event details in a modal or alert
        alert(`Event: ${info.event.title}\nStart: ${info.event.start}\nEnd: ${info.event.end}\nDescription: ${info.event.extendedProps.description}`);
    }}
    dateClick={(info) => {
        console.log('Date clicked:', info.dateStr);
    }}
/>

        </div>
    );
};

export default Schedule;
