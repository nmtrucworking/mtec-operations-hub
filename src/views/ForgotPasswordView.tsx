import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, ChevronLeft, CheckCircle } from 'lucide-react';
import { forgotPassword, verifyResetToken, resetPassword } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

interface ForgotPasswordViewProps {
  onBack: () => void;
}

type Step = 'request' | 'verify' | 'reset' | 'success';

export const ForgotPasswordView = ({ onBack }: ForgotPasswordViewProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Request reset
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Step 3: Reset password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailOrUsername.trim()) {
      setError(t('login.errorEmpty'));
      return;
    }

    setIsLoading(true);
    const response = await forgotPassword(emailOrUsername.trim());

    if (response.status >= 200 && response.status < 300) {
      setSuccess(t('auth.successMessage'));
      setStep('verify');
      // In a real scenario, backend would send reset token via email
      // For now, we'll ask user to enter token manually or check email
    } else {
      setError(response.error || 'Failed to send reset email');
    }
    setIsLoading(false);
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetToken.trim()) {
      setError('Please enter the reset token');
      return;
    }

    setIsLoading(true);
    const response = await verifyResetToken(resetToken.trim());

    if (response.status >= 200 && response.status < 300) {
      setStep('reset');
      setError('');
    } else {
      setError(response.error || t('auth.invalidToken'));
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError(t('login.errorEmpty'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (!validatePassword(newPassword)) {
      setError(t('auth.passwordWeak'));
      return;
    }

    setIsLoading(true);
    const response = await resetPassword(resetToken, newPassword);

    if (response.status >= 200 && response.status < 300) {
      setStep('success');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError(response.error || 'Failed to reset password');
    }
    setIsLoading(false);
  };

  const handleBackToLogin = () => {
    setStep('request');
    setEmailOrUsername('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onBack();
  };

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
          <CardTitle className="text-3xl font-bold text-gold tracking-wider">
            {step === 'request' && t('auth.forgotPasswordTitle')}
            {step === 'verify' && 'Verify Reset Token'}
            {step === 'reset' && t('auth.resetPasswordTitle')}
            {step === 'success' && 'Success!'}
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            {step === 'request' && t('auth.forgotPasswordSubtitle')}
            {step === 'verify' && 'Check your email for the reset token'}
            {step === 'reset' && t('auth.resetPasswordSubtitle')}
            {step === 'success' && 'Your password has been reset successfully'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'success' ? (
            <div className="space-y-6 text-center">
              <CheckCircle size={64} className="mx-auto text-green-500" />
              <div className="space-y-2">
                <p className="text-primary font-medium">Password Reset Successful</p>
                <p className="text-sm text-secondary">You can now log in with your new password.</p>
              </div>
              <Button onClick={handleBackToLogin} className="w-full">
                {t('auth.backToLogin')}
              </Button>
            </div>
          ) : (
            <form
              onSubmit={
                step === 'request'
                  ? handleRequestReset
                  : step === 'verify'
                    ? handleVerifyToken
                    : handleResetPassword
              }
              className="space-y-5"
            >
              {error && (
                <div className="p-3 rounded-lg bg-danger-bg border border-danger-border text-danger-text text-sm text-center">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm text-center">
                  {success}
                </div>
              )}

              {step === 'request' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary block">
                    {t('auth.emailOrUsernameLabel')}
                  </label>
                  <Input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder={t('auth.emailOrUsernamePlaceholder')}
                    icon={<Mail size={18} />}
                  />
                </div>
              )}

              {step === 'verify' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary block">Reset Token</label>
                  <Input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter the token from your email"
                  />
                  <p className="text-xs text-secondary italic">
                    If you don't see the email, check your spam folder.
                  </p>
                </div>
              )}

              {step === 'reset' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary block">
                      {t('auth.newPasswordLabel')}
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters, uppercase, lowercase, and numbers"
                      icon={<Lock size={18} />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary block">
                      {t('auth.confirmPasswordLabel')}
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      icon={<Lock size={18} />}
                    />
                  </div>
                </>
              )}

              <div className="pt-2 space-y-3">
                <Button type="submit" className="w-full font-bold" isLoading={isLoading}>
                  {step === 'request' && t('auth.sendButton')}
                  {step === 'verify' && 'Verify Token'}
                  {step === 'reset' && t('auth.resetButton')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                >
                  <ChevronLeft size={16} className="mr-2" />
                  {t('auth.backToLogin')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
