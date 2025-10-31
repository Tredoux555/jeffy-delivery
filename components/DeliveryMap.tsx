'use client'

import React, { useCallback, useEffect } from 'react'
import { GoogleMap, LoadScript, DirectionsRenderer } from '@react-google-maps/api'

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

export function DeliveryMap({
  pickupAddress,
  deliveryAddress,
  pickupCoords,
  deliveryCoords,
}: DeliveryMapProps) {
  const [directions, setDirections] = React.useState<google.maps.DirectionsResult | null>(null)
  const [mapError, setMapError] = React.useState<string | null>(null)
  const [isLoaded, setIsLoaded] = React.useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const onLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!apiKey || !isLoaded) {
      if (!apiKey) {
        setMapError('Google Maps API key not configured')
      }
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

    if (isLoaded) {
      setTimeout(calculateRoute, 500)
    }
  }, [pickupAddress, deliveryAddress, pickupCoords, deliveryCoords, apiKey, isLoaded])

  if (!apiKey) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Google Maps API key not configured</p>
      </div>
    )
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} onLoad={onLoad}>
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
      </div>
    </LoadScript>
  )
}

