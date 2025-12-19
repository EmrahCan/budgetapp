import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Container,
} from '@mui/material';
import {
  CameraAlt,
  Upload,
  CheckCircle,
} from '@mui/icons-material';

const STEPS = ['Yöntem Seç', 'Fotoğraf Çek/Seç', 'Sonuçları Gör'];

const OCRPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      setError('Kamera erişimi reddedildi veya mevcut değil');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      processImage(blob);
    }, 'image/jpeg', 0.8);
    
    stopCamera();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = async (imageFile) => {
    setIsProcessing(true);
    setActiveStep(2);
    
    try {
      const formData = new FormData();
      formData.append('receiptImage', imageFile);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ocr/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data || { message: 'OCR işlemi başarılı!' });
      } else {
        setError(data.message || 'OCR işlemi başarısız');
      }
    } catch (err) {
      setError('Bağlantı hatası: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setShowCamera(false);
    setResults(null);
    setError(null);
    stopCamera();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Method selection
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Fiş nasıl taranacak?
            </Typography>
            
            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300, mx: 'auto' }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<CameraAlt />}
                onClick={startCamera}
                fullWidth
              >
                📷 Kamera ile Çek
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<Upload />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
              >
                📁 Dosyadan Seç
              </Button>
            </Box>
          </Box>
        );
        
      case 1: // Camera/File selection
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {showCamera ? (
              <Box>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button variant="outlined" onClick={handleReset} fullWidth>
                    İptal
                  </Button>
                  <Button variant="contained" onClick={capturePhoto} fullWidth>
                    📷 Çek
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography>Dosya seçiliyor...</Typography>
            )}
          </Box>
        );
        
      case 2: // Results
        return (
          <Box sx={{ py: 2 }}>
            {isProcessing ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={60} />
                <Typography sx={{ mt: 2 }}>Fiş işleniyor...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : results ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Fiş başarıyla işlendi!
                </Alert>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <pre>{JSON.stringify(results, null, 2)}</pre>
                </Paper>
              </Box>
            ) : null}
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={handleReset} fullWidth>
                Yeni Fiş Tara
              </Button>
              {results && (
                <Button 
                  variant="contained" 
                  startIcon={<CheckCircle />}
                  fullWidth
                >
                  ✅ Onayla
                </Button>
              )}
            </Box>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          📷 Fiş Okuma (OCR)
        </Typography>
        
        <Paper sx={{ p: 3, mt: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {renderStepContent()}
        </Paper>
        
        {/* Hidden elements */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Box>
    </Container>
  );
};

export default OCRPage;