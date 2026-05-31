import React, { type ReactNode } from 'react';
import { CheckCircle2, FileText, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const NavItem = ({ icon, label, isActive, onClick }: NavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-secondary hover:bg-brand-light hover:text-primary'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export const StatCard = ({ title, value, icon, trend, trendUp, color = 'text-gold' }: StatCardProps) => {
  const { t } = useTranslation();
  return (
    <div className="bg-card p-4 rounded-lg border border-border">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-secondary font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-semibold">{value}</h3>
        </div>
        <div className={`p-2 rounded-md bg-background ${color}`}>{icon}</div>
      </div>
      {trend ? (
        <div className="mt-4 flex items-center text-sm">
          <span className={trendUp === false ? 'text-danger-text' : 'text-success-text'}>{trend}</span>
          <span className="text-secondary ml-2">{t('common.vsLastMonth', 'so với tháng trước')}</span>
        </div>
      ) : null}
    </div>
  );
};

interface ProgressBarProps {
  label: string;
  percent: number;
  color: string;
}

export const ProgressBar = ({ label, percent, color }: ProgressBarProps) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span>{label}</span>
      <span className="font-semibold">{percent}%</span>
    </div>
    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
    </div>
  </div>
);

interface ActivityItemProps {
  title: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}

export const ActivityItem = ({ title, time, type }: ActivityItemProps) => {
  const icons = {
    success: <CheckCircle2 size={16} className="text-green-400" />,
    warning: <XCircle size={16} className="text-red-400" />,
    info: <FileText size={16} className="text-blue-400" />
  };

  return (
    <div className="flex items-start">
      <div className="mt-1 mr-3">{icons[type]}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-secondary">{time}</p>
      </div>
    </div>
  );
};

interface MemberRowProps {
  mssv: string;
  name: string;
  ban: string;
  role: string;
  status: 'Active' | 'Inactive';
}

export const MemberRow = ({ mssv, name, ban, role, status }: MemberRowProps) => (
  <tr className="hover:bg-brand-light transition-colors">
    <td className="p-4">{mssv}</td>
    <td className="p-4 font-medium">{name}</td>
    <td className="p-4">{ban}</td>
    <td className="p-4">{role}</td>
    <td className="p-4">
      <span
        className={`px-2 py-1 text-xs font-medium rounded-md ${
          status === 'Active'
            ? 'bg-success-bg text-success-text border border-success-border'
            : 'bg-danger-bg text-danger-text border border-danger-border'
        }`}
      >
        {status}
      </span>
    </td>
  </tr>
);

interface RequestCardProps {
  name: string;
  mssv: string;
  date: string;
  reason?: string;
  status?: string;
}

export const RequestCard = ({ name, mssv, date, reason, status }: RequestCardProps) => {
  const { t } = useTranslation();
  return (
    <div className="p-4 bg-card rounded-lg border border-border flex justify-between items-center">
      <div>
        <p className="font-medium text-sm">
          {name} <span className="text-secondary text-xs ml-1">({mssv})</span>
        </p>
        {reason ? (
          <p className="text-xs text-danger-text mt-1">
            {t('common.reason', 'Lý do')}: {reason}
          </p>
        ) : null}
        <p className="text-xs text-primary mt-1">
          {t('common.submittedAt', 'Nộp')}: {date}
        </p>
      </div>
      <div>
        {status ? (
          <span className="text-xs font-medium px-2 py-1 bg-success-bg text-success-text rounded-md">{status}</span>
        ) : (
          <button className="text-xs font-medium px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary-focus transition-colors">
            {t('requests.approveBtn', 'Duyệt')}
          </button>
        )}
      </div>
    </div>
  );
};
