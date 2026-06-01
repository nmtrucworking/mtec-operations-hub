import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BellRing, CheckCheck, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLogs, type ActivityLog } from '../../services/logs';
import { getNotificationSettings, updateNotificationSettings } from '../../services/auth';
import {
  getBrowserPushPermission,
  isBrowserPushSupported,
  requestBrowserPushPermission,
  showBrowserPushNotification,
  type BrowserPushPermission,
} from '../../services/pushNotifications';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';

interface NotificationBellProps {
  authToken: string;
  userId: string;
  canReadActivity?: boolean;
  onOpenLogs?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  module: string;
  timestamp: string;
}

const POLL_INTERVAL_MS = 60_000;

const readJsonArray = (key: string) => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
};

const formatRelativeTime = (value: string) => {
  const timestamp = value ? new Date(value).getTime() : 0;
  if (!timestamp || Number.isNaN(timestamp)) return '';

  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return new Date(value).toLocaleDateString('vi-VN');
};

const toNotificationItem = (log: ActivityLog): NotificationItem => ({
  id: log.id,
  title: log.details || log.action || 'Hoạt động mới',
  body: `${log.user || 'System'} · ${log.module || 'SYSTEM'}`,
  module: log.module || 'SYSTEM',
  timestamp: log.timestamp,
});

export const NotificationBell = ({ authToken, userId, canReadActivity = false, onOpenLogs }: NotificationBellProps) => {
  const { t } = useTranslation();
  const { success, warning, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<BrowserPushPermission>(() => getBrowserPushPermission());
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const storageKey = `mtec.notifications.read:${userId}`;
  const unreadCount = useMemo(
    () => items.filter(item => !readIds.has(item.id)).length,
    [items, readIds]
  );

  const persistReadIds = (nextReadIds: Set<string>) => {
    setReadIds(nextReadIds);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(nextReadIds).slice(0, 250)));
  };

  const loadNotifications = async (silent = false) => {
    if (!authToken) return;
    if (!silent) setIsLoading(true);

    try {
      const [settingsRes, logsRes] = await Promise.all([
        getNotificationSettings(authToken),
        canReadActivity ? getLogs({ page: 1, pageSize: 12 }, authToken) : Promise.resolve(null),
      ]);

      const settingsPayload = ((settingsRes.data as any)?.data || settingsRes.data || {}) as Record<string, unknown>;
      const nextPushEnabled = Boolean(settingsPayload.pushNotifications ?? settingsPayload.noti2);
      setPushEnabled(nextPushEnabled);
      setPushPermission(getBrowserPushPermission());

      const storedReadIds = new Set(readJsonArray(storageKey));
      setReadIds(storedReadIds);

      const nextItems = (logsRes?.data?.logs ?? []).map(toNotificationItem);
      setItems(nextItems);

      if (initializedRef.current && nextPushEnabled && getBrowserPushPermission() === 'granted') {
        const newItems = nextItems.filter(item => !knownIdsRef.current.has(item.id) && !storedReadIds.has(item.id));
        for (const item of newItems.slice(0, 3)) {
          showBrowserPushNotification(item.title, {
            body: item.body,
            tag: item.id,
          });
        }
      }

      knownIdsRef.current = new Set(nextItems.map(item => item.id));
      initializedRef.current = true;
    } catch (err) {
      console.error('Failed to load notifications', err);
      if (!silent) error('Không thể tải thông báo.', 'Lỗi thông báo');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    setReadIds(new Set(readJsonArray(storageKey)));
    void loadNotifications(true);

    const intervalId = window.setInterval(() => {
      void loadNotifications(true);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, userId]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleOpen = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) void loadNotifications(true);
  };

  const markAsRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    persistReadIds(next);
  };

  const markAllAsRead = () => {
    persistReadIds(new Set([...readIds, ...items.map(item => item.id)]));
  };

  const handleEnablePush = async () => {
    if (!isBrowserPushSupported()) {
      warning('Trình duyệt hoặc ngữ cảnh hiện tại chưa hỗ trợ thông báo đẩy.', 'Không hỗ trợ push');
      return;
    }

    const permission = await requestBrowserPushPermission();
    setPushPermission(permission);
    if (permission !== 'granted') {
      warning('Hãy cấp quyền thông báo trong trình duyệt để bật push.', 'Cần cấp quyền');
      return;
    }

    const res = await updateNotificationSettings(
      {
        emailNotifications: false,
        pushNotifications: true,
        smsNotifications: false,
      },
      authToken
    );

    if (res.status < 200 || res.status >= 300) {
      error(res.error || 'Không thể bật thông báo đẩy.', 'Bật push thất bại');
      return;
    }

    setPushEnabled(true);
    success('Đã bật thông báo đẩy trên trình duyệt này.', 'Push notifications');
    showBrowserPushNotification('MTEC notifications enabled', {
      body: 'Bạn sẽ nhận thông báo khi có hoạt động mới.',
      tag: 'mtec-push-enabled',
    });
  };

  return (
    <div ref={wrapperRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={handleOpen}
        className="relative rounded-md p-2 text-secondary transition-colors hover:bg-brand-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-highlight"
        aria-label={t('notifications.open', 'Mở thông báo')}
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-danger-text px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-[min(92vw,380px)] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
          <div className="flex items-start justify-between gap-3 border-b border-border p-4">
            <div>
              <h3 className="font-bold text-foreground">{t('notifications.title', 'Thông báo')}</h3>
              <p className="mt-1 text-xs text-secondary">
                {pushEnabled
                  ? t('notifications.pushOn', 'Push đã bật')
                  : t('notifications.pushOff', 'Push chưa bật')}
                {' · '}
                {pushPermission === 'granted'
                  ? t('notifications.permissionGranted', 'Đã cấp quyền')
                  : t('notifications.permissionNeeded', 'Cần quyền trình duyệt')}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => void loadNotifications(false)}
                className="rounded-md p-1.5 text-secondary transition-colors hover:bg-brand-light hover:text-foreground"
                title={t('common.refresh', 'Làm mới')}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-secondary transition-colors hover:bg-brand-light hover:text-foreground"
                aria-label={t('common.close', 'Đóng')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2">
            <span className="text-xs font-medium text-secondary">
              {unreadCount > 0
                ? t('notifications.unreadCount', '{{count}} chưa đọc', { count: unreadCount })
                : t('notifications.allRead', 'Tất cả đã đọc')}
            </span>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-brand-light hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck size={14} />
              {t('notifications.markAllRead', 'Đánh dấu đã đọc')}
            </button>
          </div>

          {!pushEnabled && (
            <div className="border-b border-border/60 bg-brand-light/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 text-xs text-secondary">
                  {t('notifications.enableHint', 'Bật push để nhận thông báo khi có hoạt động mới.')}
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={handleEnablePush} className="shrink-0 gap-1">
                  <BellRing size={14} />
                  {t('notifications.enablePush', 'Bật push')}
                </Button>
              </div>
            </div>
          )}

          <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
            {isLoading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-secondary">
                <Loader2 size={18} className="animate-spin" />
                {t('notifications.loading', 'Đang tải thông báo...')}
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-secondary">
                {canReadActivity
                  ? t('notifications.empty', 'Chưa có thông báo nào.')
                  : t('notifications.noActivityAccess', 'Tài khoản này chưa có nguồn thông báo hoạt động. Bạn vẫn có thể bật push cho trình duyệt.')}
              </div>
            ) : (
              items.map(item => {
                const isUnread = !readIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => markAsRead(item.id)}
                    className={`flex w-full gap-3 border-b border-border/40 p-3 text-left transition-colors last:border-b-0 hover:bg-brand-light/70 ${
                      isUnread ? 'bg-primary/5' : ''
                    }`}
                  >
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${isUnread ? 'bg-primary' : 'bg-border'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</span>
                      <span className="mt-1 block truncate text-xs text-secondary">{item.body}</span>
                      <span className="mt-1 block text-[11px] text-secondary">{formatRelativeTime(item.timestamp)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {onOpenLogs && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenLogs();
              }}
              className="flex w-full items-center justify-center gap-2 border-t border-border p-3 text-sm font-medium text-primary transition-colors hover:bg-brand-light"
            >
              {t('notifications.openLogs', 'Xem nhật ký hoạt động')}
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
