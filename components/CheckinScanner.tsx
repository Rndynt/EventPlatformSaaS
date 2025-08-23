'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/client/src/components/ui/button';
import { Input } from '@/client/src/components/ui/input';
import { Card, CardContent } from '@/client/src/components/ui/card';
import { Badge } from '@/client/src/components/ui/badge';

interface CheckinScannerProps {
  onScan: (token: string) => void;
}

export function CheckinScanner({ onScan }: CheckinScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);

        // Start scanning for QR codes
        videoRef.current.onloadedmetadata = () => {
          scanIntervalRef.current = setInterval(scanFrame, 100);
        };
      }
    } catch (err) {
      setError('Camera access denied or not available. Please use manual input.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsScanning(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // In a real implementation, you would use a QR code library like jsQR here
    // For this example, we'll simulate QR code detection
    const qrResult = simulateQRDetection(imageData);
    
    if (qrResult && qrResult !== lastScan) {
      setLastScan(qrResult);
      onScan(qrResult);
      
      // Brief pause after successful scan
      setTimeout(() => {
        setLastScan(null);
      }, 2000);
    }
  };

  // Simulate QR code detection for demo purposes
  const simulateQRDetection = (imageData: ImageData): string | null => {
    // In a real implementation, use jsQR or similar library:
    // import jsQR from 'jsqr';
    // const code = jsQR(imageData.data, imageData.width, imageData.height);
    // return code ? code.data : null;
    
    // For demo, we'll return null (no QR detected)
    return null;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qrResult = simulateQRDetection(imageData);
        
        if (qrResult) {
          onScan(qrResult);
        } else {
          setError('No QR code found in the uploaded image.');
        }
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Camera Controls */}
      <div className="flex gap-2">
        {!isScanning ? (
          <Button
            onClick={startCamera}
            className="flex-1"
            data-testid="button-start-camera"
          >
            <Camera className="mr-2" size={16} />
            Start Camera
          </Button>
        ) : (
          <Button
            onClick={stopCamera}
            variant="outline"
            className="flex-1"
            data-testid="button-stop-camera"
          >
            Stop Camera
          </Button>
        )}
        
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
            data-testid="input-file-upload"
          />
          <Button variant="outline" data-testid="button-upload-image">
            <Upload size={16} />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="mr-2 flex-shrink-0" size={16} />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera View */}
      {isScanning && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover rounded-lg bg-gray-900"
                data-testid="video-camera"
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">
                    Position QR code here
                  </div>
                </div>
              </div>

              {/* Success Indicator */}
              {lastScan && (
                <div className="absolute top-4 left-4 right-4">
                  <Badge className="bg-green-500 text-white">
                    QR Code Detected!
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden canvas for image processing */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
        data-testid="canvas-processing"
      />

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">How to scan:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click "Start Camera" to activate QR scanning</li>
            <li>• Position the QR code within the scanning area</li>
            <li>• Or upload an image containing a QR code</li>
            <li>• The system will automatically detect and process tickets</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
