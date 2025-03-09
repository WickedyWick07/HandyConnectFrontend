import merchant1 from '../assets/Merchants/Merchant-1.jpg';

const providerInfo = [ 
    {
        provider_image: merchant1,
        provider_name: "John Smith",
        provider_service: "Professional House Cleaner",
        provider_rating: 4.8,
        provider_amount_reviews:128,
        provider_about: "With over 10 years experience in house cleaning, I am dedicated to providing the best service possible. I am a hardworking and reliable individual who is passionate about cleaning and making your home look its best.",
        provider_location: "Cape Town, SA",
        provider_verified: true,
        provider_rate: "R500/hour",
        services_offered: ["House Cleaning", "Laundry", "Dishes", "Windows", "Oven Cleaning"],
        provider_reviews: [{
            reviewer_image: merchant1,
            reviewer_name: "Jane Doe",
            review_rating: 5,
            review_description: "John was amazing! He cleaned my house from top to bottom and it looks fantastic. I will definitely be using his services again.",
        }]	
    },
    {
        provider_image: merchant1,
        provider_name: "Emily Johnson",
        provider_service: "Professional Gardener",
        provider_rating: 4.7,
        provider_amount_reviews: 98,
        provider_about: "I have been a professional gardener for over 8 years. I specialize in garden design, maintenance, and plant care. I am passionate about creating beautiful and sustainable gardens.",
        provider_location: "Johannesburg, SA",
        provider_verified: true,
        provider_rate: "R400/hour",
        services_offered: ["Garden Design", "Plant Care", "Lawn Mowing", "Weeding", "Pruning"],
        provider_reviews: [{
            reviewer_image: merchant1,
            reviewer_name: "Michael Brown",
            review_rating: 4.5,
            review_description: "Emily transformed my garden into a beautiful oasis. Her attention to detail and knowledge of plants is impressive.",
        }]
    },
    {
        provider_image: merchant1,
        provider_name: "David Lee",
        provider_service: "Professional Electrician",
        provider_rating: 4.9,
        provider_amount_reviews: 150,
        provider_about: "With over 15 years of experience, I provide top-notch electrical services. I am reliable, efficient, and always ensure safety and quality in my work.",
        provider_location: "Durban, SA",
        provider_verified: true,
        provider_rate: "R600/hour",
        services_offered: ["Wiring", "Lighting Installation", "Electrical Repairs", "Safety Inspections", "Circuit Breaker Replacement"],
        provider_reviews: [{
            reviewer_image: merchant1,
            reviewer_name: "Sarah Wilson",
            review_rating: 5,
            review_description: "David did an excellent job with the electrical work in my home. He was professional and thorough. Highly recommended!",
        }]
    }
]

export default providerInfo

