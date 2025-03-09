import CustomerHeader from './CustomerHeader'
import wrench from '../assets/Icons/wrench.svg'
import pin from '../assets/Icons/pin-map-fill.svg'
import clock from '../assets/Icons/alarm-fill.svg'
import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';


// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

// Custom marker icons
const serviceIcon = new L.Icon({
    iconUrl: wrench, // Using your existing wrench icon
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25],
})

// Component to recenter map when user location changes
function RecenterMap({ coords }) {
    const map = useMap()
    useEffect(() => {
        if (coords) {
            map.setView(coords, 13)
        }
    }, [coords, map])
    return null
}

const ServiceProviders = () => {
    const location = useLocation()
    const service = location.state?.service || ''
    const service_per_page = 6
    const [currentPage, setCurrentPage] = useState(0)
    const [serviceProviders, setServiceProviders] = useState([])
    const navigate = useNavigate()
    const startIndex = currentPage * service_per_page
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedService, setSelectedService] = useState('')
    const endIndex = startIndex + service_per_page
    const [filteredProviders, setFilteredProviders] = useState([])
    const [userLocation, setUserLocation] = useState(null)
    const [showNearbyOnly, setShowNearbyOnly] = useState(false)
    const [mapCenter, setMapCenter] = useState([0, 0])
    const [searchRadius, setSearchRadius] = useState(30) // radius in km
    const [showMap, setShowMap] = useState(false)
    const mapRef = useRef(null)

    const getUserLocation = () => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords
                        resolve({ latitude, longitude })
                    },
                    (error) => {
                        reject(error)
                    }
                )
            } else {
                reject('Geolocation is not supported by this browser.')
            }
        })
    }

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    useEffect(() => {
        const fetchAllProviders = async () => {
            try {
                const response = await api.get('/fetch-service-providers')
                console.log(response.data.data)
                setServiceProviders(response.data.data)
                setFilteredProviders(response.data.data)
            } catch (error) {
                console.error("Error fetching all providers:", error)
            }
        }

        const fetchProvidersByService = async () => {
            try {
                const response = await api.post('/fetch-by-service', { service })
                setServiceProviders(response.data.data)
                setFilteredProviders(response.data.data)
            } catch (error) {
                console.error('Error fetching providers by service:', error)
            }
        }

        if (service) {
            fetchProvidersByService()
        } else {
            fetchAllProviders()
        }

        // Initialize user location
        getUserLocation().then(location => {
            setUserLocation(location)
            setMapCenter([location.latitude, location.longitude])
        }).catch(error => {
            console.error("Error getting user location:", error)
        })
    }, [service])

    const handleSearch = async () => {
        try {
            const location = await getUserLocation()
            setUserLocation(location)
            setShowNearbyOnly(true)
            setMapCenter([location.latitude, location.longitude])

            let filtered = serviceProviders

            if (searchQuery) {
                filtered = filtered.filter(provider =>
                    provider.companyName.toLowerCase().includes(searchQuery.toLowerCase())
                )
            }

            if (selectedService) {
                filtered = filtered.filter(provider => {
                    const services = JSON.parse(provider.services[0])
                    return services.includes(selectedService.toLowerCase())
                })
            }

            filtered = filtered.filter(provider => {
                const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    provider.latitude,
                    provider.longitude
                )
                return distance <= searchRadius
            })

            // Add distance to each provider
            filtered = filtered.map(provider => ({
                ...provider,
                distance: calculateDistance(
                    location.latitude,
                    location.longitude,
                    provider.latitude,
                    provider.longitude
                ).toFixed(1)
            }))

            // Sort by distance
            filtered.sort((a, b) => a.distance - b.distance)

            setFilteredProviders(filtered)
            setCurrentPage(0)
            setShowMap(true)
        } catch (error) {
            console.error("Error during search:", error)
            alert("Unable to access location. Please enable location services and try again.")
        }
    }

    const handleReset = () => {
        setShowNearbyOnly(false)
        setSearchQuery('')
        setSelectedService('')
        setFilteredProviders(serviceProviders)
        setCurrentPage(0)
        setShowMap(false)
    }

    const viewProvider = async (provider) => {
        if (provider) {
            navigate('/view-provider', { state: { provider } })
        }
    }

    const handleNext = () => {
        if (endIndex < filteredProviders.length) {
            setCurrentPage((prevPage) => prevPage + 1)
        }
    }

    const handlePrevious = () => {
        if (currentPage > 0) {
            setCurrentPage((prevPage) => prevPage - 1)
        }
    }

    useEffect(() => {
        let filtered = serviceProviders;

        if (searchQuery) {
            filtered = filtered.filter(provider =>
                provider.companyName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedService) {
            filtered = filtered.filter(provider => {
                const services = JSON.parse(provider.services[0]);
                return services.includes(selectedService.toLowerCase());
            });
        }

        setFilteredProviders(filtered);
    }, [searchQuery, selectedService, serviceProviders]);

    return (
        <div className="bg-gray-100 min-h-screen">
            <main className="bg-gray-100 mx-auto flex-col flex justify-center">
                <CustomerHeader />
                
                {/* Search Section */}
                <section className="p-4">
                    <div className="flex justify-center gap-4 items-center border rounded bg-white p-4 flex-wrap">
                        <div>
                            <input
                                type="text"
                                className="border w-48 rounded text-xs px-4 py-2"
                                placeholder="Search service providers"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div>
                            <select 
                                className="border w-48 rounded text-xs px-4 py-2"
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                            >
                                <option value="">Select Service</option>
                                <option value="Plumbing">Plumbing</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Carpentry">Carpentry</option>
                                <option value="Cleaning">Cleaning</option>
                                <option value="Painting">Painting</option>
                            </select>
                        </div>
                        <div>
                            <select
                                className="border w-48 rounded text-xs px-4 py-2"
                                value={searchRadius}
                                onChange={(e) => setSearchRadius(Number(e.target.value))}
                            >
                                <option value="5">Within 5km</option>
                                <option value="10">Within 10km</option>
                                <option value="20">Within 20km</option>
                                <option value="30">Within 30km</option>
                                <option value="50">Within 50km</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleSearch}
                                className="bg-purple-500 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-semibold hover:bg-purple-600 transition-colors"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    className="bi bi-search"
                                    viewBox="0 0 16 16"
                                >
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                                </svg>
                                Find Nearby
                            </button>
                            {showNearbyOnly && (
                                <button 
                                    onClick={handleReset}
                                    className="bg-gray-500 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-600 transition-colors"
                                >
                                    Show All
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Map Section */}
                {showMap && userLocation && (
                    <section className="p-4">
                        <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
                            <MapContainer
                                center={mapCenter}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                                ref={mapRef}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                
                                {/* User location marker */}
                                <Marker position={[userLocation.latitude, userLocation.longitude]}>
                                    <Popup>Your Location</Popup>
                                </Marker>

                                {/* Search radius circle */}
                                <Circle
                                    center={[userLocation.latitude, userLocation.longitude]}
                                    radius={searchRadius * 1000}
                                    pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                                />

                                {/* Service provider markers */}
                                {filteredProviders.map((provider, index) => (
                                    <Marker
                                        key={index}
                                        position={[provider.latitude, provider.longitude]}
                                        icon={serviceIcon}
                                    >
                                        <Popup>
                                            <div className="text-center">
                                                <h3 className="font-bold">{provider.companyName}</h3>
                                                <p className="text-sm">{provider.location}</p>
                                                <p className="text-sm">Distance: {provider.distance}km</p>
                                                <button
                                                    onClick={() => viewProvider(provider)}
                                                    className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}

                                <RecenterMap coords={mapCenter} />
                            </MapContainer>
                        </div>
                    </section>
                )}

                {/* Providers Grid */}
                <div className="flex justify-center flex-col mx-auto mt-1">
                    <h1 className="text-center text-2xl font-semibold">Service Providers</h1>
                    <p className="text-center text-xs text-purple-700 font-semibold">
                        {showNearbyOnly 
                            ? `Showing nearby service providers within ${searchRadius}km` 
                            : service
                                ? `Showing recommended providers for "${service.Title}"`
                                : 'Showing all service providers'}
                    </p>
                </div>

                <section className="p-4 flex justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-auto gap-4">
                        {filteredProviders.slice(startIndex, endIndex).map((provider, i) => (
                            <div className="bg-white w-64 p-4 border rounded shadow-sm hover:shadow-md transition-shadow" key={i}>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2">
                                    <img
          src={provider.profilePicture?.startsWith('http') 
            ? provider.profilePicture 
            : `http://localhost:5000${provider.profilePicture}`}
          alt={provider.companyName || 'Provider profile'}
          className="w-7 h-7 object-cover rounded-full"
        />
                                        <h1 className="text-md font-semibold">
                                            {provider.companyName}
                                        </h1>
                                    </div>
                                </div>
                                <div className="m-2 p-2">
                                    <div className="flex gap-2 items-center mb-2">
                                        <img src={wrench} alt="wrench" />
                                        <p className="text-xs text-gray-600">
                                            {JSON.parse(provider.services[0]).join(', ')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 items-center mb-2">
                                        <img src={pin} alt="pin" />
                                        <p className="text-xs text-gray-600">{provider.location}</p>
                                    </div>
                                    <div className="flex gap-2 items-center mb-2">
                                        <img src={clock} alt="clock" />
                                        <p className="text-xs text-gray-600">{provider.yearsInService}</p>
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <p className="text-xs font-medium text-purple-600">
                                        {provider.rate}
                                    </p>
                                    <button  onClick={() => viewProvider(provider)} className="bg-blue-500 text-white text-sm font-medium px-4 py-1 rounded">
                                        Book
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>


                <div className="flex justify-center p-4">
                    <button
                        disabled={currentPage === 0}
                        onClick={handlePrevious}
                        className="border-blue-600 flex items-center font-bold gap-3 border hover:bg-blue-600 hover:text-white px-4 py-2 rounded text-blue-600"
                    >
                        Load Previous
                        <ArrowLeftCircleIcon className="size-3 font-bold mx-auto" />
                    </button>
                    <button
                        disabled={endIndex >= serviceProviders.length}
                        onClick={handleNext}
                        className="border-blue-600 flex items-center font-bold gap-3 border hover:bg-blue-600 hover:text-white px-4 py-2 rounded text-blue-600"
                    >
                        Load Next
                        <ArrowRightCircleIcon className="size-3 font-bold mx-auto" />
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ServiceProviders;
