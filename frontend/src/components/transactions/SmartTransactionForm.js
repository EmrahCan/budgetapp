import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  Alert,
  Collapse,
  Stack,
  Typography,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  AutoAwesome,
  ThumbUp,
  ThumbDown,
  Info,
  Close,
  CameraAlt,
} from '@mui/icons-material';
import { debounce } from 'lodash';
import { useAI } from '../../hooks/useAI';
import AnomalyAlert from '../ai/AnomalyAlert';
import ReceiptScanner from '../ocr/ReceiptScanner';

/**
 * SmartTransactionForm - AI-powered transaction form with auto-categorization
 */
const SmartTransactionForm = ({
  formData,
  setFormData,
  categories = [],
  disabled = false,
  onCategoryAccepted,
  onCategoryRejected,
}) => {
  const { categorizeTransaction, loading, aiEnabled, preferences } = useAI();
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionFeedback, setSuggestionFeedback] = useState(null);
  const [anomalyData, setAnomalyData] = useState(null);
  const [showAnomalyAlert, setShowAnomalyAlert] = useState(false);
  const [checkingAnomaly, setCheckingAnomaly] = useState(false);
  const [showOCRScanner, setShowOCRScanner] = useState(false);

  // Check for anomalies
  const checkAnomaly = useCallback(async (amount, category, description) => {
    if (!amount || !category || !aiEnabled) {
      return;
    }

    try {
      setCheckingAnomaly(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiUrl}/ai/anomaly/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          description: description || '',
        }),
      });

      const data = await response.json();

      if (data.success && data.data.isAnomaly) {
        setAnomalyData(data.data);
        setShowAnomalyAlert(true);
      }
    } catch (error) {
      console.error('Anomaly check error:', error);
    } finally {
      setCheckingAnomaly(false);
    }
  }, [aiEnabled]);

  // Debounced function to get AI suggestion
  const getSuggestion = useCallback(
    debounce(async (description, amount) => {
      if (!description || description.length < 3 || !amount || !aiEnabled) {
        setAiSuggestion(null);
        setShowSuggestion(false);
        return;
      }

      const response = await categorizeTransaction(description, parseFloat(amount), {});

      if (response.success && response.data) {
        setAiSuggestion(response.data);
        setShowSuggestion(true);
        setSuggestionFeedback(null);
      } else {
        setAiSuggestion(null);
        setShowSuggestion(false);
      }
    }, 800),
    [categorizeTransaction, aiEnabled]
  );

  // Watch for description and amount changes
  useEffect(() => {
    if (formData.description && formData.amount) {
      getSuggestion(formData.description, formData.amount);
    } else {
      setAiSuggestion(null);
      setShowSuggestion(false);
    }
  }, [formData.description, formData.amount, getSuggestion]);

  // Auto-select category if confidence is high and auto-categorization is enabled
  useEffect(() => {
    if (
      preferences.autoCategorization &&
      aiSuggestion &&
      aiSuggestion.confidence >= preferences.categorizationThreshold &&
      !formData.category &&
      aiSuggestion.source !== 'fallback'
    ) {
      setFormData(prev => ({
        ...prev,
        category: aiSuggestion.category
      }));
    }
  }, [aiSuggestion, formData.category, setFormData, preferences]);

  // Check for anomalies when amount and category are set
  useEffect(() => {
    if (formData.amount && formData.category && parseFloat(formData.amount) > 0) {
      checkAnomaly(formData.amount, formData.category, formData.description);
    }
  }, [formData.amount, formData.category, formData.description, checkAnomaly]);

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
      setFormData(prev => ({
        ...prev,
        category: aiSuggestion.category
      }));
      setSuggestionFeedback('accepted');
      setShowSuggestion(false);
      
      if (onCategoryAccepted) {
        onCategoryAccepted(aiSuggestion);
      }
    }
  };

  const handleRejectSuggestion = () => {
    setSuggestionFeedback('rejected');
    setShowSuggestion(false);
    
    if (onCategoryRejected) {
      onCategoryRejected(aiSuggestion);
    }
  };

  const handleCloseSuggestion = () => {
    setShowSuggestion(false);
  };

  const handleAnomalyConfirm = async (transaction, isNormal) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      await fetch(`${apiUrl}/ai/anomaly/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: {
            amount: parseFloat(transaction.amount),
            category: transaction.category,
            description: transaction.description || '',
          },
          isNormal,
          userFeedback: isNormal ? 'confirmed_normal' : 'confirmed_suspicious',
        }),
      });
    } catch (error) {
      console.error('Anomaly confirmation error:', error);
    }
  };

  const handleAnomalyReject = async (transaction, isNormal) => {
    await handleAnomalyConfirm(transaction, isNormal);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 80) return 'Yüksek Güven';
    if (confidence >= 60) return 'Orta Güven';
    return 'Düşük Güven';
  };

  const handleOCRDataExtracted = (ocrData) => {
    setFormData(prev => ({
      ...prev,
      amount: ocrData.amount || prev.amount,
      date: ocrData.date || prev.date,
      description: ocrData.description || prev.description,
    }));
  };

  return (
    <Box>
      {/* OCR Scanner Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CameraAlt />}
          onClick={() => setShowOCRScanner(true)}
          fullWidth
          sx={{
            borderStyle: 'dashed',
            borderWidth: 2,
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          📷 Fiş Tara (OCR)
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Fiş fotoğrafı çekerek otomatik veri girişi yapın
        </Typography>
      </Box>

      {/* Description Field with AI Indicator */}
      <TextField
        fullWidth
        label="Açıklama"
        name="description"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        disabled={disabled}
        margin="normal"
        required
        InputProps={{
          endAdornment: loading.categorization && (
            <CircularProgress size={20} />
          ),
        }}
        helperText={aiEnabled ? "AI otomatik olarak kategori önerecek" : "AI devre dışı"}
      />

      {/* Amount Field */}
      <TextField
        fullWidth
        label="Tutar"
        name="amount"
        type="number"
        value={formData.amount || ''}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        disabled={disabled}
        margin="normal"
        required
        inputProps={{ min: 0, step: 0.01 }}
      />

      {/* AI Suggestion Alert */}
      <Collapse in={showSuggestion && aiSuggestion && !suggestionFeedback}>
        <Alert
          severity="info"
          icon={<AutoAwesome />}
          sx={{ mt: 2, mb: 1 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleCloseSuggestion}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
        >
          <Stack spacing={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" fontWeight="bold">
                AI Önerisi: {aiSuggestion?.category}
              </Typography>
              <Chip
                label={getConfidenceLabel(aiSuggestion?.confidence || 0)}
                color={getConfidenceColor(aiSuggestion?.confidence || 0)}
                size="small"
              />
              <Chip
                label={`%${aiSuggestion?.confidence || 0}`}
                size="small"
                variant="outlined"
              />
            </Box>

            {aiSuggestion?.reasoning && (
              <Typography variant="caption" color="text.secondary">
                {aiSuggestion.reasoning}
              </Typography>
            )}

            {/* Confidence Bar */}
            <Box>
              <LinearProgress
                variant="determinate"
                value={aiSuggestion?.confidence || 0}
                color={getConfidenceColor(aiSuggestion?.confidence || 0)}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Box>

            {/* Action Buttons */}
            <Box display="flex" gap={1} mt={1}>
              <Chip
                icon={<ThumbUp />}
                label="Kabul Et"
                onClick={handleAcceptSuggestion}
                color="success"
                variant="outlined"
                size="small"
                clickable
              />
              <Chip
                icon={<ThumbDown />}
                label="Reddet"
                onClick={handleRejectSuggestion}
                color="error"
                variant="outlined"
                size="small"
                clickable
              />
            </Box>

            {/* Alternative Categories */}
            {aiSuggestion?.alternativeCategories?.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Alternatifler:
                </Typography>
                <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                  {aiSuggestion.alternativeCategories.map((alt, index) => (
                    <Chip
                      key={index}
                      label={alt}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: alt }));
                        setShowSuggestion(false);
                      }}
                      clickable
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
        </Alert>
      </Collapse>

      {/* Feedback Message */}
      {suggestionFeedback === 'accepted' && (
        <Alert severity="success" sx={{ mt: 2, mb: 1 }} onClose={() => setSuggestionFeedback(null)}>
          AI önerisi kabul edildi. Gelecek öneriler daha iyi olacak!
        </Alert>
      )}

      {suggestionFeedback === 'rejected' && (
        <Alert severity="info" sx={{ mt: 2, mb: 1 }} onClose={() => setSuggestionFeedback(null)}>
          Seçiminiz kaydedildi. AI bundan öğrenecek.
        </Alert>
      )}

      {/* AI Disabled Warning */}
      {!aiEnabled && (
        <Alert severity="warning" sx={{ mt: 2, mb: 1 }}>
          AI özellikleri şu anda devre dışı
        </Alert>
      )}

      {/* Category Field */}
      <TextField
        fullWidth
        select
        label="Kategori"
        name="category"
        value={formData.category || ''}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        disabled={disabled}
        margin="normal"
        required
        helperText={
          aiSuggestion && formData.category === aiSuggestion.category
            ? '✨ AI tarafından önerildi'
            : 'Kategori seçin'
        }
      >
        {categories.map((category) => (
          <MenuItem key={category} value={category}>
            {category}
          </MenuItem>
        ))}
      </TextField>

      {/* AI Info */}
      <Box display="flex" alignItems="center" gap={0.5} mt={1}>
        <Info fontSize="small" color="action" />
        <Typography variant="caption" color="text.secondary">
          AI, açıklama ve tutara göre otomatik kategori önerir
          {checkingAnomaly && ' • Anormallik kontrolü yapılıyor...'}
        </Typography>
      </Box>

      {/* Anomaly Alert Dialog */}
      <AnomalyAlert
        open={showAnomalyAlert}
        onClose={() => setShowAnomalyAlert(false)}
        onConfirm={handleAnomalyConfirm}
        onReject={handleAnomalyReject}
        anomalyData={anomalyData}
        transaction={{
          amount: parseFloat(formData.amount) || 0,
          category: formData.category || '',
          description: formData.description || '',
        }}
      />

      {/* OCR Scanner Dialog */}
      <ReceiptScanner
        open={showOCRScanner}
        onClose={() => setShowOCRScanner(false)}
        onDataExtracted={handleOCRDataExtracted}
      />
    </Box>
  );
};

export default SmartTransactionForm;
