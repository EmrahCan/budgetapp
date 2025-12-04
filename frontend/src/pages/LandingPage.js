import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * LandingPage - Main landing page component for unauthenticated users
 * 
 * This component serves as the entry point for new visitors, showcasing
 * the application's features and providing clear call-to-action buttons
 * for registration and login.
 */
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
      }}
    >
      <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Budget App'e Hoş Geldiniz! 🎉
      </Typography>
      
      <Typography variant="h5" gutterBottom sx={{ color: '#666', mb: 4 }}>
        Finansal geleceğinizi yönetin
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate('/register')}
          sx={{ 
            background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
            px: 4,
            py: 1.5,
          }}
        >
          Ücretsiz Başlayın
        </Button>
        
        <Button 
          variant="outlined" 
          size="large"
          onClick={() => navigate('/login')}
          sx={{ px: 4, py: 1.5 }}
        >
          Giriş Yap
        </Button>
      </Box>
    </Box>
  );
};

export default LandingPage;
