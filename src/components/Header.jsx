import React from 'react'
import { UserCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <div>
            <header className="flex items-center justify-between w-full p-4 bg-gray-100">
                <div className="flex items-center gap-3">
                    <h1 className="font-sans font-extrabold text-2xl">HandyConnect</h1>
                    <nav>
                        <ul className="flex text-gray-700 gap-4">
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
                <div className="flex gap-2">
                    <div className="border px-4 py-2 rounded flex items-center gap-2">
                        <UserCircleIcon className="h-5 w-5 text-purple-500" />
                        <button className="text-sm text-purple-500 font-semibold"><Link to='/sign-in'>Sign In</Link></button>
                    </div>
                    <div className="border px-4 py-2 rounded bg-purple-500 flex items-center gap-2">
                        <QuestionMarkCircleIcon className="h-5 w-5 text-white" />
                        <button className="text-sm text-white font-semibold">Help</button>
                    </div>
                </div>
            </header>
        </div>
    );
}

export default Header
