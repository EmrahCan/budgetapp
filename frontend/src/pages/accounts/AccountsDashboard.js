import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  AccountBalance,
  Edit,
  Delete,
  TrendingUp,
  TrendingDown,
  Savings,
  AccountBalanceWallet,
  CreditCard as CreditCardIcon,
  SwapHoriz,
  Timeline,
  Assessment,
  Visibility,
  MoreVert,
  FilterList,
  Sort,
} from '@mui/icons-material';

import { useNotification } from '../../contexts/NotificationContext';
import { accountsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';
import { turkishBanks, getBankById, popularBanks, searchBanks, bankTypes } from '../../data/turkishBanks';

// Account summary component
const AccountSummaryCard = ({ accounts }) => {
  const getTotalBalance = () => accounts.reduce((total, account) => total + account.balance, 0);
  const getAccountCount = () => accounts.length;
  const getActiveAccountCount = () => accounts.filter(acc => acc.isActive).length;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Hesap Özeti
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {formatCurrency(getTotalBalance())}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Toplam Bakiye
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {getActiveAccountCount()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Aktif Hesap Sayısı
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Account list component
const AccountsList = ({ accounts, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'balance', 'type', 'bank'
  const [filterType, setFilterType] = useState('all'); // 'all', 'checking', 'savings', etc.

  const getAccountTypeInfo = (type) => {
    const types = {
      checking: { label: 'Vadesiz Hesap', icon: <AccountBalance />, color: 'primary' },
      savings: { label: 'Vadeli Hesap', icon: <Savings />, color: 'success' },
      cash: { label: 'Nakit', icon: <AccountBalanceWallet />, color: 'warning' },
      investment: { label: 'Yatırım Hesabı', icon: <TrendingUp />, color: 'info' },
      overdraft: { label: 'Esnek Hesap', icon: <CreditCardIcon />, color: 'error' },
    };
    return types[type] || types.checking;
  };

  const handleMenuClick = (event, account) => {
    setAnchorEl(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAccount(null);
  };

  const sortedAndFilteredAccounts = accounts
    .filter(account => filterType === 'all' || account.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return b.balance - a.balance;
        case 'type':
          return a.type.localeCompare(b.type);
        case 'bank':
          return (a.bankName || '').localeCompare(b.bankName || '');
        default:
          return a.name.localeCompare(b.name);
      }
    });

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Hesaplarım ({sortedAndFilteredAccounts.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" startIcon={<FilterList />} variant="outlined">
              Filtrele
            </Button>
            <Button size="small" startIcon={<Sort />} variant="outlined">
              Sırala
            </Button>
          </Box>
        </Box>
        
        <List>
          {sortedAndFilteredAccounts.map((account, index) => {
            const typeInfo = getAccountTypeInfo(account.type);
            return (
              <React.Fragment key={account.id}>
                <ListItem
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: account.bankId ? getBankById(account.bankId)?.color || 'primary.main' : `${typeInfo.color}.main`,
                        width: 48,
                        height: 48
                      }}
                    >
                      {account.bankId && getBankById(account.bankId)?.name 
                        ? getBankById(account.bankId).name.charAt(0) 
                        : typeInfo.icon}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {account.name}
                        </Typography>
                        {!account.isActive && <Chip label="Pasif" color="error" size="small" />}
                        {account.isLowBalance && <Chip label="Düşük" color="warning" size="small" />}
                        {account.isOverdrawn && <Chip label="Eksi" color="error" size="small" />}
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography variant="body2" color="textSecondary" component="span" display="block">
                          {account.bankName ? `${account.bankName} • ${typeInfo.label}` : typeInfo.label}
                        </Typography>
                        {account.accountNumber && (
                          <Typography variant="caption" color="textSecondary" component="span" display="block">
                            Hesap No: {account.accountNumber}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                  
                  <Box sx={{ textAlign: 'right', mr: 2 }}>
                    <Typography 
                      variant="h6" 
                      color={account.balance >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {formatCurrency(account.balance)}
                    </Typography>
                    {account.type === 'overdraft' && account.overdraftLimit && (
                      <Typography variant="caption" color="textSecondary">
                        Limit: {formatCurrency(account.overdraftLimit)}
                      </Typography>
                    )}
                  </Box>
                  
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={(e) => handleMenuClick(e, account)}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < sortedAndFilteredAccounts.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onEdit && onEdit(selectedAccount); handleMenuClose(); }}>
            <Edit sx={{ mr: 1 }} /> Düzenle
          </MenuItem>
          <MenuItem onClick={() => { /* Handle view details */ handleMenuClose(); }}>
            <Visibility sx={{ mr: 1 }} /> Detayları Görüntüle
          </MenuItem>
          <MenuItem onClick={() => { /* Handle transfer */ handleMenuClose(); }}>
            <SwapHoriz sx={{ mr: 1 }} /> Transfer Yap
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => { onDelete && onDelete(selectedAccount?.id); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1 }} /> Sil
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

// Quick stats component
const QuickStats = ({ accounts }) => {
  const getStats = () => {
    const activeAccounts = accounts.filter(acc => acc.isActive !== false);
    const lowBalanceAccounts = accounts.filter(acc => acc.isLowBalance);
    const overdraftAccounts = accounts.filter(acc => acc.type === 'overdraft');
    const savingsAccounts = accounts.filter(acc => acc.type === 'savings');
    
    return {
      total: accounts.length,
      active: activeAccounts.length,
      lowBalance: lowBalanceAccounts.length,
      overdrafts: overdraftAccounts.length,
      savings: savingsAccounts.length
    };
  };

  const stats = getStats();

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary.main">
            {stats.total}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Toplam Hesap
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">
            {stats.active}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Aktif Hesap
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="warning.main">
            {stats.lowBalance}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Düşük Bakiye
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="error.main">
            {stats.overdrafts}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Esnek Hesap
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="info.main">
            {stats.savings}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Tasarruf
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

const AccountsDashboard = () => {
  const { showError, showSuccess } = useNotification();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bankId: '',
    bankName: '',
    accountType: 'checking',
    currentBalance: '',
    accountNumber: '',
    // Flexible account fields
    isFlexible: false,
    accountLimit: '',
    currentDebt: '0',
    interestRate: '',
    minimumPaymentRate: '5',
    paymentDueDate: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountsAPI.getAll();
      // Filter out overdraft accounts - they have their own page
      const filteredAccounts = response.data.data.accounts.filter(acc => acc.type !== 'overdraft');
      setAccounts(filteredAccounts);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        bankId: account.bankId || '',
        bankName: account.bankName || '',
        accountType: account.accountType || 'checking',
        currentBalance: account.currentBalance?.toString() || '',
        accountNumber: account.accountNumber || '',
        // Flexible account fields
        isFlexible: account.isFlexible || false,
        accountLimit: account.accountLimit?.toString() || '',
        currentDebt: account.currentDebt?.toString() || '0',
        interestRate: account.interestRate?.toString() || '',
        minimumPaymentRate: account.minimumPaymentRate?.toString() || '5',
        paymentDueDate: account.paymentDueDate?.toString() || '',
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        bankId: '',
        bankName: '',
        accountType: 'checking',
        currentBalance: '',
        accountNumber: '',
        // Flexible account fields
        isFlexible: false,
        accountLimit: '',
        currentDebt: '0',
        interestRate: '',
        minimumPaymentRate: '5',
        paymentDueDate: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setFormErrors({});
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Hesap adı gereklidir';
    }
    if (isNaN(parseFloat(formData.currentBalance))) {
      errors.currentBalance = 'Geçerli bir bakiye giriniz';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const accountData = {
        name: formData.name.trim(),
        bankId: formData.bankId || null,
        bankName: formData.bankName.trim() || null,
        type: formData.accountType,
        balance: parseFloat(formData.currentBalance),
        accountNumber: formData.accountNumber.trim() || null,
        // Flexible account fields
        isFlexible: formData.isFlexible,
        accountLimit: formData.isFlexible && formData.accountLimit ? parseFloat(formData.accountLimit) : null,
        currentDebt: formData.isFlexible ? parseFloat(formData.currentDebt) : 0,
        interestRate: formData.isFlexible && formData.interestRate ? parseFloat(formData.interestRate) : null,
        minimumPaymentRate: formData.isFlexible ? parseFloat(formData.minimumPaymentRate) : 5,
        paymentDueDate: formData.isFlexible && formData.paymentDueDate ? parseInt(formData.paymentDueDate) : null,
      };
      if (editingAccount) {
        await accountsAPI.update(editingAccount.id, accountData);
        showSuccess('Hesap başarıyla güncellendi');
      } else {
        await accountsAPI.create(accountData);
        showSuccess('Hesap başarıyla oluşturuldu');
      }
      handleCloseDialog();
      loadAccounts();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account) => {
    handleOpenDialog(account);
  };

  const handleDelete = async (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    if (account && window.confirm(`"${account.name}" hesabını silmek istediğinizden emin misiniz?`)) {
      try {
        await accountsAPI.delete(accountId);
        showSuccess('Hesap başarıyla silindi');
        loadAccounts();
      } catch (error) {
        showError(handleApiError(error));
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Hesaplarım
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Banka hesaplarınızı ve nakit durumunuzu yönetin
            </Typography>
          </Box>
        </Box>

        {/* Summary Card */}
        <AccountSummaryCard accounts={accounts} />

        {/* Quick Stats */}
        <QuickStats accounts={accounts} />

        {/* Accounts List */}
        <AccountsList 
          accounts={accounts} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add account"
          onClick={() => handleOpenDialog()}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <Add />
        </Fab>

        {/* Account Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingAccount ? 'Hesap Düzenle' : 'Yeni Hesap Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* Banka Seçimi */}
              <Autocomplete
                options={turkishBanks}
                getOptionLabel={(option) => option.name}
                groupBy={(option) => bankTypes[option.type]}
                value={getBankById(formData.bankId) || null}
                onChange={(_, newValue) => {
                  handleFormChange('bankId', newValue?.id || '');
                  handleFormChange('bankName', newValue?.name || '');
                  if (newValue && !formData.name) {
                    handleFormChange('name', `${newValue.name} Hesabı`);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Banka Seçin"
                    error={!!formErrors.bankId}
                    helperText={formErrors.bankId || 'Hesabınızın bankasını seçin'}
                  />
                )}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) {
                    const popular = popularBanks.map(id => getBankById(id)).filter(Boolean).slice(0, 6);
                    const others = options.filter(bank => !popular.find(p => p && p.id === bank.id));
                    return [...popular, ...others];
                  }
                  return searchBanks(inputValue);
                }}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Hesap Adı"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                placeholder="Örn: Ziraat Bankası Vadesiz Hesap"
                sx={{ mb: 3 }}
              />
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    select
                    label="Hesap Türü"
                    value={formData.accountType}
                    onChange={(e) => handleFormChange('accountType', e.target.value)}
                  >
                    <MenuItem value="checking">Vadesiz Hesap</MenuItem>
                    <MenuItem value="savings">Vadeli Hesap</MenuItem>
                    <MenuItem value="cash">Nakit</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Mevcut Bakiye"
                    type="number"
                    value={formData.currentBalance}
                    onChange={(e) => handleFormChange('currentBalance', e.target.value)}
                    error={!!formErrors.currentBalance}
                    helperText={formErrors.currentBalance}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    }}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Hesap Numarası"
                value={formData.accountNumber}
                onChange={(e) => handleFormChange('accountNumber', e.target.value)}
                helperText="Opsiyonel"
                sx={{ mb: 3 }}
              />

              {/* Esnek Hesap Checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isFlexible}
                    onChange={(e) => handleFormChange('isFlexible', e.target.checked)}
                  />
                }
                label="Esnek Hesap (Kredili Mevduat)"
                sx={{ mb: 2 }}
              />

              {/* Flexible Account Fields */}
              {formData.isFlexible && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Esnek Hesap Özellikleri
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Hesap Limiti"
                        type="number"
                        value={formData.accountLimit}
                        onChange={(e) => handleFormChange('accountLimit', e.target.value)}
                        error={!!formErrors.accountLimit}
                        helperText={formErrors.accountLimit || 'Maksimum kullanılabilir limit'}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Mevcut Borç"
                        type="number"
                        value={formData.currentDebt}
                        onChange={(e) => handleFormChange('currentDebt', e.target.value)}
                        error={!!formErrors.currentDebt}
                        helperText={formErrors.currentDebt || 'Şu anki borç miktarı'}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Faiz Oranı (%)"
                        type="number"
                        value={formData.interestRate}
                        onChange={(e) => handleFormChange('interestRate', e.target.value)}
                        error={!!formErrors.interestRate}
                        helperText={formErrors.interestRate || 'Yıllık faiz oranı'}
                        InputProps={{
                          endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Min. Ödeme Oranı (%)"
                        type="number"
                        value={formData.minimumPaymentRate}
                        onChange={(e) => handleFormChange('minimumPaymentRate', e.target.value)}
                        helperText="Minimum ödeme yüzdesi"
                        InputProps={{
                          endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>,
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    label="Ödeme Günü (Ayın Kaçı)"
                    type="number"
                    value={formData.paymentDueDate}
                    onChange={(e) => handleFormChange('paymentDueDate', e.target.value)}
                    inputProps={{ min: 1, max: 31 }}
                    helperText="Aylık ödeme tarihi (1-31 arası)"
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Kaydediliyor...' : (editingAccount ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AccountsDashboard;