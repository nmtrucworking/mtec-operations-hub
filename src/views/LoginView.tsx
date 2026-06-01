import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Lock, LogIn, Mail, Languages, Sun, Moon } from 'lucide-react';
import { login as loginRequest } from '../services/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ForgotPasswordView } from './ForgotPasswordView';
import { useTheme } from '../components/theme-provider';
import type { UserAccount, UserRole } from '../types/app';

import logoImg from '../assets/mtec_logo.svg';
interface LoginViewProps {
  onLogin: (user: UserAccount, token?: string) => void;
  onOpenHelperCenter?: () => void;
}

import { useToast } from '../components/ui/toast';
import { APP_VERSION } from '../config/appVersion';

export const LoginView = ({ onLogin, onOpenHelperCenter }: LoginViewProps) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { error: toastError } = useToast();
  const currentLang = (i18n.resolvedLanguage || i18n.language || 'vi').split('-')[0];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError(t('login.errorEmpty'));
      return;
    }

    setIsLoading(true);

    const response = await loginRequest(username.trim(), password);

    if (response.status >= 200 && response.status < 300 && response.data) {
      onLogin(response.data.user, response.data.accessToken);
      return;
    }

    const errorMsg = response.error || t('login.errorInvalid');
    setError(errorMsg);
    toastError(errorMsg);
    setIsLoading(false);
  };

  if (showForgotPassword) {
    return <ForgotPasswordView onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background font-sans relative overflow-hidden px-4">
      {/* Top Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        {/* Language Toggle */}
        <button
          onClick={() => i18n.changeLanguage(currentLang === 'vi' ? 'en' : 'vi')}
          className="p-2 rounded-md bg-card border border-border text-primary hover:border-border-highlight transition-colors flex items-center gap-2 px-3"
          title={t('common.changeLanguage')}
        >
          <Languages size={18} />
          <span className="text-xs font-bold uppercase">{currentLang}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-md bg-card border border-border text-primary hover:border-border-highlight transition-colors"
          title={theme === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <Card className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-300 border-border shadow-none p-2 bg-card">
        <CardHeader className="text-center pb-4">
          {/* Logo */}
          <div className="mx-auto flex items-center justify-center w-20 h-20 mb-4">
            <img src={logoImg} alt="MTEC Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl font-semibold text-primary">{t('login.title')}</CardTitle>
          <CardDescription className="text-sm mt-2 text-secondary">{t('login.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-danger-bg border border-danger-border text-danger-text text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary block">{t('login.usernameLabel')}</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login.usernamePlaceholder')}
                icon={<Mail size={18} />}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-secondary block">{t('login.passwordLabel')}</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-primary hover:text-gold transition-colors"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                icon={<Lock size={18} />}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full font-semibold text-white"
                size="lg"
                isLoading={isLoading}
              >
                {!isLoading && <LogIn size={18} className="mr-2" />}
                {t('login.loginButton')}
              </Button>
            </div>

            {onOpenHelperCenter ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onOpenHelperCenter}
                disabled={isLoading}
              >
                <HelpCircle size={18} className="mr-2" />
                Helper Center cho thành viên
              </Button>
            ) : null}
          </form>
        </CardContent>

        <div className="mt-4 pt-6 border-t border-border text-center pb-4">
          <p className="text-xs text-secondary">
            {t('login.footer')}
          </p>
          <p className="text-xs text-secondary mt-1">
            {/* version */}
            v{APP_VERSION}
          </p>
        </div>
      </Card>
    </div>
  );
};
