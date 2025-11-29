'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, X } from 'lucide-react'
import { Card } from './Card'
import { Button } from './Button'

interface QRScannerProps {
  onScan: (orderId: string, qrCode?: string) => void // Updated to handle QR codes
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannedData, setScannedData] = useState<string | null>(null)

  const handleQRCode = (decodedText: string) => {
    // Extract order ID from QR code URL or direct QR code
    try {
      const url = new URL(decodedText)
      const orderId = url.searchParams.get('orderId')
      const qrCode = url.searchParams.get('qr')

      if (orderId) {
        if (scannerRef.current) {
          scannerRef.current.stop()
        }
        onScan(orderId, qrCode || undefined)
      } else {
        setError('Invalid QR code format')
      }
    } catch {
      // Check if it's a direct QR code from our system
      if (decodedText.startsWith('JEFFY-')) {
        if (scannerRef.current) {
          scannerRef.current.stop()
        }
        onScan('', decodedText) // Empty orderId, QR code as second param
      } else {
        setError('Invalid QR code. Please scan the receiver QR code.')
      }
    }
  }

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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md shadow-jeffy-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-jeffy-yellow-light rounded-lg">
              <QrCode className="w-6 h-6 text-jeffy-yellow-darker" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Scan QR Code</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-4 animate-fade-in shadow-sm">
            {error}
          </div>
        )}

        <div id="qr-reader" className="w-full rounded-xl overflow-hidden mb-4 border-2 border-gray-200 shadow-inner" style={{ minHeight: '300px' }} />

        {scannedData && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium mb-4 animate-fade-in shadow-sm">
            QR Code scanned! Processing...
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 font-medium bg-jeffy-yellow-light py-3 px-4 rounded-xl">
          <QrCode className="w-4 h-4 text-jeffy-yellow-darker" />
          Point camera at order QR code
        </div>
      </Card>
    </div>
  )
}

