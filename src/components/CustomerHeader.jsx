import { Link } from 'react-router-dom';

const CustomerHeader = () => {
    return (
        <div>
            <header className="flex items-center justify-between w-full p-4 bg-white">
                <div className="flex items-center gap-3">
                    <h1 className="font-sans font-extrabold text-2xl">HandyConnect</h1>
                    <nav>
                        <ul className="flex flex-end text-gray-700 gap-4">
                            <li className="text-sm text-gray-700 font-semibold cursor-pointer hover:text-purple-500">
                                <Link to="/dashboard/customer">Dashboard</Link>
                            </li>
                            <li className="text-sm text-gray-700 font-semibold cursor-pointer hover:text-purple-500">
                                <Link to="/service-providers">View Providers</Link>
                            </li>
                            <li className="text-sm text-gray-700 font-semibold cursor-pointer hover:text-purple-500">
                                <Link to="/messages">Messages</Link>
                            </li>
                            <li className="text-sm text-gray-700 font-semibold cursor-pointer hover:text-purple-500">
                                <Link to="/history">History</Link>
                            </li>
                            <li className="text-sm text-gray-700 font-semibold cursor-pointer hover:text-purple-500">
                                <Link to="/settings">Settings</Link>
                            </li>
                        </ul>
                    </nav>
                </div>
               
            </header>
        </div>
    );
}

export default CustomerHeader
