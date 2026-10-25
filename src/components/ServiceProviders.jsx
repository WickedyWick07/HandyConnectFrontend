import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    MapPin,
    Search,
    SlidersHorizontal,
    Star,
    Wrench,
} from 'lucide-react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import CustomerHeader from './CustomerHeader'
import api from '../utils/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const PAGE_SIZE = 6
const RATINGS = [4.9, 4.8, 4.7, 4.9, 4.6, 4.8]
const REVIEWS = [124, 96, 178, 63, 210, 142]
const DISTANCES = [1.2, 2.4, 3.1, 4.5, 5.3, 6.2]
const SERVICE_OPTIONS = ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Painting']

function RecenterMap({ coords }) {
    const map = useMap()

    useEffect(() => {
        if (coords) map.setView([coords.latitude, coords.longitude], 13)
    }, [coords, map])

    return null
}

function parseServices(services) {
    if (!services) return []
    const candidates = Array.isArray(services) ? services : [services]

    return candidates.flatMap((service) => {
        if (Array.isArray(service)) return service
        if (typeof service !== 'string') return []

        try {
            const parsed = JSON.parse(service)
            return Array.isArray(parsed) ? parsed : [parsed]
        } catch {
            return [service]
        }
    }).filter((service) => typeof service === 'string' && service.trim())
}

function getDistance(latitude, longitude, provider) {
    const providerLatitude = Number(provider.latitude)
    const providerLongitude = Number(provider.longitude)
    if (!Number.isFinite(providerLatitude) || !Number.isFinite(providerLongitude)) return null

    const radians = (degrees) => degrees * Math.PI / 180
    const deltaLatitude = radians(providerLatitude - latitude)
    const deltaLongitude = radians(providerLongitude - longitude)
    const value = Math.sin(deltaLatitude / 2) ** 2
        + Math.cos(radians(latitude))
        * Math.cos(radians(providerLatitude))
        * Math.sin(deltaLongitude / 2) ** 2

    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function ProviderSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading providers">
            {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-slate-200" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 rounded bg-slate-200" />
                            <div className="h-3 w-1/2 rounded bg-slate-100" />
                        </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <div className="h-7 w-20 rounded-lg bg-slate-100" />
                        <div className="h-7 w-24 rounded-lg bg-slate-100" />
                        <div className="h-7 w-16 rounded-lg bg-slate-100" />
                    </div>
                    <div className="mt-6 h-4 w-2/3 rounded bg-slate-100" />
                    <div className="mt-6 h-11 rounded-lg bg-slate-200" />
                </div>
            ))}
        </div>
    )
}

function ProviderCard({ provider, index, onBook, location }) {
    const name = provider.companyName || 'Local service provider'
    const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    const services = parseServices(provider.services)
    const primaryService = services[0] || 'Home Services'
    const tags = [
        primaryService,
        ...(services.slice(1, 3)),
        ...(services.length < 2 ? ['Emergency Repair'] : []),
        ...(services.length < 3 ? [primaryService.toLowerCase().includes('plumb') ? 'Leak Detection' : 'On-demand Service'] : []),
    ].slice(0, 3)
    const profilePicture = provider.profilePicture
    const imageUrl = profilePicture
        ? profilePicture.startsWith('http')
            ? profilePicture
            : `${import.meta.env.VITE_IMAGES_API_URL || 'https://localhost:5000'}${profilePicture}`
        : ''
    const measuredDistance = location
        ? getDistance(location.latitude, location.longitude, provider)
        : null
    const displayedDistance = measuredDistance ?? DISTANCES[index % DISTANCES.length]

    return (
        <article className="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    <span aria-hidden="true">{initials}</span>
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(event) => {
                                event.currentTarget.style.display = 'none'
                            }}
                        />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <h2 className="truncate text-base font-bold text-slate-900">{name}</h2>
                        <BadgeCheck className="h-5 w-5 shrink-0 fill-blue-600 text-white" aria-label="Verified provider" />
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm" aria-label={`${provider.rating ?? RATINGS[index % RATINGS.length]} out of 5 stars`}>
                        <span className="flex items-center text-amber-400" aria-hidden="true">
                            {Array.from({ length: 5 }, (_, starIndex) => (
                                <Star key={starIndex} className="h-3.5 w-3.5 fill-current" />
                            ))}
                        </span>
                        <span className="font-semibold text-slate-700">
                            {provider.rating ?? RATINGS[index % RATINGS.length]}
                        </span>
                        <span className="text-slate-500">({provider.reviews ?? REVIEWS[index % REVIEWS.length]})</span>
                    </div>
                </div>
            </div>

            <div className="mt-5 flex min-h-7 flex-wrap gap-2">
                {tags.map((tag, tagIndex) => (
                    <span
                        key={`${tag}-${tagIndex}`}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                            tagIndex === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        {tag}
                    </span>
                ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {provider.yearsInService || 1} yrs in service
                </span>
                <span aria-hidden="true" className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {displayedDistance.toFixed(1)} km away
                </span>
            </div>

            <button
                type="button"
                onClick={() => onBook(provider)}
                className="mt-5 w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
                Book
            </button>
        </article>
    )
}

const ServiceProviders = () => {
    const routeLocation = useLocation()
    const navigate = useNavigate()
    const routeService = routeLocation.state?.service
    const initialService = typeof routeService === 'string'
        ? routeService
        : routeService?.Title || routeService?.title || ''
    const [providers, setProviders] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedService, setSelectedService] = useState(initialService)
    const [searchRadius, setSearchRadius] = useState(30)
    const [showFilters, setShowFilters] = useState(false)
    const [sortBy, setSortBy] = useState('recommended')
    const [minimumRating, setMinimumRating] = useState(0)
    const [userLocation, setUserLocation] = useState(null)
    const [locationError, setLocationError] = useState('')
    const [showMap, setShowMap] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const [nearbySearch, setNearbySearch] = useState(false)

    useEffect(() => {
        let active = true

        const fetchProviders = async () => {
            setLoading(true)
            setLoadError('')
            try {
                const response = initialService
                    ? await api.post('/fetch-by-service', { service: routeService })
                    : await api.get('/fetch-service-providers')
                const results = response.data?.data
                if (!Array.isArray(results)) {
                    throw new Error('The provider service returned an invalid response.')
                }
                if (active) setProviders(results)
            } catch (error) {
                console.error('Error fetching service providers:', error)
                if (active) setLoadError('We could not load service providers. Please try again.')
            } finally {
                if (active) setLoading(false)
            }
        }

        fetchProviders()
        return () => {
            active = false
        }
    }, [initialService, routeService])

    const filteredProviders = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        const filtered = providers
            .map((provider, index) => ({
                ...provider,
                rating: Number(provider.rating) || RATINGS[index % RATINGS.length],
                reviews: Number(provider.reviews) || REVIEWS[index % REVIEWS.length],
                distanceKm: userLocation
                    ? getDistance(userLocation.latitude, userLocation.longitude, provider)
                    : DISTANCES[index % DISTANCES.length],
            }))
            .filter((provider) => {
                const providerServices = parseServices(provider.services)
                const matchesQuery = !query
                    || (provider.companyName || '').toLowerCase().includes(query)
                    || providerServices.some((serviceName) => serviceName.toLowerCase().includes(query))
                const matchesService = !selectedService
                    || providerServices.some((serviceName) => serviceName.toLowerCase() === selectedService.toLowerCase())
                const matchesDistance = !nearbySearch
                    || (provider.distanceKm !== null && provider.distanceKm <= searchRadius)
                return matchesQuery && matchesService && matchesDistance && provider.rating >= minimumRating
            })

        if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating)
        if (sortBy === 'distance') filtered.sort((a, b) => a.distanceKm - b.distanceKm)
        return filtered
    }, [providers, searchQuery, selectedService, userLocation, nearbySearch, searchRadius, minimumRating, sortBy])

    useEffect(() => {
        setCurrentPage(0)
    }, [searchQuery, selectedService, userLocation, searchRadius, minimumRating, sortBy])

    const totalPages = Math.max(1, Math.ceil(filteredProviders.length / PAGE_SIZE))
    const pageProviders = filteredProviders.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
    const pageNumbers = totalPages <= 5
        ? Array.from({ length: totalPages }, (_, index) => index)
        : currentPage <= 2
            ? [0, 1, 2]
            : currentPage >= totalPages - 3
                ? [totalPages - 3, totalPages - 2, totalPages - 1]
                : [currentPage - 1, currentPage, currentPage + 1]

    const handleFindNearby = () => {
        setLocationError('')
        if (!navigator.geolocation) {
            setLocationError('Location services are not supported by this browser.')
            return
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setUserLocation({ latitude: coords.latitude, longitude: coords.longitude })
                setNearbySearch(true)
                setShowMap(true)
            },
            () => setLocationError('We could not access your location. Please allow location access and try again.'),
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const handleReset = () => {
        setSearchQuery('')
        setSelectedService('')
        setUserLocation(null)
        setNearbySearch(false)
        setShowMap(false)
        setLocationError('')
        setCurrentPage(0)
    }

    const viewProvider = (provider) => {
        navigate('/view-provider', { state: { provider } })
    }

    return (
        <div className="min-h-screen bg-[#f5f7fb]">
            <CustomerHeader />
            <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 md:px-6 md:pt-10">
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Service Providers</h1>
                        <p className="mt-2 text-sm text-slate-500 sm:text-base">
                            Find trusted professionals <span className="px-1 text-slate-300">•</span>
                            {filteredProviders.length} providers near you
                        </p>
                    </div>
                    <label className="flex items-center gap-2 self-start text-sm font-medium text-slate-600 sm:self-auto">
                        Sort by:
                        <select
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="recommended">Recommended</option>
                            <option value="rating">Top rated</option>
                            <option value="distance">Distance</option>
                        </select>
                    </label>
                </div>

                <section aria-label="Search and filters" className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.6fr)_minmax(150px,1fr)_minmax(145px,0.9fr)_auto_auto]">
                        <label className="relative block">
                            <span className="sr-only">Search services or providers</span>
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search services, e.g. Plumber..."
                                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                        <label>
                            <span className="sr-only">Service</span>
                            <select
                                value={selectedService}
                                onChange={(event) => setSelectedService(event.target.value)}
                                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">All services</option>
                                {SERVICE_OPTIONS.map((serviceName) => (
                                    <option key={serviceName} value={serviceName}>{serviceName}</option>
                                ))}
                            </select>
                        </label>
                        <label className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                            <span className="sr-only">Search distance</span>
                            <select
                                value={searchRadius}
                                onChange={(event) => setSearchRadius(Number(event.target.value))}
                                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                {[5, 10, 20, 30, 50].map((distance) => (
                                    <option key={distance} value={distance}>Within {distance}km</option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={handleFindNearby}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                            <Search className="h-4 w-4" aria-hidden="true" />
                            Find Nearby
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowFilters((open) => !open)}
                            aria-expanded={showFilters}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                            <Filter className="h-4 w-4" aria-hidden="true" />
                            Filters
                        </button>
                    </div>

                    {showFilters && (
                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                            <SlidersHorizontal className="h-4 w-4 text-slate-500" aria-hidden="true" />
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                Minimum rating
                                <select
                                    value={minimumRating}
                                    onChange={(event) => setMinimumRating(Number(event.target.value))}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value={0}>Any rating</option>
                                    <option value={4.5}>4.5 and up</option>
                                    <option value={4.8}>4.8 and up</option>
                                </select>
                            </label>
                            {(nearbySearch || searchQuery || selectedService || minimumRating > 0) && (
                                <button type="button" onClick={handleReset} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {locationError && (
                    <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {locationError}
                    </p>
                )}

                {showMap && userLocation && (
                    <section aria-label="Nearby providers map" className="mt-6 h-72 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                        <MapContainer
                            center={[userLocation.latitude, userLocation.longitude]}
                            zoom={13}
                            scrollWheelZoom={false}
                            className="h-full w-full"
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={[userLocation.latitude, userLocation.longitude]}>
                                <Popup>Your location</Popup>
                            </Marker>
                            <Circle
                                center={[userLocation.latitude, userLocation.longitude]}
                                radius={searchRadius * 1000}
                                pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.08 }}
                            />
                            {filteredProviders.map((provider) => (
                                Number.isFinite(Number(provider.latitude)) && Number.isFinite(Number(provider.longitude)) && (
                                    <Marker key={provider._id || provider.id || provider.companyName} position={[Number(provider.latitude), Number(provider.longitude)]}>
                                        <Popup>
                                            <div className="text-center">
                                                <p className="font-semibold">{provider.companyName}</p>
                                                <button type="button" onClick={() => viewProvider(provider)} className="mt-2 rounded bg-blue-600 px-3 py-1 text-white">
                                                    Book
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            ))}
                            <RecenterMap coords={userLocation} />
                        </MapContainer>
                    </section>
                )}

                <section aria-label="Service providers" className="mt-8">
                    {loading ? (
                        <ProviderSkeleton />
                    ) : loadError ? (
                        <div role="alert" className="rounded-2xl border border-rose-100 bg-white px-6 py-12 text-center shadow-sm">
                            <Wrench className="mx-auto h-8 w-8 text-rose-400" aria-hidden="true" />
                            <h2 className="mt-3 text-lg font-semibold text-slate-900">Providers are unavailable</h2>
                            <p className="mt-1 text-sm text-slate-500">{loadError}</p>
                        </div>
                    ) : filteredProviders.length === 0 ? (
                        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-14 text-center shadow-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <Search className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <h2 className="mt-4 text-lg font-semibold text-slate-900">No providers found</h2>
                            <p className="mt-1 text-sm text-slate-500">Try another service or adjust your search filters.</p>
                            <button type="button" onClick={handleReset} className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-800">
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pageProviders.map((provider, index) => (
                                <ProviderCard
                                    key={provider._id || provider.id || provider.companyName || index}
                                    provider={provider}
                                    index={currentPage * PAGE_SIZE + index}
                                    onBook={viewProvider}
                                    location={userLocation}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {!loading && !loadError && filteredProviders.length > PAGE_SIZE && (
                    <nav aria-label="Pagination" className="mt-9 flex items-center justify-center gap-1.5">
                        <button
                            type="button"
                            aria-label="Previous page"
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        {pageNumbers[0] > 0 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(0)}
                                    className="h-10 min-w-10 rounded-lg px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-white"
                                >
                                    1
                                </button>
                                {pageNumbers[0] > 1 && <span aria-hidden="true" className="px-1 text-slate-400">...</span>}
                            </>
                        )}
                        {pageNumbers.map((page) => (
                            <button
                                key={page}
                                type="button"
                                aria-current={currentPage === page ? 'page' : undefined}
                                onClick={() => setCurrentPage(page)}
                                className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition-colors ${
                                    currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-white'
                                }`}
                            >
                                {page + 1}
                            </button>
                        ))}
                        {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                            <>
                                {pageNumbers[pageNumbers.length - 1] < totalPages - 2 && (
                                    <span aria-hidden="true" className="px-1 text-slate-400">...</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(totalPages - 1)}
                                    className="h-10 min-w-10 rounded-lg px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-white"
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            aria-label="Next page"
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </nav>
                )}
            </main>
        </div>
    )
}

export default ServiceProviders
