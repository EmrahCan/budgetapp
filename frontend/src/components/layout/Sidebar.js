import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  CreditCard,
  Receipt,
  Assessment,
  Person,
  TrendingUp,
  AdminPanelSettings,
  People,
  Schedule,
  Payment,
  Repeat,
  CalendarToday,
  CameraAlt,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const getMenuItems = (userRole, t) => {
  const baseItems = [
    {
      text: t('navigation.dashboard'),
      icon: <Dashboard />,
      path: '/',
    },
    {
      text: t('navigation.accounts'),
      icon: <AccountBalance />,
      path: '/accounts',
    },
    {
      text: t('navigation.overdrafts'),
      icon: <CreditCard />,
      path: '/overdrafts',
    },
    {
      text: t('navigation.creditCards'),
      icon: <CreditCard />,
      path: '/credit-cards',
    },
    {
      text: t('navigation.transactions'),
      icon: <Receipt />,
      path: '/transactions',
    },
    {
      text: t('navigation.fixedPayments'),
      icon: <Repeat />,
      path: '/fixed-payments',
    },
    {
      text: t('navigation.installmentPayments'),
      icon: <Payment />,
      path: '/installment-payments',
    },
    {
      text: t('navigation.calendar'),
      icon: <CalendarToday />,
      path: '/payment-calendar',
    },
    {
      text: t('navigation.reports'),
      icon: <Assessment />,
      path: '/reports',
    },
    {
      text: 'Fiş Okuma (OCR)',
      icon: <CameraAlt />,
      path: '/ocr',
    },
  ];

  // Add admin items if user is admin
  if (userRole === 'admin') {
    baseItems.push(
      {
        text: t('navigation.admin'),
        icon: <AdminPanelSettings />,
        path: '/admin',
      },
      {
        text: t('navigation.userManagement'),
        icon: <People />,
        path: '/admin/users',
      }
    );
  }

  return baseItems;
};

const Sidebar = ({ onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const menuItems = getMenuItems(user?.role, t);

  const handleItemClick = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6" noWrap component="div" color="primary">
            Budget App
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      {/* User Info */}
      {user && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
              }}
            >
              {getInitials(user.firstName, user.lastName)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="textSecondary" noWrap>
                {user.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleItemClick(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: location.pathname === item.path ? 'inherit' : 'action.active',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Profile Link */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/profile'}
            onClick={() => handleItemClick('/profile')}
            sx={{
              mx: 1,
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: location.pathname === '/profile' ? 'inherit' : 'action.active',
              }}
            >
              <Person />
            </ListItemIcon>
            <ListItemText 
              primary={t('navigation.profile')}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: location.pathname === '/profile' ? 600 : 400,
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar;