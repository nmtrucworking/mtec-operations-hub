import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, LogIn, Mail } from 'lucide-react';
import { login as loginRequest } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ForgotPasswordView } from './ForgotPasswordView';
import type { UserAccount, UserRole } from '../types/app';

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

  const extractLoginPayload = (payload: unknown) => {
    const record = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    const nestedData = record.data && typeof record.data === 'object' ? (record.data as Record<string, unknown>) : null;

    if (record.success && nestedData) {
      return nestedData;
    }

    if (
      nestedData &&
      (
        'accessToken' in nestedData ||
        'access_token' in nestedData ||
        'token' in nestedData ||
        'user' in nestedData ||
        'account' in nestedData
      )
    ) {
      return nestedData;
    }

    return record;
  };

  const normalizeUser = (payload: unknown): UserAccount => {
    const record = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    const fullName = String(record.fullName ?? record.full_name ?? record.name ?? '').trim();
    const usernameValue = String(record.username ?? username).trim();
    const role = String(record.role ?? 'member') as UserRole;
    const initials = String(
      record.avatarInitials ??
        record.avatar_initials ??
        (fullName
          ? fullName
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join('')
          : usernameValue.slice(0, 2).toUpperCase())
    );

    return {
      id: String(record.id ?? usernameValue),
      username: usernameValue,
      password: String(record.password ?? password),
      fullName: fullName || usernameValue,
      role,
      avatarInitials: initials || usernameValue.slice(0, 2).toUpperCase()
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError(t('login.errorEmpty'));
      return;
    }

    setIsLoading(true);

    const response = await loginRequest(username.trim(), password);
    const responseBody = response.data as any;

    if (response.status >= 200 && response.status < 300 && responseBody) {
      const actualPayload = extractLoginPayload(responseBody) as Record<string, unknown>;
      const userPayload = actualPayload.user ?? actualPayload.account ?? actualPayload;
      const token = String(
        actualPayload.accessToken ??
          actualPayload.access_token ??
          actualPayload.token ??
          (responseBody as Record<string, unknown>).accessToken ??
          (responseBody as Record<string, unknown>).access_token ??
          (responseBody as Record<string, unknown>).token ??
          ''
      );
      
      onLogin(normalizeUser(userPayload), token || undefined);
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
          <div className="mx-auto inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-blue border-2 border-gold mb-4 shadow-lg shadow-gold/20">
            <Lock size={32} className="text-gold" />
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
