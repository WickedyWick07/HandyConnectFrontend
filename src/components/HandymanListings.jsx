import React from 'react';
import Header from './Header';
import { StarIcon } from '@heroicons/react/24/solid';
import merchant1 from '../assets/Merchants/Merchant-1.jpg';
import merchant2 from '../assets/Merchants/Merchant-2.jpg';
import merchant3 from '../assets/Merchants/Merchant-3.jpg';
import merchant4 from '../assets/Merchants/Merchant-4.jpg';
import testimonial1 from '../assets/RatingsAndReviews/client-testimonial.jpg';
import testimonial2 from '../assets/RatingsAndReviews/client-testimonial-2.jpg';
import testimonial3 from '../assets/RatingsAndReviews/client-testimonial-3.jpg';
import testimonial4 from '../assets/RatingsAndReviews/client-testimonial-4.png';
import testimonial5 from '../assets/RatingsAndReviews/client-testimonial-5.jfif';
import testimonial6 from '../assets/RatingsAndReviews/client-testimonial-6.png';
import Footer from './Footer';

const HandymanListings = () => {
    return (
        <div>
            <Header />
            <main className="m-4">
                <h1 className="text-center text-xl underline mt-4">Available Handymen</h1>
                <section className="grid grid-cols-2 m-4 mx-auto">
                    {[{
                        name: 'John Doe',
                        desc: 'Expert Plumber with 10 years experience',
                        img: merchant1,
                        stars: 4,
                    }, {
                        name: 'Emily Smith',
                        desc: 'Professional Painter with 8 years experience',
                        img: merchant2,
                        stars: 5,
                    }, {
                        name: 'Mike Johnson',
                        desc: 'Electrician with 5 years experience',
                        img: merchant3,
                        stars: 3,
                    }, {
                        name: 'Sarah Brown',
                        desc: 'Carpenter with 12 years experience',
                        img: merchant4,
                        stars: 5,
                    }].map((handyman, index) => (
                        <div className="grid grid-cols-2 m-4 p-3" key={index}>
                            <div>
                                <h1 className="font-semibold text-md">{handyman.name}</h1>
                                <p className="text-gray-700 font-medium text-xs my-2">{handyman.desc}</p>
                                <div className="flex">
                                    {[...Array(handyman.stars)].map((_, i) => (
                                        <StarIcon key={i} className="h-5 w-5 text-yellow-500" />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <img src={handyman.img} alt={`${handyman.name}`} className="h-24 w-36" />
                            </div>
                        </div>
                    ))}
                </section>

                <h1 className="text-center text-xl underline mt-4">Ratings and Reviews</h1>
                <section className="grid grid-cols-3">
                    {[{
                        name: 'Jane Doe',
                        img: testimonial1,
                        stars: 5,
                        review: 'Fixed my leaking sink in no time. Highly recommended.',
                    }, {
                        name: 'Emily Clark',
                        img: testimonial2,
                        stars: 5,
                        review: 'Did a great job painting the living room. Very detail-oriented and professional.',
                    }, {
                        name: 'Michael Lee',
                        img: testimonial3,
                        stars: 5,
                        review: 'Installed our new lighting fixtures perfectly. Friendly and skilled handyman.',
                    }, {
                        name: 'Sarah Wilson',
                        img: testimonial4,
                        stars: 5,
                        review: 'Handled our renovations with care and skill. Amazing work!',
                    }, {
                        name: 'David Brown',
                        img: testimonial5,
                        stars: 5,
                        review: 'Quick and efficient service. Highly recommended!',
                    }, {
                        name: 'Linda Green',
                        img: testimonial6,
                        stars: 5,
                        review: 'Absolutely professional and detail-oriented!',
                    }].map((testimonial, index) => (
                        <div className="m-4" key={index}>
                            <div className="flex items-center">
                                <img src={testimonial.img} alt={testimonial.name} className="w-20 h-20 object-cover rounded-full" />
                                <div className="flex-col ml-10">
                                    <h1>{testimonial.name}</h1>
                                    <div className="flex">
                                        {[...Array(testimonial.stars)].map((_, i) => (
                                            <StarIcon key={i} className="h-3 w-3 text-yellow-500" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs font-medium">{testimonial.review}</p>
                        </div>
                    ))}
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default HandymanListings;
