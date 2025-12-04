import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person,
  Edit,
  Lock,
  Save,
  Cancel,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import EmailPreferences from '../../components/settings/EmailPreferences';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [editMode, setEditMode] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateProfile = () => {
    const errors = {};
    
    if (!profileData.firstName.trim()) {
      errors.firstName = 'Ad gereklidir';
    } else if (profileData.firstName.trim().length < 2) {
      errors.firstName = 'Ad en az 2 karakter olmalıdır';
    }
    
    if (!profileData.lastName.trim()) {
      errors.lastName = 'Soyad gereklidir';
    } else if (profileData.lastName.trim().length < 2) {
      errors.lastName = 'Soyad en az 2 karakter olmalıdır';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileData.email) {
      errors.email = 'E-posta gereklidir';
    } else if (!emailRegex.test(profileData.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Mevcut şifre gereklidir';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'Yeni şifre gereklidir';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Yeni şifre en az 6 karakter olmalıdır';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Yeni şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    try {
      setSubmitting(true);
      const result = await updateProfile({
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
      });

      if (result.success) {
        showSuccess('Profil başarıyla güncellendi');
        setEditMode(false);
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError('Profil güncellenirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    try {
      setSubmitting(true);
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);

      if (result.success) {
        showSuccess('Şifre başarıyla değiştirildi');
        setPasswordDialogOpen(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError('Şifre değiştirilirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    setProfileErrors({});
    setEditMode(false);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profil
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Hesap bilgilerinizi yönetin
        </Typography>

        <Grid container spacing={3}>
          {/* Profile Info Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    Kişisel Bilgiler
                  </Typography>
                  {!editMode ? (
                    <Button
                      startIcon={<Edit />}
                      onClick={() => setEditMode(true)}
                    >
                      Düzenle
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        startIcon={<Cancel />}
                        onClick={handleCancelEdit}
                      >
                        İptal
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSaveProfile}
                        disabled={submitting}
                      >
                        Kaydet
                      </Button>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ad"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      disabled={!editMode}
                      error={!!profileErrors.firstName}
                      helperText={profileErrors.firstName}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Soyad"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      disabled={!editMode}
                      error={!!profileErrors.lastName}
                      helperText={profileErrors.lastName}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="E-posta"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      disabled={!editMode}
                      error={!!profileErrors.email}
                      helperText={profileErrors.email}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Güvenlik
                  </Typography>
                  <Button
                    startIcon={<Lock />}
                    onClick={() => setPasswordDialogOpen(true)}
                  >
                    Şifre Değiştir
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Profile Avatar Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '2rem',
                    bgcolor: 'primary.main',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {getInitials(user?.firstName, user?.lastName)}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {user?.email}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Üyelik: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Email Preferences Section */}
        <Box sx={{ mt: 4 }}>
          <EmailPreferences />
        </Box>

        {/* Password Change Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Şifre Değiştir</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Mevcut Şifre"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                error={!!passwordErrors.currentPassword}
                helperText={passwordErrors.currentPassword}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Yeni Şifre"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                error={!!passwordErrors.newPassword}
                helperText={passwordErrors.newPassword}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Yeni Şifre Tekrarı"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                error={!!passwordErrors.confirmPassword}
                helperText={passwordErrors.confirmPassword}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>İptal</Button>
            <Button
              onClick={handleChangePassword}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Değiştiriliyor...' : 'Şifre Değiştir'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ProfilePage;