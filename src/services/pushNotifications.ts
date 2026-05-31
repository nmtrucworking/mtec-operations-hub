export type BrowserPushPermission = NotificationPermission | 'unsupported';

export const isBrowserPushSupported = () =>
  typeof window !== 'undefined' &&
  typeof Notification !== 'undefined' &&
  (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const getBrowserPushPermission = (): BrowserPushPermission => {
  if (!isBrowserPushSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestBrowserPushPermission = async (): Promise<BrowserPushPermission> => {
  if (!isBrowserPushSupported()) return 'unsupported';
  return Notification.requestPermission();
};

export const showBrowserPushNotification = (title: string, options?: NotificationOptions) => {
  if (!isBrowserPushSupported() || Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    badge: '/favicon.ico',
    icon: '/favicon.ico',
    ...options
  });

  window.setTimeout(() => notification.close(), 6000);
};
