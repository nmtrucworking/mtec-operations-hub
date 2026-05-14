import React, { useState } from 'react';
import { FileText, Link, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { Badge } from '../components/ui/badge';
import type { Meeting } from '../services/meetings';
import { updateMeeting } from '../services/meetings';

interface MeetingMinutesProps {
  meeting: Meeting;
  authToken?: string;
  onUpdate?: () => void;
}

export const MeetingMinutes = ({ meeting, authToken, onUpdate }: MeetingMinutesProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [minutesUrl, setMinutesUrl] = useState(meeting.minutesUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isValidGoogleDriveUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty
    return url.includes('docs.google.com') || url.includes('drive.google.com');
  };

  const handleSave = async () => {
    if (!isValidGoogleDriveUrl(minutesUrl)) {
      setError('Vui lòng nhập URL từ Google Drive hoặc Google Docs');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateMeeting(meeting.id, { minutesUrl }, authToken);
      if (res.status === 200) {
        setIsEditModalOpen(false);
        setError('');
        if (onUpdate) onUpdate();
      } else {
        setError(res.message || 'Lỗi cập nhật biên bản');
      }
    } catch (err) {
      setError('Không thể cập nhật biên bản');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-2">
        {meeting.minutesUrl ? (
          <>
            <Badge variant="secondary" className="bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <FileText size={12} className="mr-1" /> Có biên bản
            </Badge>
            <a
              href={meeting.minutesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ExternalLink size={14} />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMinutesUrl(meeting.minutesUrl || '')}
              className="h-6 w-6 p-0 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Pencil size={14} />
            </Button>
          </>
        ) : (
          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900">
            <Pencil size={12} className="mr-1" /> Thêm biên bản
          </Badge>
        )}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setError('');
          setMinutesUrl(meeting.minutesUrl || '');
        }}
        title="Cập nhật biên bản cuộc họp"
      >
        <form onSubmit={(e) => { e.preventDefault(); void handleSave(); }} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              URL biên bản từ Google Drive/Google Docs
            </label>
            <Input
              type="url"
              value={minutesUrl}
              onChange={(e) => {
                setMinutesUrl(e.target.value);
                setError('');
              }}
              placeholder="https://docs.google.com/document/d/... hoặc https://drive.google.com/..."
              className="rounded-xl"
            />
            <p className="text-xs text-secondary mt-2">
              💡 Hỗ trợ: Google Docs (tài liệu), Google Drive (file), Sheet hoặc Slides
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setIsEditModalOpen(false);
                setError('');
                setMinutesUrl(meeting.minutesUrl || '');
              }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>
      </Modal>

      {!isEditModalOpen && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditModalOpen(true)}
          className="text-sm"
        >
          <Pencil size={14} className="mr-1" />
          {meeting.minutesUrl ? 'Sửa' : 'Thêm'} biên bản
        </Button>
      )}
    </>
  );
};
