import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  LinearProgress
} from '@mui/material';
import {
  CameraAlt,
  Upload,
  Close,
  CheckCircle,
  Error as ErrorIcon,
  Refresh
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';
import './ReceiptScanner.css';

const STEPS = ['Fotoğraf', 'Önizleme', 'Tarama', 'Sonuç'];

const ReceiptScanner = ({ open, onClose, onDataExtracted }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);
  const [error, setError] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const { showSuccess, showError } = useNotification();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      resetState();
    } else {
      stopCamera();
    }
  }, [open]);

  const resetState = () => {
    setActiveStep(0);
    setCapturedImage(null);
    setIsProcessing(false);
    setOcrResults(null);
    setError(null);
    setProcessingProgress(0);
    setShowCamera(false);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setShowCamera(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      showError('Kamera erişimi reddedildi');
      setError('Kamera açılamadı. Lütfen tarayıcı izinlerini kontrol edin.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      setActiveStep(1);
      stopCamera();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Dosya boyutu çok büyük (max 5MB)');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        setActiveStep(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageConfirmed = async () => {
    if (!capturedImage) return;
    
    setActiveStep(2);
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      // Call OCR API
      const response = await api.post('/ocr/process', {
        imageData: capturedImage
      });
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      if (response.data.success) {
        setOcrResults(response.data.data);
        setActiveStep(3);
        showSuccess('Fiş başarıyla tarandı!');
      } else {
        throw new Error(response.data.message || 'OCR işlemi başarısız');
      }
      
    } catch (error) {
      console.error('OCR Error:', error);
      setError(error.response?.data?.message || error.message || 'Fiş taranırken bir hata oluştu');
      showError('Fiş taranamadı');
      setActiveStep(1); // Go back to preview
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setActiveStep(0);
    setError(null);
  };

  const handleResultsConfirmed = () => {
    if (ocrResults) {
      onDataExtracted({
        amount: ocrResults.total_amount,
        date: ocrResults.date,
        description: ocrResults.merchant_name || '',
        isFromOCR: true
      });
      onClose();
      showSuccess('Fiş bilgileri forma aktarıldı!');
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    stopCamera();
    resetState();
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Method selection
        return (
          <Box className="receipt-scanner-step">
            <Typography variant="h6" gutterBottom align="center">
              Fiş nasıl taranacak?
            </Typography>
            
            {!showCamera ? (
              <Box className="method-selection">
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<CameraAlt />}
                  onClick={startCamera}
                  className="method-button"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  📷 Kamera ile Çek
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Upload />}
                  onClick={() => fileInputRef.current?.click()}
                  className="method-button"
                  fullWidth
                >
                  📁 Dosyadan Seç
                </Button>
              </Box>
            ) : (
              <Box className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={stopCamera}
                    fullWidth
                  >
                    İptal
                  </Button>
                  <Button
                    variant="contained"
                    onClick={capturePhoto}
                    startIcon={<CameraAlt />}
                    fullWidth
                  >
                    Fotoğraf Çek
                  </Button>
                </Box>
              </Box>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              💡 <strong>İpucu:</strong> Fişi düz tutun ve toplam tutarın net görünür olduğundan emin olun.
            </Alert>
          </Box>
        );
        
      case 1: // Image preview
        return (
          <Box className="receipt-scanner-step">
            <Typography variant="h6" gutterBottom align="center">
              Fotoğraf Önizleme
            </Typography>
            
            {capturedImage && (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={capturedImage}
                  alt="Receipt preview"
                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                />
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRetake}
                    fullWidth
                  >
                    Tekrar Çek
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={handleImageConfirmed}
                    fullWidth
                  >
                    Kullan ve Tara
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        );
        
      case 2: // Processing
        return (
          <Box className="receipt-scanner-step processing-step">
            <Typography variant="h6" gutterBottom align="center">
              🔍 Fiş Taranıyor...
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress size={60} />
            </Box>
            
            <LinearProgress variant="determinate" value={processingProgress} sx={{ mb: 2 }} />
            
            <Typography variant="body2" align="center" color="text.secondary">
              Fiş bilgileri okunuyor... %{processingProgress}
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Bu işlem 5-10 saniye sürebilir
            </Alert>
          </Box>
        );
        
      case 3: // Results
        return (
          <Box className="receipt-scanner-step">
            <Typography variant="h6" gutterBottom align="center">
              ✅ Tarama Tamamlandı
            </Typography>
            
            {ocrResults && (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Fiş bilgileri başarıyla okundu!
                </Alert>
                
                <Box className="ocr-results">
                  <Box className="result-item">
                    <Typography variant="body2" color="text.secondary">
                      💰 Toplam Tutar
                    </Typography>
                    <Typography variant="h6">
                      {ocrResults.total_amount ? `${ocrResults.total_amount.toFixed(2)} ₺` : 'Bulunamadı'}
                    </Typography>
                  </Box>
                  
                  <Box className="result-item">
                    <Typography variant="body2" color="text.secondary">
                      📅 Tarih
                    </Typography>
                    <Typography variant="h6">
                      {ocrResults.date || 'Bulunamadı'}
                    </Typography>
                  </Box>
                  
                  <Box className="result-item">
                    <Typography variant="body2" color="text.secondary">
                      🏪 Mağaza
                    </Typography>
                    <Typography variant="h6">
                      {ocrResults.merchant_name || 'Bulunamadı'}
                    </Typography>
                  </Box>
                  
                  <Box className="result-item">
                    <Typography variant="body2" color="text.secondary">
                      📊 Güven Skoru
                    </Typography>
                    <Chip
                      label={`%${ocrResults.confidence_score || 0}`}
                      color={ocrResults.confidence_score >= 70 ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  ℹ️ Bilgileri sonra düzenleyebilirsiniz
                </Alert>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleRetake}
                    fullWidth
                  >
                    ❌ İptal
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleResultsConfirmed}
                    startIcon={<CheckCircle />}
                    fullWidth
                  >
                    ✅ Onayla ve Doldur
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="receipt-scanner-dialog"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">📷 Fiş Tara</Typography>
          <IconButton onClick={handleClose} disabled={isProcessing}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptScanner;
