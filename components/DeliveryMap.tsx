'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { GoogleMap, LoadScript, DirectionsRenderer } from '@react-google-maps/api'
import { Navigation, MapPin } from 'lucide-react'
import { Button } from './Button'

interface DeliveryMapProps {
  pickupAddress?: string
  deliveryAddress: string
  pickupCoords?: { lat: number; lng: number }
  deliveryCoords?: { lat: number; lng: number }
}

const containerStyle = {
  width: '100%',
  height: '400px',
}

const defaultCenter = {
  lat: -26.2041, // Johannesburg default
  lng: 28.0473,
}

// Fallback component when Google Maps API key is missing or invalid
function FallbackMapView({ 
  deliveryAddress, 
  pickupAddress,
  pickupCoords,
  deliveryCoords
}: { 
  deliveryAddress: string
  pickupAddress?: string
  pickupCoords?: { lat: number; lng: number }
  deliveryCoords?: { lat: number; lng: number }
}) {
  // Build Google Maps embed URL with route
  let mapsEmbedUrl: string
  let mapsUrl: string
  
  if (pickupCoords && deliveryCoords) {
    // Use coordinates if available for better accuracy
    mapsEmbedUrl = `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${deliveryCoords.lat},${deliveryCoords.lng}&output=embed`
    mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${deliveryCoords.lat},${deliveryCoords.lng}`
  } else if (pickupAddress && deliveryAddress) {
    // Use addresses if coordinates not available
    const encodedPickup = encodeURIComponent(pickupAddress)
    const encodedDelivery = encodeURIComponent(deliveryAddress)
    mapsEmbedUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodedPickup}&destination=${encodedDelivery}&output=embed`
    mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodedPickup}&destination=${encodedDelivery}`
  } else {
    // Fallback to destination only
    const encodedAddress = encodeURIComponent(deliveryAddress)
    mapsEmbedUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&output=embed`
    mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 relative">
      {/* Embedded Google Maps iframe */}
      <iframe
        src={mapsEmbedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full"
      />
      
      {/* Overlay button to open in new tab */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          onClick={() => window.open(mapsUrl, '_blank')}
          className="flex items-center gap-2 shadow-lg"
          size="sm"
        >
          <Navigation className="w-4 h-4" />
          Open in Maps
        </Button>
      </div>
    </div>
  )
}

export function DeliveryMap({
  pickupAddress,
  deliveryAddress,
  pickupCoords,
  deliveryCoords,
}: DeliveryMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  // Validate API key - check for empty, placeholder, or invalid format
  const isValidApiKey = apiKey && 
                        apiKey !== '' && 
                        !apiKey.includes('placeholder') &&
                        !apiKey.includes('your_') &&
                        !apiKey.includes('YOUR_') &&
                        apiKey.length > 20

  // Check if Google Maps is already loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps) {
      setScriptLoaded(true)
      setIsLoaded(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onLoad = useCallback(() => {
    setIsLoaded(true)
    setLoadError(null)
    setScriptLoaded(true)
  }, [])

  const onError = useCallback((error: Error) => {
    console.error('Google Maps LoadScript error:', error)
    // Check for specific error types
    if (error.message?.includes('InvalidKeyMapError') || error.message?.includes('InvalidKey')) {
      setLoadError('Invalid API key. Please check your Google Maps API key configuration.')
    } else {
      setLoadError('Failed to load Google Maps. Please check your API key configuration.')
    }
    setIsLoaded(false)
  }, [])

  useEffect(() => {
    if (!isValidApiKey || !isLoaded || loadError) {
      return
    }

    const calculateRoute = () => {
      try {
        if (!window.google?.maps) return

        const directionsService = new window.google.maps.DirectionsService()

        const origin = pickupAddress || (pickupCoords 
          ? new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng)
          : undefined)
        
        const destination = deliveryCoords
          ? new window.google.maps.LatLng(deliveryCoords.lat, deliveryCoords.lng)
          : deliveryAddress

        if (!origin || !destination) return

        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result) {
              setDirections(result)
              setMapError(null)
            } else {
              setMapError('Could not calculate route. Please check addresses.')
            }
          }
        )
      } catch (error) {
        console.error('Error calculating route:', error)
        setMapError('Error loading map directions')
      }
    }

    if (isLoaded && !loadError) {
      setTimeout(calculateRoute, 500)
    }
  }, [pickupAddress, deliveryAddress, pickupCoords, deliveryCoords, isValidApiKey, isLoaded, loadError])

  // Show fallback only if API key is truly missing or invalid (not during loading)
  if (!isValidApiKey) {
    return (
      <FallbackMapView 
        deliveryAddress={deliveryAddress} 
        pickupAddress={pickupAddress}
        pickupCoords={pickupCoords}
        deliveryCoords={deliveryCoords}
      />
    )
  }

  // If Google Maps is already loaded, render map directly without LoadScript
  if (scriptLoaded && typeof window !== 'undefined' && window.google?.maps) {
    return (
      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={12}
          onLoad={onLoad}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  strokeColor: '#22c55e',
                  strokeWeight: 5,
                },
              }}
            />
          )}
        </GoogleMap>
        {mapError && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-2 rounded shadow-lg text-sm z-10">
            {mapError}
          </div>
        )}
        {loadError && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-2 rounded shadow-lg text-sm z-20 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{loadError}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const encodedAddress = encodeURIComponent(deliveryAddress)
                const mapsUrl = pickupAddress
                  ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupAddress)}&destination=${encodedAddress}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
                window.open(mapsUrl, '_blank')
              }}
              className="ml-2 bg-white text-gray-900 hover:bg-gray-100"
            >
              Open in Maps
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Otherwise, use LoadScript to load Google Maps
  return (
    <LoadScript 
      googleMapsApiKey={apiKey} 
      onLoad={onLoad}
      onError={onError}
      loadingElement={
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-600">Loading map...</p>
        </div>
      }
    >
      <div className="relative">
        {loadError && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-2 rounded shadow-lg text-sm z-20 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{loadError}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const encodedAddress = encodeURIComponent(deliveryAddress)
                const mapsUrl = pickupAddress
                  ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupAddress)}&destination=${encodedAddress}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
                window.open(mapsUrl, '_blank')
              }}
              className="ml-2 bg-white text-gray-900 hover:bg-gray-100"
            >
              Open in Maps
            </Button>
          </div>
        )}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={12}
          onLoad={onLoad}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  strokeColor: '#22c55e',
                  strokeWeight: 5,
                },
              }}
            />
          )}
        </GoogleMap>
        {mapError && !loadError && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-2 rounded shadow-lg text-sm z-10">
            {mapError}
          </div>
        )}
      </div>
    </LoadScript>
  )
}

