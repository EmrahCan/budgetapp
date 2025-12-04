import React from 'react';
import { useTranslation } from 'react-i18next';
import FeatureCard from './FeatureCard';

/**
 * FeaturesSection - Section displaying key application features
 * 
 * Features:
 * - Responsive grid layout (3 columns desktop, 1 column mobile)
 * - Animated section title
 * - Feature cards with icons and descriptions
 * - Bilingual support (TR/EN)
 */
const FeaturesSection = () => {
  const { t } = useTranslation();

  // Feature icons with improved styling
  const WalletIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );

  const BellIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );

  const ChartIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const features = [
    {
      icon: <WalletIcon />,
      title: t('landing.features.accounts.title', 'Hesap Yönetimi'),
      description: t('landing.features.accounts.description', 'Tüm hesaplarınızı tek yerden yönetin ve takip edin. Banka hesapları, kredi kartları ve nakit hesaplarınızı kolayca organize edin.')
    },
    {
      icon: <BellIcon />,
      title: t('landing.features.notifications.title', 'Akıllı Bildirimler'),
      description: t('landing.features.notifications.description', 'Önemli finansal olaylar için zamanında bildirim alın. Fatura ödemeleri, taksit tarihleri ve bütçe limitleri için hatırlatmalar.')
    },
    {
      icon: <ChartIcon />,
      title: t('landing.features.reports.title', 'Raporlar ve Analiz'),
      description: t('landing.features.reports.description', 'Detaylı raporlar ile harcamalarınızı analiz edin. Gelir-gider takibi, kategori bazlı analizler ve trend grafikleri.')
    }
  ];

  return (
    <section id="features" className="py-20 md:py-32 px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-4">
            <span className="text-sm font-semibold text-blue-600">
              {t('landing.features.badge', 'ÖZELLİKLER')}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('landing.features.title', 'Finansal Yönetimi')}
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('landing.features.titleHighlight', 'Kolaylaştırın')}
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            {t('landing.features.subtitle', 'İhtiyacınız olan tüm araçlar tek bir platformda')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        {/* Additional Features List */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
            <div className="text-gray-600">{t('landing.features.stat1', 'Ücretsiz')}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-600 mb-2">∞</div>
            <div className="text-gray-600">{t('landing.features.stat2', 'Sınırsız Hesap')}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-pink-600 mb-2">24/7</div>
            <div className="text-gray-600">{t('landing.features.stat3', 'Erişim')}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2">🔒</div>
            <div className="text-gray-600">{t('landing.features.stat4', 'Güvenli')}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
