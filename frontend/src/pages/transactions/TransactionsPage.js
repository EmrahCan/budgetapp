import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Payment,
  Receipt,
  AutoAwesome,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { useNotification } from '../../contexts/NotificationContext';
import { transactionsAPI, accountsAPI, creditCardsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';
import { debounce } from 'lodash';
import ReceiptScanner from '../../components/ocr/ReceiptScanner';

const TRANSACTION_TYPES = [
  { value: 'income', label: 'Gelir', icon: <TrendingUp />, color: 'success' },
  { value: 'expense', label: 'Gider', icon: <TrendingDown />, color: 'error' },
  { value: 'transfer', label: 'Transfer', icon: <SwapHoriz />, color: 'primary' },
  { value: 'payment', label: 'Ödeme', icon: <Payment />, color: 'warning' },
];

const TransactionsPage = () => {
  const { showSuccess, showError } = useNotification();
  
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    accountId: '',
    creditCardId: '',
    transactionDate: new Date(),
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // AI Categorization
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Receipt Scanner
  const [receiptScannerOpen, setReceiptScannerOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    accountId: '',
    creditCardId: '',
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    loadInitialData();
  }, []);
  
  // AI Categorization
  const getAISuggestion = useCallback(
    debounce(async (description, amount) => {
      if (!description || description.length < 3 || !amount) {
        setAiSuggestion(null);
        return;
      }

      try {
        setAiLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${apiUrl}/ai/categorize`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description,
            amount: parseFloat(amount),
          }),
        });

        const data = await response.json();
        if (data.success && data.data) {
          setAiSuggestion(data.data);
        }
      } catch (error) {
        console.error('AI categorization error:', error);
      } finally {
        setAiLoading(false);
      }
    }, 800),
    []
  );
  
  const handleAcceptAISuggestion = () => {
    if (aiSuggestion) {
      setFormData(prev => ({ ...prev, category: aiSuggestion.category }));
      setAiSuggestion(null);
    }
  };
  
  const handleRejectAISuggestion = () => {
    setAiSuggestion(null);
  };

  // Handle OCR extracted data
  const handleOCRDataExtracted = (ocrData) => {
    setFormData(prev => ({
      ...prev,
      amount: ocrData.amount || prev.amount,
      description: ocrData.description || prev.description,
      transactionDate: ocrData.date ? new Date(ocrData.date.split('.').reverse().join('-')) : prev.transactionDate
    }));
    
    // Trigger AI suggestion if we have description and amount
    if (ocrData.description && ocrData.amount) {
      getAISuggestion(ocrData.description, ocrData.amount);
    }
    
    showSuccess('Fiş bilgileri forma aktarıldı!');
  };

  useEffect(() => {
    loadTransactions();
  }, [currentPage, filters]);

  const loadInitialData = async () => {
    try {
      const [accountsRes, creditCardsRes, categoriesRes] = await Promise.all([
        accountsAPI.getAll(),
        creditCardsAPI.getAll(),
        transactionsAPI.getCategories(),
      ]);

      setAccounts(accountsRes.data.data.accounts);
      setCreditCards(creditCardsRes.data.data.creditCards);
      setCategories(categoriesRes.data.data.categories);
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...filters,
        startDate: filters.startDate ? filters.startDate.toISOString().split('T')[0] : undefined,
        endDate: filters.endDate ? filters.endDate.toISOString().split('T')[0] : undefined,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await transactionsAPI.getAll(params);
      setTransactions(response.data.data.transactions);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (transaction = null) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description || '',
        category: transaction.category || '',
        accountId: transaction.accountId || '',
        creditCardId: transaction.creditCardId || '',
        transactionDate: new Date(transaction.transactionDate),
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        accountId: '',
        creditCardId: '',
        transactionDate: new Date(),
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
    setFormErrors({});
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear account/credit card when type changes
    if (field === 'type') {
      setFormData(prev => ({ ...prev, accountId: '', creditCardId: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Geçerli bir tutar giriniz';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Açıklama gereklidir';
    }

    if (!formData.accountId && !formData.creditCardId) {
      errors.account = 'Hesap veya kredi kartı seçiniz';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      const transactionData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category: formData.category.trim() || null,
        accountId: formData.accountId || null,
        creditCardId: formData.creditCardId || null,
        transactionDate: formData.transactionDate.toISOString().split('T')[0],
      };

      if (editingTransaction) {
        await transactionsAPI.update(editingTransaction.id, transactionData);
        showSuccess('İşlem başarıyla güncellendi');
      } else {
        await transactionsAPI.create(transactionData);
        showSuccess('İşlem başarıyla oluşturuldu');
      }

      handleCloseDialog();
      loadTransactions();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (window.confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      try {
        await transactionsAPI.delete(transaction.id);
        showSuccess('İşlem başarıyla silindi');
        loadTransactions();
      } catch (error) {
        showError(handleApiError(error));
      }
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      accountId: '',
      creditCardId: '',
      startDate: null,
      endDate: null,
    });
    setCurrentPage(1);
  };

  const getTransactionTypeInfo = (type) => {
    return TRANSACTION_TYPES.find(t => t.value === type) || TRANSACTION_TYPES[1];
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'Bilinmeyen Hesap';
  };

  const getCreditCardName = (creditCardId) => {
    const card = creditCards.find(c => c.id === creditCardId);
    return card ? card.name : 'Bilinmeyen Kart';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                İşlemlerim
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Gelir, gider ve transfer işlemlerinizi yönetin
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              size="large"
            >
              İşlem Ekle
            </Button>
          </Box>

          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filtreler
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Ara"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Tür</InputLabel>
                    <Select
                      value={filters.type}
                      label="Tür"
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                      <MenuItem value="">Tümü</MenuItem>
                      {TRANSACTION_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      value={filters.category}
                      label="Kategori"
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <MenuItem value="">Tümü</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.name} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="Başlangıç"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="Bitiş"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    startIcon={<FilterList />}
                  >
                    Temizle
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tür</TableCell>
                    <TableCell>Açıklama</TableCell>
                    <TableCell>Kategori</TableCell>
                    <TableCell>Hesap/Kart</TableCell>
                    <TableCell>Tutar</TableCell>
                    <TableCell>Tarih</TableCell>
                    <TableCell align="center">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : transactions.length > 0 ? (
                    transactions.map((transaction) => {
                      const typeInfo = getTransactionTypeInfo(transaction.type);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Chip
                              icon={typeInfo.icon}
                              label={typeInfo.label}
                              color={typeInfo.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            {transaction.category && (
                              <Chip label={transaction.category} size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.accountId 
                              ? getAccountName(transaction.accountId)
                              : getCreditCardName(transaction.creditCardId)
                            }
                          </TableCell>
                          <TableCell>
                            <Typography
                              color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(transaction)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTransaction(transaction)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box sx={{ py: 4 }}>
                          <Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="textSecondary">
                            İşlem bulunamadı
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(e, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </Card>

          {/* Transaction Form Dialog */}
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingTransaction ? 'İşlem Düzenle' : 'Yeni İşlem Ekle'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>İşlem Türü</InputLabel>
                  <Select
                    value={formData.type}
                    label="İşlem Türü"
                    onChange={(e) => handleFormChange('type', e.target.value)}
                  >
                    {TRANSACTION_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {type.icon}
                          {type.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Tutar"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, amount: value }));
                    setFormErrors(prev => ({ ...prev, amount: '' }));
                    getAISuggestion(formData.description, value);
                  }}
                  error={!!formErrors.amount}
                  helperText={formErrors.amount}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Receipt />}
                          onClick={() => setReceiptScannerOpen(true)}
                          sx={{ minWidth: 'auto', px: 1 }}
                        >
                          📷 Fiş Tara
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Açıklama"
                  value={formData.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, description: value }));
                    setFormErrors(prev => ({ ...prev, description: '' }));
                    getAISuggestion(value, formData.amount);
                  }}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Kategori"
                  value={formData.category}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, category: e.target.value }));
                    setFormErrors(prev => ({ ...prev, category: '' }));
                  }}
                  sx={{ mb: 3 }}
                  InputProps={{
                    endAdornment: aiLoading && (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
                
                {aiSuggestion && (
                  <Alert 
                    severity="info" 
                    sx={{ mb: 3 }}
                    icon={<AutoAwesome />}
                    action={
                      <Box>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={handleAcceptAISuggestion}
                          title="Kabul Et"
                        >
                          <ThumbUp fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={handleRejectAISuggestion}
                          title="Reddet"
                        >
                          <ThumbDown fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <Typography variant="body2" fontWeight="bold">
                      AI Önerisi: {aiSuggestion.category}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Güven: %{aiSuggestion.confidence} - {aiSuggestion.reasoning}
                    </Typography>
                  </Alert>
                )}

                {formData.type !== 'payment' ? (
                  <FormControl fullWidth sx={{ mb: 3 }} error={!!formErrors.account}>
                    <InputLabel>Hesap</InputLabel>
                    <Select
                      value={formData.accountId}
                      label="Hesap"
                      onChange={(e) => handleFormChange('accountId', e.target.value)}
                    >
                      {accounts.map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.balance)})
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.account && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                        {formErrors.account}
                      </Typography>
                    )}
                  </FormControl>
                ) : (
                  <FormControl fullWidth sx={{ mb: 3 }} error={!!formErrors.account}>
                    <InputLabel>Kredi Kartı</InputLabel>
                    <Select
                      value={formData.creditCardId}
                      label="Kredi Kartı"
                      onChange={(e) => handleFormChange('creditCardId', e.target.value)}
                    >
                      {creditCards.map((card) => (
                        <MenuItem key={card.id} value={card.id}>
                          {card.name} ({formatCurrency(card.currentBalance)} borç)
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.account && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                        {formErrors.account}
                      </Typography>
                    )}
                  </FormControl>
                )}

                <DatePicker
                  label="İşlem Tarihi"
                  value={formData.transactionDate}
                  onChange={(date) => handleFormChange('transactionDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>İptal</Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={submitting}
              >
                {submitting ? 'Kaydediliyor...' : (editingTransaction ? 'Güncelle' : 'Oluştur')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Receipt Scanner */}
          <ReceiptScanner
            open={receiptScannerOpen}
            onClose={() => setReceiptScannerOpen(false)}
            onDataExtracted={handleOCRDataExtracted}
          />
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default TransactionsPage;