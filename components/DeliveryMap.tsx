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
  pickupAddress 
}: { 
  deliveryAddress: string
  pickupAddress?: string 
}) {
  const encodedAddress = encodeURIComponent(deliveryAddress)
  const mapsUrl = pickupAddress
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupAddress)}&destination=${encodedAddress}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`

  return (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex flex-col items-center justify-center p-6 space-y-4">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-700 font-semibold mb-2">Google Maps Not Configured</p>
        <p className="text-sm text-gray-600 mb-4">
          The Google Maps API key is not set. You can still navigate using the link below.
        </p>
      </div>
      <div className="bg-jeffy-yellow-light rounded-lg p-4 w-full max-w-md">
        <p className="text-sm text-gray-700 mb-2 font-medium">Delivery Address:</p>
        <p className="text-sm text-gray-900">{deliveryAddress}</p>
      </div>
      <Button
        onClick={() => window.open(mapsUrl, '_blank')}
        className="flex items-center gap-2"
      >
        <Navigation className="w-5 h-5" />
        Open in Google Maps
      </Button>
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
  }, [])

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
    return <FallbackMapView deliveryAddress={deliveryAddress} pickupAddress={pickupAddress} />
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

