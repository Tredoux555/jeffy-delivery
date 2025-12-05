'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { createClient } from '@/lib/supabase'
import {
  MapPin,
  Navigation,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Target,
  Compass
} from 'lucide-react'

interface LocationSharingProps {
  notificationId: string
  onLocationEnabled: (coords: { lat: number; lng: number }) => void
}

export function LocationSharing({ notificationId, onLocationEnabled }: LocationSharingProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'tracking' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup: stop watching location on unmount
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMessage('Geolocation is not supported by your browser')
      return
    }

    setStatus('requesting')

    // First get current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setCurrentLocation(coords)
        setAccuracy(position.coords.accuracy)
        setStatus('tracking')
        onLocationEnabled(coords)
        
        // Update notification with GPS location
        updateNotificationLocation(coords)

        // Start watching for continuous updates
        const id = navigator.geolocation.watchPosition(
          handlePositionUpdate,
          handlePositionError,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
          }
        )
        setWatchId(id)
      },
      (error) => {
        handlePositionError(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handlePositionUpdate = (position: GeolocationPosition) => {
    const coords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }
    setCurrentLocation(coords)
    setAccuracy(position.coords.accuracy)
    updateNotificationLocation(coords)
  }

  const handlePositionError = (error: GeolocationPositionError) => {
    setStatus('error')
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setErrorMessage('Location permission denied. Please enable location access in your browser settings.')
        break
      case error.POSITION_UNAVAILABLE:
        setErrorMessage('Location information is unavailable. Please try again.')
        break
      case error.TIMEOUT:
        setErrorMessage('Location request timed out. Please try again.')
        break
      default:
        setErrorMessage('An unknown error occurred while getting your location.')
    }
  }

  const updateNotificationLocation = async (coords: { lat: number; lng: number }) => {
    try {
      const supabase = createClient()
      
      // Update the delivery notification with receiver's live location
      await supabase
        .from('delivery_notifications')
        .update({
          status: 'gps_active',
          gps_activated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
    } catch (error) {
      console.error('Error updating notification:', error)
    }
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setStatus('idle')
    setCurrentLocation(null)
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${
          status === 'tracking' ? 'bg-green-100' :
          status === 'error' ? 'bg-red-100' :
          'bg-blue-100'
        }`}>
          {status === 'tracking' ? (
            <Navigation className="w-6 h-6 text-green-600 animate-pulse" />
          ) : status === 'error' ? (
            <AlertCircle className="w-6 h-6 text-red-600" />
          ) : status === 'requesting' ? (
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          ) : (
            <MapPin className="w-6 h-6 text-blue-600" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">
            {status === 'tracking' ? 'Location Sharing Active' :
             status === 'error' ? 'Location Error' :
             status === 'requesting' ? 'Getting Your Location...' :
             'Share Your Location'}
          </h3>
          
          {status === 'idle' && (
            <p className="text-sm text-gray-600 mb-4">
              Share your live location so the driver can find you easily, even if you're not at your delivery address.
            </p>
          )}

          {status === 'tracking' && currentLocation && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Your location is being shared with the driver</span>
              </div>
              {accuracy && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Target className="w-3 h-3" />
                  <span>Accuracy: ±{Math.round(accuracy)}m</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Compass className="w-3 h-3" />
                <span>
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {status === 'idle' && (
              <Button onClick={requestLocation} size="sm">
                <Navigation className="w-4 h-4 mr-1" />
                Enable Location
              </Button>
            )}

            {status === 'requesting' && (
              <Button disabled size="sm">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Getting Location...
              </Button>
            )}

            {status === 'tracking' && (
              <Button onClick={stopTracking} variant="outline" size="sm">
                Stop Sharing
              </Button>
            )}

            {status === 'error' && (
              <Button onClick={requestLocation} size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

