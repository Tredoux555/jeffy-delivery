'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, X } from 'lucide-react'
import { Card } from './Card'
import { Button } from './Button'

interface QRScannerProps {
  onScan: (orderId: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannedData, setScannedData] = useState<string | null>(null)

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // QR code scanned successfully
            setScannedData(decodedText)
            handleQRCode(decodedText)
          },
          (errorMessage) => {
            // Ignore scanning errors
          }
        )

        setIsScanning(true)
      } catch (err) {
        console.error('Scanner error:', err)
        setError('Failed to start camera. Please check permissions.')
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const handleQRCode = (decodedText: string) => {
    // Extract order ID from QR code URL
    // QR code format: https://jeffy.co.za/admin/orders?orderId=ORDER_ID
    try {
      const url = new URL(decodedText)
      const orderId = url.searchParams.get('orderId')
      
      if (orderId) {
        if (scannerRef.current) {
          scannerRef.current.stop()
        }
        onScan(orderId)
      } else {
        setError('Invalid QR code format')
      }
    } catch {
      // Try direct order ID
      if (decodedText.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        if (scannerRef.current) {
          scannerRef.current.stop()
        }
        onScan(decodedText)
      } else {
        setError('Invalid QR code. Please scan the order QR code.')
      }
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        setIsScanning(false)
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  const handleClose = async () => {
    await stopScanner()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <div id="qr-reader" className="w-full rounded-lg overflow-hidden mb-4" style={{ minHeight: '300px' }} />

        {scannedData && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
            QR Code scanned! Processing...
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <QrCode className="w-4 h-4" />
          Point camera at order QR code
        </div>
      </Card>
    </div>
  )
}

