import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, LogIn, Mail } from 'lucide-react';
import { login as loginRequest } from '../services/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ForgotPasswordView } from './ForgotPasswordView';
import type { UserAccount, UserRole } from '../types/app';

import logoImg from '../assets/mtec_logo.svg';
interface LoginViewProps {
  onLogin: (user: UserAccount, token?: string) => void;
}

export const LoginView = ({ onLogin }: LoginViewProps) => {
  const { t } = useTranslation();
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

    setError(response.error || t('login.errorInvalid'));
    setIsLoading(false);
  };

  if (showForgotPassword) {
    return <ForgotPasswordView onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <Card className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500 border-border shadow-2xl p-2">
        <CardHeader className="text-center pb-4">
          {/* Logo */}
          <div className="mx-auto inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-blue border-2 border-gold mb-4 shadow-lg shadow-gold/20 overflow-hidden">
            <img src={logoImg} alt="MTEC Logo" className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-3xl font-bold text-gold tracking-wider">{t('login.title')}</CardTitle>
          <CardDescription className="text-sm mt-2">{t('login.subtitle')}</CardDescription>
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
                className="w-full font-bold"
                size="lg"
                isLoading={isLoading}
              >
                {!isLoading && <LogIn size={18} className="mr-2" />}
                {t('login.loginButton')}
              </Button>
            </div>
          </form>
        </CardContent>

        <div className="mt-4 pt-6 border-t border-border text-center pb-4">
          <p className="text-xs text-secondary">
            {t('login.footer')}
          </p>
        </div>
      </Card>
    </div>
  );
};
