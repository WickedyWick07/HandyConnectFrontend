import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer'
import {
  Carpentry,
  Plumbing,
  Painting,
  Flooring,
  HomeCare,
  HomeAutomation,
  ExteriorMaintenance,
} from '../constants/Services';

const Services = () => {
  // Combine all services into one array
  const services = [
    ...Carpentry,
    ...Plumbing,
    ...Painting,
    ...Flooring,
    ...HomeCare,
    ...HomeAutomation,
    ...ExteriorMaintenance,
  ];

  // State to track current page
  const [currentPage, setCurrentPage] = useState(0);

  // State to track which services are open
  const [openServices, setOpenServices] = useState({});

  // Number of services per page
  const servicesPerPage = 3;

  // Calculate start and end indices
  const startIndex = currentPage * servicesPerPage;
  const endIndex = startIndex + servicesPerPage;

  // Slice the services for the current page
  const currentServices = services.slice(startIndex, endIndex);

  // Handlers for navigation
  const handleNext = () => {
    if (endIndex < services.length) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  // Toggle visibility of services
  const toggleServices = (index) => {
    setOpenServices((prevState) => ({
      ...prevState,
      [index]: !prevState[index], // Toggle the visibility of the selected service
    }));
  };

  return (
    <div>
      <Header />
      <main>
        <section>
          <div>
            <h1 className="text-xl font-semibold m-4 text-center underline underline-offset-1">Available Handyman Services</h1>
            <div className="flex justify-center items-center">
              {/* Previous Button */}
              <button
                className="px-4 py-2 bg-gray-300 rounded-l"
                onClick={handlePrevious}
                disabled={currentPage === 0}
              >
                Previous
              </button>

              {/* Services List */}
              <div className="flex gap-4">
                {currentServices.map((service, index) => (
                  <div className="border p-4 border-none mx-3" key={index}>
                    <h1 className="font-semibold text-xl">{service.Title}</h1>
                    <p className="text-sm text-gray-700">{service.Description}</p>
                    <button
                      onClick={() => toggleServices(index + startIndex)} // Ensure correct index mapping
                      className="my-4 border hover:bg-purple-500 hover:text-white font-semibold rounded border-purple-700 text-purple-700 px-4 py-2"
                    >
                      {openServices[index + startIndex] ? 'Hide Services' : 'View Services'}
                    </button>
                    {openServices[index + startIndex] && (
                      <div>
                        <ul className="  mt-1 border rounded">
                          {service.Services.map((subService, subIndex) => (
                            <li className='text-xs font-semibold hover:underline rounded m-4' key={subIndex}>{subService}</li>
                          ))}
                        </ul>
                       
                      </div>
                    )}
                    <section>
                        <h1 className='text-md font-semibold '>Service Details</h1>
                     {service.Service_Details && (
                          <p className="mt-2
                           text-sm font-semibold text-gray-600">{service.Service_Details}</p>
                        )}
                        <p className='text-xs font-semibold mt-4'></p>

                    </section>
                  </div>
                ))}
              </div>

              {/* Next Button */}
              <button
                className="px-4 py-2 bg-gray-300 rounded-r"
                onClick={handleNext}
                disabled={endIndex >= services.length}
              >
                Next
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
};

export default Services;
