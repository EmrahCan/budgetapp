import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Home,
  Phone,
  Wifi,
  ElectricBolt,
  LocalGasStation,
  DirectionsCar,
  FitnessCenter,
  School,
  HealthAndSafety,
  Schedule,
  Warning,
  CheckCircle,
  Tv,
  Movie,
  MusicNote,
  SportsEsports,
  LocalGroceryStore,
  Restaurant,
  Coffee,
  ShoppingCart,
  AccountBalance,
  CreditCard,
  Security,
  Pets,
  ChildCare,
  CleaningServices,
  Build,
  LocalLaundryService,
  Category,
  CalendarMonth,
  ViewList,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { fixedPaymentsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';
import PaymentStatusCheckbox from '../../components/fixedPayments/PaymentStatusCheckbox';

// Sabit ödeme kategorileri ve ikonları
const PAYMENT_CATEGORIES = [
  { value: 'Konut', label: 'Konut (Kira, Aidat)', icon: <Home /> },
  { value: 'Faturalar', label: 'Faturalar (Elektrik, Su, Doğalgaz)', icon: <ElectricBolt /> },
  { value: 'İletişim', label: 'İletişim (Telefon, İnternet)', icon: <Phone /> },
  { value: 'Eğlence', label: 'Eğlence & Medya', icon: <Tv /> },
  { value: 'Streaming', label: 'Streaming (Netflix, Spotify)', icon: <Movie /> },
  { value: 'Sağlık', label: 'Sağlık & Spor', icon: <HealthAndSafety /> },
  { value: 'Eğitim', label: 'Eğitim & Kurslar', icon: <School /> },
  { value: 'Ulaşım', label: 'Ulaşım & Yakıt', icon: <DirectionsCar /> },
  { value: 'Finans', label: 'Finans & Bankacılık', icon: <AccountBalance /> },
  { value: 'Sigorta', label: 'Sigorta & Güvenlik', icon: <Security /> },
  { value: 'Alışveriş', label: 'Alışveriş & Market', icon: <ShoppingCart /> },
  { value: 'Yemek', label: 'Yemek & İçecek', icon: <Restaurant /> },
  { value: 'Temizlik', label: 'Temizlik & Bakım', icon: <CleaningServices /> },
  { value: 'Çocuk', label: 'Çocuk & Bakım', icon: <ChildCare /> },
  { value: 'Evcil Hayvan', label: 'Evcil Hayvan', icon: <Pets /> },
  { value: 'Diğer', label: 'Diğer', icon: <Schedule /> },
];

const FixedPaymentsPage = () => {
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'Faturalar',
    dueDay: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Yeni state'ler - görünüm değiştirici için
  const [viewMode, setViewMode] = useState('category'); // 'category', 'calendar', 'list'
  
  // Ay/yıl seçici için state'ler
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Touch gesture için state'ler
  const [touchStart, setTouchStart] = useState(null);
  
  // Hata yönetimi için state'ler
  const [error, setError] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  
  // Payment history state'leri
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [paymentStatistics, setPaymentStatistics] = useState(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      clearError();
      const response = await fixedPaymentsAPI.getAll();
      setPayments(response.data.data || response.data);
    } catch (error) {
      handleDataError(error, 'Sabit ödemeler yükleme');
    } finally {
      setLoading(false);
    }
  };

  // Load payment history for selected month/year
  const loadPaymentHistory = async () => {
    try {
      setCalendarLoading(true);
      const response = await fixedPaymentsAPI.getMonthlyStatusWithHistory({
        month: selectedMonth + 1, // API expects 1-12
        year: selectedYear
      });
      
      const data = response.data.data;
      
      // Create a map of payment statuses
      const statusMap = {};
      data.payments.forEach(payment => {
        statusMap[payment.id] = {
          isPaid: payment.isPaid,
          paidDate: payment.paidDate,
          paidAmount: payment.paidAmount,
          notes: payment.notes
        };
      });
      
      setPaymentStatuses(statusMap);
      setPaymentStatistics(data.statistics);
    } catch (error) {
      handleDataError(error, 'Ödeme geçmişi yükleme');
    } finally {
      setCalendarLoading(false);
    }
  };

  // Load payment history when month/year changes or view mode changes to list/calendar
  useEffect(() => {
    if (viewMode !== 'category' && payments.length > 0) {
      loadPaymentHistory();
    }
  }, [selectedMonth, selectedYear, viewMode, payments.length]);

  useEffect(() => {
    loadPayments();
  }, []);



  const handleOpenDialog = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        name: payment.name || '',
        amount: payment.amount?.toString() || '',
        category: payment.category || 'Kira',
        dueDay: payment.dueDay?.toString() || payment.due_day?.toString() || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        name: '',
        amount: '',
        category: 'Kira',
        dueDay: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPayment(null);
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
      errors.name = 'Ödeme adı gereklidir';
    }
    
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Geçerli bir tutar giriniz';
    }
    
    if (!formData.dueDay || parseInt(formData.dueDay) < 1 || parseInt(formData.dueDay) > 31) {
      errors.dueDay = 'Ödeme günü 1-31 arasında olmalıdır';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      clearError();
      
      const paymentData = {
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        dueDay: parseInt(formData.dueDay),
      };

      if (editingPayment) {
        await fixedPaymentsAPI.update(editingPayment.id, paymentData);
        showSuccess('Sabit ödeme başarıyla güncellendi');
      } else {
        await fixedPaymentsAPI.create(paymentData);
        showSuccess('Sabit ödeme başarıyla eklendi');
      }

      handleCloseDialog();
      await loadPayments(); // Listeyi yenile
    } catch (error) {
      handleDataError(error, editingPayment ? 'Sabit ödeme güncelleme' : 'Sabit ödeme ekleme');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm(`"${payment.name}" ödemesini silmek istediğinizden emin misiniz?`)) {
      try {
        clearError();
        await fixedPaymentsAPI.delete(payment.id);
        showSuccess('Sabit ödeme başarıyla silindi');
        await loadPayments(); // Listeyi yenile
      } catch (error) {
        handleDataError(error, 'Sabit ödeme silme');
      }
    }
  };

  const getCategoryInfo = (category) => {
    return PAYMENT_CATEGORIES.find(c => c.value === category) || PAYMENT_CATEGORIES[0];
  };

  // Kategori gruplarını oluştur
  const getCategoryGroups = () => {
    const groups = {};
    PAYMENT_CATEGORIES.forEach(category => {
      const groupName = getCategoryGroupName(category.value);
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(category);
    });
    return groups;
  };

  const getCategoryGroupName = (categoryValue) => {
    if (['Kira', 'Aidat', 'Emlak_Vergisi'].includes(categoryValue)) return 'Konut ve Barınma';
    if (['Elektrik', 'Dogalgaz', 'Su', 'Isitma'].includes(categoryValue)) return 'Temel Faturalar';
    if (['Telefon', 'Internet', 'Kablo_TV', 'Mobil_Hat'].includes(categoryValue)) return 'İletişim ve Teknoloji';
    if (['Arac_Kredisi', 'Arac_Sigortasi', 'Yakit', 'Otopark', 'Toplu_Tasima'].includes(categoryValue)) return 'Ulaşım';
    if (['Saglik_Sigortasi', 'Spor_Salonu', 'Doktor_Kontrolu', 'Ilac'].includes(categoryValue)) return 'Sağlık ve Kişisel Bakım';
    if (['Okul_Ucreti', 'Kurs', 'Kitap_Dergi', 'Online_Egitim'].includes(categoryValue)) return 'Eğitim ve Gelişim';
    if (['Kredi_Karti', 'Banka_Kredisi', 'Hayat_Sigortasi', 'Emeklilik'].includes(categoryValue)) return 'Finansal Yükümlülükler';
    if (['Streaming', 'Muzik', 'Dernek_Uyelik'].includes(categoryValue)) return 'Eğlence ve Sosyal';
    if (['Cocuk_Bakimi', 'Oyuncak_Oyun'].includes(categoryValue)) return 'Aile ve Çocuk';
    if (['Temizlik', 'Bahce_Bakim', 'Ev_Bakimi'].includes(categoryValue)) return 'Ev Bakımı';
    return 'Diğer';
  };

  const getTotalMonthlyPayments = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  const getUpcomingPayments = () => {
    const today = new Date();
    const currentDay = today.getDate();
    
    return payments
      .map(payment => ({
        ...payment,
        daysUntil: payment.dueDay >= currentDay 
          ? payment.dueDay - currentDay 
          : (new Date(today.getFullYear(), today.getMonth() + 1, payment.dueDay) - today) / (1000 * 60 * 60 * 24)
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
  };

  const getPaymentsByCategory = () => {
    const grouped = payments.reduce((acc, payment) => {
      if (!acc[payment.category]) {
        acc[payment.category] = [];
      }
      acc[payment.category].push(payment);
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, categoryPayments]) => ({
      category,
      payments: categoryPayments,
      total: categoryPayments.reduce((sum, p) => sum + p.amount, 0)
    }));
  };

  // Ay ve yıl listeleri
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  // Görünüm değiştirme fonksiyonu (memoized)
  const handleViewModeChange = useCallback((event, newMode) => {
    if (!newMode) return; // Prevent deselecting all modes
    
    try {
      setViewMode(newMode);
      // Takvim veya liste görünümü seçildiğinde ek veriler yüklenebilir
      if (newMode !== 'category') {
        // loadCalendarData(); // Gelecekte implement edilecek
      }
    } catch (error) {
      showError('Görünüm değiştirilemedi');
      console.error('View mode change error:', error);
    }
  }, [showError]);

  // Ay değiştirme fonksiyonu (memoized)
  const handleMonthChange = useCallback((event) => {
    try {
      const newMonth = event.target.value;
      
      // Geçerli ay kontrolü
      if (newMonth < 0 || newMonth > 11) {
        throw new Error('Invalid month value');
      }
      
      setSelectedMonth(newMonth);
      
      // Ay değiştiğinde takvim verilerini yenile
      if (viewMode !== 'category') {
        // loadCalendarData(); // Gelecekte implement edilecek
      }
    } catch (error) {
      showError('Ay değiştirilemedi');
      console.error('Month change error:', error);
    }
  }, [viewMode, showError]);

  // Yıl değiştirme fonksiyonu (memoized)
  const handleYearChange = useCallback((event) => {
    try {
      const newYear = event.target.value;
      
      // Geçerli yıl kontrolü
      if (newYear < 1900 || newYear > 2100) {
        throw new Error('Invalid year value');
      }
      
      setSelectedYear(newYear);
      
      // Yıl değiştiğinde takvim verilerini yenile
      if (viewMode !== 'category') {
        // loadCalendarData(); // Gelecekte implement edilecek
      }
    } catch (error) {
      showError('Yıl değiştirilemedi');
      console.error('Year change error:', error);
    }
  }, [viewMode, showError]);

  // Takvim için helper fonksiyonlar
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Pazartesi = 0, Pazar = 6
  };

  // Takvim günlerini memoize et
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];

    // Önceki ayın son günleri
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(prevYear, prevMonth, prevMonthDays - i)
      });
    }

    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(selectedYear, selectedMonth, day)
      });
    }

    // Sonraki ayın ilk günleri (42 gün tamamlamak için)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(nextYear, nextMonth, day)
      });
    }

    return days;
  }, [selectedYear, selectedMonth]);

  // Belirli bir tarihteki ödemeleri getir (memoized)
  const getPaymentsForDate = useCallback((date) => {
    return payments.filter(payment => {
      const paymentDate = safeCalculatePaymentDate(payment, selectedMonth, selectedYear);
      return paymentDate.toDateString() === date.toDateString();
    });
  }, [payments, selectedMonth, selectedYear]);

  // Kategori renk mapping'i
  const getCategoryColor = (category) => {
    const colorMap = {
      'Konut': 'primary',
      'Faturalar': 'error',
      'İletişim': 'info',
      'Eğlence': 'secondary',
      'Streaming': 'secondary',
      'Sağlık': 'success',
      'Eğitim': 'warning',
      'Ulaşım': 'info',
      'Finans': 'primary',
      'Sigorta': 'warning',
      'Alışveriş': 'secondary',
      'Yemek': 'success',
      'Temizlik': 'info',
      'Çocuk': 'warning',
      'Evcil Hayvan': 'success',
      'Diğer': 'default'
    };
    return colorMap[category] || 'default';
  };

  // Güvenli tarih hesaplama fonksiyonu
  const safeCalculatePaymentDate = (payment, month, year) => {
    try {
      // Ay sonu durumlarını handle et (31. gün seçilmiş ama ay 30 günlük)
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const adjustedDay = Math.min(payment.dueDay, daysInMonth);
      
      // Artık yıl hesaplamalarını doğru yap
      const paymentDate = new Date(year, month, adjustedDay);
      
      // Tarih geçerli mi kontrol et
      if (isNaN(paymentDate.getTime())) {
        console.warn(`Invalid date calculated for payment ${payment.name}: ${year}-${month + 1}-${adjustedDay}`);
        return new Date(); // Fallback to current date
      }
      
      return paymentDate;
    } catch (error) {
      console.error('Date calculation error:', error);
      return new Date(); // Fallback to current date
    }
  };

  // Ödeme durumu hesaplama fonksiyonu
  const calculatePaymentStatus = (payment, month, year) => {
    const paymentDate = safeCalculatePaymentDate(payment, month, year);
    const today = new Date();
    const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const paymentDateWithoutTime = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
    
    if (paymentDateWithoutTime < todayWithoutTime) {
      return {
        status: 'overdue',
        label: 'Gecikmiş',
        color: 'error',
        icon: <Warning />
      };
    } else if (paymentDateWithoutTime.getTime() === todayWithoutTime.getTime()) {
      return {
        status: 'today',
        label: 'Bugün',
        color: 'warning',
        icon: <Schedule />
      };
    } else {
      return {
        status: 'pending',
        label: 'Bekliyor',
        color: 'info',
        icon: <Schedule />
      };
    }
  };

  // Ödeme hesaplamalarını memoize et
  const monthlyPayments = useMemo(() => {
    return payments.map(payment => {
      const paymentDate = safeCalculatePaymentDate(payment, selectedMonth, selectedYear);
      const statusInfo = calculatePaymentStatus(payment, selectedMonth, selectedYear);
      
      // Gerçek ödeme gününü hesapla (ay sonu durumları için)
      const actualDay = paymentDate.getDate();
      const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
      
      return {
        ...payment,
        paymentDate,
        actualDay, // Gerçek ödeme günü
        formattedDate,
        ...statusInfo
      };
    }).sort((a, b) => a.actualDay - b.actualDay);
  }, [payments, selectedMonth, selectedYear]);

  // Durum renklerini al
  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return 'error';
      case 'today': return 'warning';
      case 'pending': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  // Touch gesture handler'ları (memoized)
  const handleTouchStart = useCallback((e) => {
    if (!isMobile || viewMode === 'category') return;
    setTouchStart(e.targetTouches[0].clientX);
  }, [isMobile, viewMode]);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart || !isMobile || viewMode === 'category') return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Sağa kaydırma - sonraki ay
        const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
        const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
      } else {
        // Sola kaydırma - önceki ay
        const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
      }
      setTouchStart(null);
    }
  }, [touchStart, isMobile, viewMode, selectedMonth, selectedYear]);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
  }, []);

  // Handle payment status change
  const handlePaymentStatusChange = async (paymentId, isPaid, month, year) => {
    try {
      const apiMonth = month !== undefined ? month + 1 : selectedMonth + 1;
      const apiYear = year !== undefined ? year : selectedYear;
      
      // Optimistic update - immediately update UI
      setPaymentStatuses(prev => ({
        ...prev,
        [paymentId]: {
          ...prev[paymentId],
          isPaid: isPaid,
          paidDate: isPaid ? new Date().toISOString().split('T')[0] : null
        }
      }));
      
      if (isPaid) {
        // Mark as paid
        const payment = payments.find(p => p.id === paymentId);
        await fixedPaymentsAPI.markAsPaid(paymentId, {
          month: apiMonth,
          year: apiYear,
          paidAmount: payment?.amount,
          paidDate: new Date().toISOString().split('T')[0]
        });
        showSuccess('Ödeme yapıldı olarak işaretlendi');
      } else {
        // Mark as unpaid
        await fixedPaymentsAPI.markAsUnpaid(paymentId, {
          month: apiMonth,
          year: apiYear
        });
        showSuccess('Ödeme yapılmadı olarak işaretlendi');
      }
      
      // Reload payment history to sync with server
      await loadPaymentHistory();
    } catch (error) {
      // Revert optimistic update on error
      setPaymentStatuses(prev => ({
        ...prev,
        [paymentId]: {
          ...prev[paymentId],
          isPaid: !isPaid
        }
      }));
      handleDataError(error, 'Ödeme durumu güncelleme');
      throw error; // Re-throw to let checkbox component handle it
    }
  };

  // Gelişmiş hata yönetimi fonksiyonları
  const handleDataError = useCallback((error, context = 'Veri işlemi') => {
    console.error(`${context} error:`, error);
    const errorMessage = error?.response?.data?.message || error?.message || `${context} sırasında hata oluştu`;
    setError(errorMessage);
    showError(errorMessage);
  }, [showError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Loading state yönetimi
  const setLoadingState = useCallback((isLoading, context = 'calendar') => {
    if (context === 'calendar') {
      setCalendarLoading(isLoading);
    }
  }, []);

  return (
    <Container maxWidth={isMobile ? 'sm' : 'xl'}>
      <Box sx={{ py: isMobile ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center', 
          mb: isMobile ? 3 : 4,
          gap: isMobile ? 2 : 0
        }}>
          <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
            <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
              Sabit Ödemelerim
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Aylık sabit ödemelerinizi (kira, faturalar, abonelikler) yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size={isMobile ? "medium" : "large"}
            fullWidth={isMobile}
          >
            {isMobile ? "Ekle" : "Sabit Ödeme Ekle"}
          </Button>
        </Box>

        {/* View Mode Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: isMobile ? 3 : 4 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size={isMobile ? "small" : "small"}
            sx={{ 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <ToggleButton value="category" sx={{ flex: isMobile ? 1 : 'none' }}>
              <Category sx={{ mr: isMobile ? 0.5 : 1 }} />
              {isMobile ? "Kat." : "Kategoriler"}
            </ToggleButton>
            <ToggleButton value="calendar" sx={{ flex: isMobile ? 1 : 'none' }}>
              <CalendarMonth sx={{ mr: isMobile ? 0.5 : 1 }} />
              Takvim
            </ToggleButton>
            <ToggleButton value="list" sx={{ flex: isMobile ? 1 : 'none' }}>
              <ViewList sx={{ mr: isMobile ? 0.5 : 1 }} />
              Liste
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Month/Year Selector - Sadece takvim ve liste görünümlerinde görünür */}
        {(viewMode === 'calendar' || viewMode === 'list') && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: isMobile ? 1 : 2, 
            mb: isMobile ? 3 : 4,
            px: isMobile ? 2 : 0
          }}>
            <FormControl size="small" sx={{ minWidth: isMobile ? 100 : 120, flex: isMobile ? 1 : 'none' }}>
              <InputLabel>Ay</InputLabel>
              <Select
                value={selectedMonth}
                label="Ay"
                onChange={handleMonthChange}
              >
                {months.map((month, index) => (
                  <MenuItem key={index} value={index}>
                    {isMobile ? month.substring(0, 3) : month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: isMobile ? 80 : 100, flex: isMobile ? 1 : 'none' }}>
              <InputLabel>Yıl</InputLabel>
              <Select
                value={selectedYear}
                label="Yıl"
                onChange={handleYearChange}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Alert */}


        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <Schedule />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Toplam Aylık Ödeme
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" color="error.main">
                  {formatCurrency(getTotalMonthlyPayments())}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {payments.length} sabit ödeme
                </Typography>
                {paymentStatistics && viewMode !== 'category' && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="textSecondary">
                      {months[selectedMonth]} {selectedYear}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Chip 
                        label={`✓ ${paymentStatistics.paidCount}`} 
                        size="small" 
                        color="success" 
                      />
                      <Chip 
                        label={`✗ ${paymentStatistics.unpaidCount}`} 
                        size="small" 
                        color="error" 
                      />
                      <Chip 
                        label={`${paymentStatistics.completionRate}%`} 
                        size="small" 
                        color="info" 
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Yaklaşan Ödemeler
                </Typography>
                <List dense>
                  {getUpcomingPayments().slice(0, 3).map((payment, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ 
                          bgcolor: getCategoryInfo(payment.category).color || 'warning.main', 
                          width: 32, 
                          height: 32 
                        }}>
                          {getCategoryInfo(payment.category).icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={payment.name}
                        secondary={`${Math.ceil(payment.daysUntil)} gün sonra - ${formatCurrency(payment.amount)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Kategori Dağılımı
                </Typography>
                <List dense>
                  {getPaymentsByCategory().slice(0, 3).map((item, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ 
                          bgcolor: getCategoryInfo(item.category).color || 'success.main', 
                          width: 32, 
                          height: 32 
                        }}>
                          {getCategoryInfo(item.category).icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={item.category}
                        secondary={`${item.payments.length} ödeme - ${formatCurrency(item.total)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Content based on view mode */}
        {viewMode === 'category' && (
          /* Payments by Category */
          loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : payments.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Henüz sabit ödeme eklenmemiş
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  İlk sabit ödemenizi eklemek için "Sabit Ödeme Ekle" butonuna tıklayın
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                >
                  Sabit Ödeme Ekle
                </Button>
              </CardContent>
            </Card>
          ) : (
            getPaymentsByCategory().map((categoryGroup) => (
            <Card key={categoryGroup.category} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {getCategoryInfo(categoryGroup.category).icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {categoryGroup.category}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {categoryGroup.payments.length} ödeme - Toplam: {formatCurrency(categoryGroup.total)}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  {categoryGroup.payments.map((payment, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {payment.name}
                            </Typography>
                            <Box>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(payment)}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeletePayment(payment)}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Typography variant="h6" color="error.main" gutterBottom>
                            {formatCurrency(payment.amount)}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={`${payment.dueDay}. gün`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Typography variant="caption" color="textSecondary">
                              Her ay {payment.dueDay}. günü
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          ))
          )
        )}

        {viewMode === 'calendar' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {months[selectedMonth]} {selectedYear} - Sabit Ödemeler Takvimi
              </Typography>
              
              {loading || calendarLoading ? (
                <Box>
                  {/* Haftanın günleri skeleton */}
                  <Grid container sx={{ mb: 1 }}>
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                      <Grid item xs key={day}>
                        <Skeleton variant="rectangular" height={40} />
                      </Grid>
                    ))}
                  </Grid>
                  
                  {/* Takvim günleri skeleton */}
                  <Grid container>
                    {Array.from({ length: 42 }).map((_, index) => (
                      <Grid item xs key={index}>
                        <Skeleton 
                          variant="rectangular" 
                          height={isMobile ? 80 : 120} 
                          sx={{ border: '1px solid', borderColor: 'grey.300' }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : payments.length === 0 ? (
                <Alert severity="info">
                  Bu ay için herhangi bir sabit ödeme bulunamadı.
                </Alert>
              ) : (
                <Box>
                  {/* Haftanın günleri */}
                  <Grid container sx={{ mb: 1 }}>
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                      <Grid item xs key={day}>
                        <Typography 
                          variant="subtitle2" 
                          align="center" 
                          sx={{ 
                            py: 1, 
                            bgcolor: 'grey.100', 
                            fontWeight: 'bold',
                            borderRight: '1px solid',
                            borderColor: 'grey.300'
                          }}
                        >
                          {day}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Takvim günleri */}
                  <Grid container>
                    {calendarDays.map((dayInfo, index) => {
                      const dayPayments = getPaymentsForDate(dayInfo.date);
                      const isToday = dayInfo.date.toDateString() === new Date().toDateString();
                      const totalAmount = dayPayments.reduce((sum, payment) => sum + payment.amount, 0);
                      
                      return (
                        <Grid item xs key={index}>
                          <Paper
                            sx={{
                              minHeight: isMobile ? 80 : 120,
                              p: isMobile ? 0.5 : 1,
                              border: '1px solid',
                              borderColor: 'grey.300',
                              bgcolor: dayInfo.isCurrentMonth ? 'background.paper' : 'grey.50',
                              position: 'relative',
                              '&:hover': {
                                bgcolor: dayInfo.isCurrentMonth ? 'grey.50' : 'grey.100'
                              }
                            }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                          >
                            {/* Gün numarası */}
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isToday ? 'bold' : 'normal',
                                bgcolor: isToday ? 'primary.main' : 'transparent',
                                color: isToday ? 'white' : (dayInfo.isCurrentMonth ? 'text.primary' : 'text.secondary'),
                                borderRadius: isToday ? '50%' : 0,
                                width: isToday ? 24 : 'auto',
                                height: isToday ? 24 : 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 0.5
                              }}
                            >
                              {dayInfo.day}
                            </Typography>

                            {/* Ödemeler */}
                            <Box sx={{ maxHeight: isMobile ? 60 : 90, overflow: 'hidden' }}>
                              {dayPayments.slice(0, isMobile ? 2 : 3).map((payment, idx) => {
                                const categoryInfo = getCategoryInfo(payment.category);
                                const statusInfo = calculatePaymentStatus(payment, selectedMonth, selectedYear);
                                
                                return (
                                  <Chip
                                    key={idx}
                                    label={isMobile ? payment.name.substring(0, 8) + (payment.name.length > 8 ? '...' : '') : payment.name}
                                    size="small"
                                    color={statusInfo.color}
                                    icon={isMobile ? null : categoryInfo.icon}
                                    sx={{
                                      fontSize: isMobile ? '0.5rem' : '0.6rem',
                                      height: isMobile ? 16 : 20,
                                      mb: 0.5,
                                      display: 'block',
                                      border: statusInfo.status === 'overdue' ? '1px solid' : 'none',
                                      borderColor: statusInfo.status === 'overdue' ? 'error.main' : 'transparent',
                                      '& .MuiChip-label': {
                                        px: isMobile ? 0.3 : 0.5,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '100%'
                                      },
                                      '& .MuiChip-icon': {
                                        fontSize: '0.7rem',
                                        width: 12,
                                        height: 12,
                                        ml: 0.5
                                      }
                                    }}
                                  />
                                );
                              })}
                              {dayPayments.length > 3 && (
                                <Typography variant="caption" color="textSecondary">
                                  +{dayPayments.length - 3} daha
                                </Typography>
                              )}
                              {totalAmount > 0 && (
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography 
                                    variant="caption" 
                                    color="error.main"
                                    sx={{ 
                                      display: 'block', 
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {formatCurrency(totalAmount)}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="textSecondary"
                                    sx={{ 
                                      display: 'block',
                                      fontSize: '0.5rem'
                                    }}
                                  >
                                    {dayPayments.length} ödeme
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {viewMode === 'list' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {months[selectedMonth]} {selectedYear} - Sabit Ödemeler Listesi
              </Typography>
              
              {loading || calendarLoading ? (
                <TableContainer>
                  <Table size={isMobile ? "small" : "medium"}>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">Ödendi</TableCell>
                        {!isMobile && <TableCell>Tarih</TableCell>}
                        <TableCell>Ödeme</TableCell>
                        {!isMobile && <TableCell>Kategori</TableCell>}
                        <TableCell align="right">Tutar</TableCell>
                        <TableCell>Durum</TableCell>
                        <TableCell>İşlem</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell padding="checkbox">
                            <Skeleton variant="circular" width={24} height={24} />
                          </TableCell>
                          {!isMobile && (
                            <TableCell>
                              <Skeleton variant="text" width={100} />
                            </TableCell>
                          )}
                          <TableCell>
                            <Skeleton variant="text" width={150} />
                          </TableCell>
                          {!isMobile && (
                            <TableCell>
                              <Skeleton variant="circular" width={24} height={24} />
                            </TableCell>
                          )}
                          <TableCell align="right">
                            <Skeleton variant="text" width={80} />
                          </TableCell>
                          <TableCell>
                            <Skeleton variant="rounded" width={60} height={24} />
                          </TableCell>
                          <TableCell>
                            <Skeleton variant="circular" width={24} height={24} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : payments.length === 0 ? (
                <Alert severity="info">
                  Bu ay için herhangi bir sabit ödeme bulunamadı.
                </Alert>
              ) : (
                <TableContainer>
                  <Table size={isMobile ? "small" : "medium"}>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">Ödendi</TableCell>
                        {!isMobile && <TableCell>Tarih</TableCell>}
                        <TableCell>Ödeme</TableCell>
                        {!isMobile && <TableCell>Kategori</TableCell>}
                        <TableCell align="right">Tutar</TableCell>
                        <TableCell>Durum</TableCell>
                        <TableCell>İşlem</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyPayments.map((payment) => {
                        const categoryInfo = getCategoryInfo(payment.category);
                        const paymentStatus = paymentStatuses[payment.id] || { isPaid: false };
                        return (
                          <TableRow key={payment.id}>
                            <TableCell padding="checkbox">
                              <PaymentStatusCheckbox
                                payment={payment}
                                month={selectedMonth}
                                year={selectedYear}
                                isPaid={paymentStatus.isPaid}
                                onStatusChange={handlePaymentStatusChange}
                              />
                            </TableCell>
                            {!isMobile && (
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Schedule fontSize="small" color="action" />
                                  <Box>
                                    <Typography variant="body2">
                                      {payment.formattedDate}
                                    </Typography>
                                    {payment.dueDay !== payment.actualDay && (
                                      <Typography variant="caption" color="textSecondary">
                                        (Orijinal: {payment.dueDay}. gün)
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                            )}
                            <TableCell>
                              <Box>
                                <Typography variant={isMobile ? "body2" : "body2"} fontWeight="medium">
                                  {payment.name}
                                </Typography>
                                {isMobile && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                    <Avatar sx={{ 
                                      bgcolor: `${getCategoryColor(payment.category)}.main`, 
                                      width: 16, 
                                      height: 16 
                                    }}>
                                      {categoryInfo.icon}
                                    </Avatar>
                                    <Typography variant="caption" color="textSecondary">
                                      {payment.category} • {payment.formattedDate}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                            {!isMobile && (
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ 
                                    bgcolor: `${getCategoryColor(payment.category)}.main`, 
                                    width: 24, 
                                    height: 24 
                                  }}>
                                    {categoryInfo.icon}
                                  </Avatar>
                                  <Typography variant="body2">
                                    {payment.category}
                                  </Typography>
                                </Box>
                              </TableCell>
                            )}
                            <TableCell align="right">
                              <Typography 
                                variant={isMobile ? "body2" : "body2"}
                                fontWeight="medium"
                                color="error.main"
                              >
                                {formatCurrency(payment.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {paymentStatus.isPaid ? (
                                <Chip
                                  size="small"
                                  label="Ödendi"
                                  color="success"
                                  icon={<CheckCircle />}
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  label={isMobile ? payment.label.substring(0, 3) : payment.label}
                                  color={payment.color}
                                  icon={isMobile ? null : payment.icon}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: isMobile ? 0.5 : 1 }}>
                                <IconButton 
                                  size="small"
                                  onClick={() => handleOpenDialog(payment)}
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton 
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeletePayment(payment)}
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingPayment ? 'Sabit Ödeme Düzenle' : 'Yeni Sabit Ödeme Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Ödeme Adı"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                sx={{ mb: 3 }}
                placeholder="örn: Kira, Elektrik Faturası, İnternet"
              />

              <TextField
                fullWidth
                select
                label="Kategori"
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                sx={{ mb: 3 }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        maxHeight: 400,
                      },
                    },
                  },
                }}
              >
                {Object.entries(getCategoryGroups()).map(([groupName, categories]) => [
                  <MenuItem key={`group-${groupName}`} disabled sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    backgroundColor: 'grey.100',
                    fontSize: '0.875rem'
                  }}>
                    {groupName}
                  </MenuItem>,
                  ...categories.map((category) => (
                    <MenuItem key={category.value} value={category.value} sx={{ pl: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%',
                          backgroundColor: category.color || 'primary.main',
                          color: 'white',
                          fontSize: '0.75rem'
                        }}>
                          {category.icon}
                        </Box>
                        <Typography variant="body2">
                          {category.label}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                ]).flat()}
              </TextField>

              <TextField
                fullWidth
                label="Aylık Tutar"
                type="number"
                value={formData.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Ödeme Günü (Ayın Kaçı)"
                type="number"
                value={formData.dueDay}
                onChange={(e) => handleFormChange('dueDay', e.target.value)}
                error={!!formErrors.dueDay}
                helperText={formErrors.dueDay || 'Ayın hangi günü ödeme yapacağınızı belirtin (1-31)'}
                inputProps={{ min: 1, max: 31 }}
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
              {submitting ? 'Kaydediliyor...' : (editingPayment ? 'Güncelle' : 'Ekle')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={clearError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default FixedPaymentsPage;