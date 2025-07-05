import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">{t('language')}:</span>
      <div className="flex gap-1">
        <Button
          variant={i18n.language === 'en' ? 'default' : 'outline'}
          size="sm"
          onClick={() => changeLanguage('en')}
          className="text-xs px-2 py-1 h-7"
        >
          English
        </Button>
        <Button
          variant={i18n.language === 'el' ? 'default' : 'outline'}
          size="sm"
          onClick={() => changeLanguage('el')}
          className="text-xs px-2 py-1 h-7"
        >
          Ελληνικά
        </Button>
      </div>
    </div>
  );
};

export default LanguageSelector; 