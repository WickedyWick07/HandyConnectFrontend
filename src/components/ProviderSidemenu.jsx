import settings from '../assets/Icons/house-gear-fill.svg';
import review from '../assets/Icons/envelope-paper-fill.svg';
import messages from '../assets/Icons/chat-dots-fill.svg';
import calendar from '../assets/Icons/calendar-date-fill.svg';
import house from '../assets/Icons/house-door-fill.svg';
import {useContext} from 'react';
import AuthContext from '../context/AuthContext'
const ProviderSidemenu = () => {
    const {logout} = useContext(AuthContext)
    return (
          <div className="w-44 min-h-full bg-white text-black">
  
              <ul className="space-y-4 font-medium p-4 flex flex-col text-black ">
              <h1 className="font-sans font-extrabold text-xl text-center p-2">HandyConnect</h1>
                  <li><a href="/dashboard/service-provider" className=" py-2 px-4 rounded hover:bg-purple-500 hover:text-white flex items-center text-sm">
                      <img src={house} className='w-4 h-4 mr-2' />
                      Dashboard
                  </a></li>
                  <li><a href="/provider-bookings" className=" py-2 px-4 rounded hover:bg-purple-500 hover:text-white flex items-center text-sm">
                      <img src={calendar} className='w-4 h-4 mr-2' />
                      Requests
                  </a></li>
                  <li><a href="/messages" className=" py-2 px-4 rounded hover:bg-purple-500 hover:text-white flex items-center text-sm">
                      <img src={messages} className='w-4 h-4 mr-2' />
                      Messages
                  </a></li>
                  <li><a href="/service-provider/history" className=" py-2 px-4 rounded hover:bg-purple-500 hover:text-white flex items-center text-sm">
                      <img src={review} className='w-4 h-4 mr-2' />
                      History
                  </a></li>
                  <li><a href="#contact" className=" py-2 px-4 rounded hover:bg-purple-500 hover:text-white flex items-center text-sm">
                      <img src={settings} className='w-4 h-4 mr-2' />
                      Settings
                  </a></li>
                <li><button onClick={() => logout()} className=" py-2 px-4 rounded hover:bg-red-500 hover:text-white flex items-center text-sm">
                    <img src={settings} className='w-4 h-4 mr-2' />
                    Logout
                </button></li>
              </ul>
          </div>
      );
}

export default ProviderSidemenu
