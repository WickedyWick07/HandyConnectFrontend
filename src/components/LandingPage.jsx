import React from 'react';
import heroImg from '../assets/hero-img.jpg';
import manWorkingImg from '../assets/handyman-working-1.jpg';
import phoneVerification from '../assets/phone-verification.png';
import testimonialPicture from '../assets/testimonial-picture.jpg';
import { StarIcon } from '@heroicons/react/24/solid';
import Header from './Header';
import Footer from './Footer';
import { Links } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="font-sans">
      <Header/>

      <section className="relative flex flex-col h-screen justify-center items-center">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '100%',
          }}
        ></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl font-semibold">Expert Handyman Solutions</h1>
          <p className="text-xl mt-5">Reliable and affordable handyman services at your doorstep</p>
          <button className="px-4 py-2 text-xl bg-purple-500 rounded mt-5">Get Started</button>
        </div>
      </section>

      <section className="p-6">
        <h1 className="text-center text-3xl font-bold">Key Features</h1>
        <p className="text-center text-gray-700 font-semibold mx-auto mt-3 max-w-3xl">
          Discover the ultimate convenience with HandyConnect, your go-to app for connecting with professional handymen for all your home repair needs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h2 className="text-xl font-bold">Instant Booking</h2>
            <p className="text-gray-700 mt-3">
              Easily book appointments with skilled handymen at your convenience through our intuitive app interface.
            </p>
            <div className="mt-4 flex gap-4">
              <button className="px-4 py-2 bg-purple-700 text-white rounded">Try Now</button>
              <button className="px-4 py-2 border border-purple-700 text-purple-700 rounded">Learn More</button>
            </div>
          </div>
          <img src={manWorkingImg} alt="Handyman working" className="object-cover rounded" />

          <img src={phoneVerification} alt="Phone verification" className="object-cover rounded" />
          <div>
            <h2 className="text-xl font-bold">Verified Professionals</h2>
            <p className="text-gray-700 mt-3">
              All our handymen are thoroughly vetted and verified to ensure you receive top-notch service every time.
            </p>
            <div className="mt-4 flex gap-4">
              <button className="px-4 py-2 bg-purple-700 text-white rounded">Try Now</button>
              <button className="px-4 py-2 border border-purple-700 text-purple-700 rounded">Learn More</button>
            </div>
          </div>
        </div>
      </section>

      <section className="p-6">
        <h1 className="text-center text-3xl font-bold">Testimonials</h1>
        <div className="flex flex-col items-center mt-6">
          <img
            src={testimonialPicture}
            alt="Testimonial"
            className="object-cover rounded-full h-24 w-24 mx-auto"
          />
          <div className="mt-4 flex">
            {[...Array(5)].map((_, index) => (
              <StarIcon key={index} className="h-5 w-5 text-yellow-500" />
            ))}
          </div>
          <p className="text-gray-700 text-sm font-semibold mt-4 max-w-xl text-center">
            "HandyConnect has transformed the way I manage my home projects. The ease of connecting with reliable professionals is unmatched."
          </p>
          <p className="text-black font-bold mt-2">Sarah Thompson</p>
          <p className="text-xs text-gray-700">Homeowner</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
