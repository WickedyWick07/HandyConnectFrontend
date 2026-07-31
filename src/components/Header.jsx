import React from 'react'
import { UserCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <div>
           <header className="flex flex-col md:flex-row md:items-center md:justify-between w-full p-4 bg-gray-100 gap-4">
           <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full">
                    <h1 className="font-sans font-extrabold text-2xl">HandyConnect</h1>
                    <nav>
                        <ul className="flex flex-col md:flex-row text-gray-700 gap-4 items-center">
                            <li className="text-sm text-gray-700 font-semibold cursor-pointer hover:text-purple-500">
                                <Link to="/">Home</Link>
                            </li>
                            <li className="text-sm text-gray-700 font-semibold cursor-pointer hover:text-purple-500">
                                <Link to="/services">Services</Link>
                            </li>
                            <li className="text-sm text-gray-700 font-semibold cursor-pointer hover:text-purple-500">
                                <Link to="/handyman-listings">Handyman Listings</Link>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="border px-4 py-2 rounded flex items-center justify-center gap-2 w-full sm:w-auto">
                        <UserCircleIcon className="h-5 w-5 text-purple-500" />
                        <button className="text-sm text-purple-500 font-semibold"><Link to='/sign-in'>Sign In</Link></button>
                    </div>
                    <div className="border px-4 py-2 rounded bg-purple-500 flex items-center justify-center gap-2 w-full sm:w-auto">
                        <QuestionMarkCircleIcon className="h-5 w-5 text-white" />
                        <button className="text-sm text-white font-semibold">Help</button>
                    </div>
                </div>
            </header>
        </div>
    );
}

export default Header
