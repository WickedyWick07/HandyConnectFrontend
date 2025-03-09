import merchant from '../assets/Merchants/Merchant-2.jpg';

const clients = [
    {
        Name: 'Sarah Wilson',
        Service: 'Home Cleaning',
        Location: 'Soweto, Johannesburg',
        Date: 'Mar 15 2025',
        Status: 'Pending',
        Action: 'Accept'
    },
    {
        Name: 'John Doe',
        Service: 'Gardening',
        Location: 'Sandton, Johannesburg',
        Date: 'Apr 10 2025',
        Status: 'Accepted',
        Action: 'Complete'
    },
    {
        Name: 'Jane Smith',
        Service: 'Plumbing',
        Location: 'Randburg, Johannesburg',
        Date: 'May 5 2025',
        Status: 'Pending',
        Action: 'Accept'
    },
    {
        Name: 'Michael Brown',
        Service: 'Electrical Repair',
        Location: 'Midrand, Johannesburg',
        Date: 'Jun 20 2025',
        Status: 'Accepted',
        Action: 'Complete'
    }
];

const active_jobs = [
    {
        Name: 'Sarah Wilson',
        Status: 'In Progress',
        Service: 'Home Cleaning',
        Image: merchant
    },
    {
        Name: 'Jane Doe',
        Status: 'In Progress',
        Service: 'Gardening',
        Image: merchant
    },
    {
        Name: 'Nolan Sams',
        Status: 'In Progress',
        Service: 'Plumbing',
        Image: merchant
    },
    {
        Name: 'Tom Aspinall',
        Status: 'In Progress',
        Service: 'Electrical Repair',
        Image: merchant
    },
]

export default {clients, active_jobs };