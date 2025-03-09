import wrench from '../assets/Icons/wrench.svg'
import hammer from '../assets/Icons/hammer.svg'
import paintBucket from '../assets/Icons/paint-bucket.svg'
import tree from '../assets/Icons/tree-fill.svg'
import lightbulb from '../assets/Icons/lightbulb-fill.svg'
import house from '../assets/Icons/house-door-fill.svg'
import building from '../assets/Icons/building-fill.svg'
import kitchen from '../assets/Icons/house-gear-fill.svg'
import plumbing from '../assets/Icons/droplet-fill.svg'


const Carpentry = [
    {
        Title: "Carpentry",
        Description: "Professional carpentry services including custom furniture, cabinetry, and repairs.",
        Icon: hammer, // Use the imported icon component
        Services: [
            "Custom Furniture",
            "Cabinetry",
            "Wood Repairs",
            "Deck Building",
            "Trim and Molding",
            "Shelving Installation",
            "Door Installation",
            "Window Installation",
            "Framing",
            "Wooden Flooring"
        ],
        Service_Details: "Our carpentry services are tailored to meet your needs, offering precision-crafted furniture, high-quality cabinetry, and expert repairs. Whether it's building a custom deck or installing intricate trim and molding, we ensure every project is completed to perfection."
    }
];

const Plumbing = [
    {
        Title: "Plumbing",
        Description: "Expert plumbing services for all your installation, repair, and maintenance needs.",
        Icon: plumbing, // Use the imported icon component
        Services: [
            "Leak Repairs",
            "Pipe Installation",
            "Drain Cleaning",
            "Water Heater Installation",
            "Fixture Installation",
            "Sewer Line Repair",
            "Water Filtration Systems",
            "Bathroom Remodeling",
            "Kitchen Plumbing",
            "Emergency Plumbing Services"
        ],
        Service_Details: "Our plumbing services cover everything from minor leaks to full-scale installations. We specialize in water heater setups, emergency plumbing, and ensuring your home's plumbing system runs smoothly and efficiently."
    }
];

const HomeInstallation = [
    {
        Title: "Home installation",
        Description: "Comprehensive kitchen and bath remodeling and installation services.",
        Icon: kitchen, // Use the imported icon component
        Services: [
            "Cabinet Installation",
            "Countertop Installation",
            "Sink Installation",
            "Faucet Installation",
            "Tile Work",
            "Backsplash Installation",
            "Shower Installation",
            "Bathtub Installation",
            "Lighting Installation",
        ],
        Service_Details: "Transform your kitchen and bath into modern, functional spaces with our expert remodeling services. From countertops to custom lighting, we provide end-to-end solutions to enhance the style and utility of these vital areas."
    }
];

const Painting = [
    {
        Title: "Painting",
        Description: "High-quality painting services for both interior and exterior projects.",
        Icon: paintBucket, // Use the imported icon component
        Services: [
            "Interior Painting",
            "Exterior Painting",
            "Wallpaper Removal",
            "Drywall Repair",
            "Staining",
            "Deck Painting",
            "Fence Painting",
            "Cabinet Painting",
            "Trim Painting",
            "Color Consultation"
        ],
        Service_Details: "Our painting services ensure vibrant and long-lasting results for your home. From meticulous interior finishes to weather-resistant exterior coats, we bring color and life to every project."
    }
];

const Flooring = [
    {
        Title: "Flooring",
        Description: "Professional flooring installation and repair services for various types of flooring.",
        Icon: wrench, // Use the imported icon component
        Services: [
            "Hardwood Flooring",
            "Laminate Flooring",
            "Vinyl Flooring",
            "Tile Flooring",
            "Carpet Installation",
            "Floor Repairs",
            "Floor Refinishing",
            "Subfloor Installation",
            "Heated Flooring",
            "Floor Leveling"
        ],
        Service_Details: "We specialize in installing and repairing a wide range of flooring types, ensuring durability and aesthetic appeal. Whether it's luxurious hardwood or cost-effective vinyl, we deliver flawless results."
    }
];

const HomeCare = [
    {
        Title: "Home security",
        Description: "General home care services to keep your home in top condition.",
        Icon: house, // Use the imported icon component
        Services: [
            "General Repairs",
            "Maintenance Services",
            "Pressure Washing",
            "Handyman Services",
            "Furniture Assembly",
            "Picture Hanging",
            "Window Cleaning",
            "Caulking",
            "Weatherproofing"
        ],
        Service_Details: "Our home care services cover everything from basic repairs to seasonal maintenance. We help you maintain a safe, comfortable, and well-functioning home environment."
    }
];

const HomeAutomation = [
    {
        Title: "Home Automation",
        Description: "Advanced home automation services to make your home smarter and more efficient.",
        Icon: lightbulb, // Use the imported icon component
        Services: [
            "Smart Lighting",
            "Smart Thermostats",
            "Home Security Systems",
            "Smart Locks",
            "Voice Control Systems",
            "Automated Blinds",
            "Home Theater Systems",
            "Smart Appliances",
            "Network Setup",
            "Energy Management"
        ],
        Service_Details: "Make your home smarter with our cutting-edge automation solutions. From security systems to energy-saving smart devices, we help you create a connected, efficient living space."
    }
];

const ExteriorMaintenance = [
    {
        Title: "Exterior Maintenance",
        Description: "Comprehensive exterior maintenance services to keep your home's exterior in great shape.",
        Icon: tree, // Use the imported icon component
        Services: [
            "Lawn Care",
            "Landscaping",
            "Fence Repair",
            "Deck Maintenance",
            "Gutter Repair",
            "Exterior Painting",
            "Roof Repair",
            "Power Washing",
            "Siding Repair",
            "Driveway Sealing"
        ],
        Service_Details: "Our exterior maintenance services enhance your home's curb appeal and protect it from the elements. From lawn care to roof repair, we cover all aspects of exterior upkeep."
    }
];

export { Carpentry, HomeInstallation, Plumbing, Painting, Flooring, HomeCare, HomeAutomation, ExteriorMaintenance };
