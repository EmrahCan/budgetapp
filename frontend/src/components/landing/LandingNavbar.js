import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Language as LanguageIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

/**
 * LandingNavbar - Navigation bar for the landing page
 * 
 * Features:
 * - Responsive design with mobile menu
 * - Language switcher
 * - Login button
 * - Sticky positioning on scroll
 * 
 * @param {Object} props
 * @param {boolean} props.transparent - Whether navbar has transparent background
 */
const LandingNavbar = ({ transparent = false }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <nav className={`w-full py-4 px-6 sticky top-0 z-50 transition-all duration-300 ${
      transparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-sm shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('landing.brand', 'BudgetApp')}
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center space-x-2"
            aria-label={t('landing.switchLanguage', 'Dil Değiştir')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="uppercase">{i18n.language}</span>
          </button>

          {/* Login Button */}
          <button
            onClick={handleLoginClick}
            className="px-6 py-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors border-2 border-blue-600 hover:border-blue-700 rounded-lg"
          >
            {t('landing.login', 'Giriş Yap')}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 py-4 border-t border-gray-200">
          <div className="flex flex-col space-y-4">
            {/* Language Switcher Mobile */}
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{i18n.language === 'tr' ? 'English' : 'Türkçe'}</span>
            </button>

            {/* Login Button Mobile */}
            <button
              onClick={handleLoginClick}
              className="px-6 py-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors border-2 border-blue-600 hover:border-blue-700 rounded-lg text-center"
            >
              {t('landing.login', 'Giriş Yap')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
