import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileArchive, Loader2, Sparkles, UploadCloud, Wand2, Link, FileText, Check } from 'lucide-react';
import { 
  getAITemplates, 
  processAIContext, 
  exportAIDocument, 
  generateAIDraft,
  type AITemplate, 
  type AIProcessContextResponse 
} from '../services/ai';

interface GeneratorViewProps {
  authToken?: string;
}

export const GeneratorView = ({ authToken }: GeneratorViewProps) => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingContext, setIsProcessingContext] = useState(false);
  const [context, setContext] = useState<AIProcessContextResponse | null>(null);
  const [contextSource, setContextSource] = useState<'upload' | 'link' | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      const res = await getAITemplates(authToken);
      if (res.data) {
        setTemplates(res.data);
        if (res.data.length > 0) setSelectedTemplate(res.data[0].id);
      }
    };
    fetchTemplates();
  }, [authToken]);

  const handleProcessContext = async (source: 'upload' | 'link', content: string) => {
    setIsProcessingContext(true);
    setContextSource(source);
    setContextError(null);

    const res = await processAIContext({ source: source === 'upload' ? 'file' : 'link', content }, authToken);

    if (res.data) {
      setContext(res.data);
    } else {
      setContext(null);
      setContextError(res.error || 'Không thể xử lý ngữ cảnh.');
    }

    setIsProcessingContext(false);
  };

  const handleGenerateDraft = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await generateAIDraft({
        prompt,
        context: context?.preview || context?.message || undefined
      }, authToken);

      if (res.data) {
        setAiDraft(res.data.text);
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!aiDraft) return;

    const res = await exportAIDocument({
      content: aiDraft,
      templateId: selectedTemplate,
      title: `Document_${new Date().getTime()}`
    }, authToken);

    if (res.data?.downloadUrl) {
      window.open(res.data.downloadUrl, '_blank');
    }
  };

  const handlePreview = () => {
    if (!aiDraft) return;

    const nextWindow = window.open('', '_blank');
    if (!nextWindow) {
      return;
    }

    const safeTitle = `Preview_${new Date().toISOString().slice(0, 19)}`;
    const escaped = aiDraft
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    nextWindow.document.open();
    nextWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${safeTitle}</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;background:#061932;color:#e6f0ff;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial"><div style="padding:20px;max-width:900px;margin:0 auto"><h1 style="font-size:16px;margin:0 0 12px;color:#ffc20e">${safeTitle}</h1><pre style="white-space:pre-wrap;line-height:1.5;margin:0;padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.04)">${escaped}</pre></div></body></html>`);
    nextWindow.document.close();
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold">{t('generator.title')}</h2>
        <p className="text-blue-300 mt-1">{t('generator.subtitle')}</p>
      </div>

      <div className={`bg-card rounded-xl p-8 border border-[#2a4d85]`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="text/*,.txt,.md,.csv,.json,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
              const content = typeof reader.result === 'string' ? reader.result : '';
              void handleProcessContext('upload', content);
            };
            reader.onerror = () => {
              setContext(null);
              setContextSource('upload');
              setContextError('Không thể đọc file.');
            };
            reader.readAsText(file);

            e.target.value = '';
          }}
        />
        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">{t('generator.step1')}</label>
            <select 
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ffc20e] transition-colors"
            >
              {templates.map(tmpl => (
                <option key={tmpl.id} value={tmpl.id}>{tmpl.name} ({tmpl.code})</option>
              ))}
              {templates.length === 0 && (
                <>
                  <option>{t('generator.opt1')}</option>
                  <option>{t('generator.opt2')}</option>
                  <option>{t('generator.opt3')}</option>
                  <option>{t('generator.opt4')}</option>
                </>
              )}
            </select>
          </div>

          {/* Context Processing */}
          <div>
            <label className="block text-sm font-semibold mb-2">{t('generator.step2')}</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingContext}
                className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-lg transition-all ${
                  contextSource === 'upload' && context ? 'border-green-500 bg-green-500/5' : 'border-[#2a4d85] hover:border-[#ffc20e] hover:bg-[#ffc20e]/5'
                }`}
              >
                {isProcessingContext && contextSource === 'upload' ? (
                  <Loader2 size={32} className="mb-2 text-blue-300 animate-spin" />
                ) : contextSource === 'upload' && context ? (
                  <Check size={32} className="mb-2 text-green-500" />
                ) : (
                  <UploadCloud size={32} className="mb-2 text-blue-300" />
                )}
                <span className="text-sm font-medium">{t('generator.btnUpload')}</span>
              </button>
              <button 
                onClick={() => {
                  const link = window.prompt('Dán link Google Sheets (hoặc bất kỳ link dữ liệu):');
                  if (!link) return;
                  void handleProcessContext('link', link);
                }}
                disabled={isProcessingContext}
                className={`flex flex-col items-center justify-center p-5 border-2 rounded-lg transition-all ${
                  contextSource === 'link' && context ? 'border-green-500 bg-green-500/5' : 'border-[#2a4d85] bg-[#0a1f3f] hover:border-blue-400'
                }`}
              >
                {isProcessingContext && contextSource === 'link' ? (
                  <Loader2 size={32} className="mb-2 text-blue-300 animate-spin" />
                ) : contextSource === 'link' && context ? (
                  <Check size={32} className="mb-2 text-green-500" />
                ) : (
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" alt="Sheets" className="h-8 mb-2 opacity-80" />
                )}
                <span className="text-sm font-medium">{t('generator.btnLink')}</span>
              </button>
            </div>
            {contextError ? (
              <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
                <FileText size={18} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-300 uppercase tracking-wider">Lỗi xử lý ngữ cảnh</p>
                  <p className="text-sm text-red-100 mt-1">{contextError}</p>
                </div>
              </div>
            ) : context ? (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-start gap-3">
                <FileText size={18} className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Ngữ cảnh đã trích xuất</p>
                  <p className="text-sm text-blue-100 mt-1">{context.preview || context.message}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* AI Generation */}
          <div className="bg-[#0a1f3f]/50 border border-purple-500/30 rounded-lg p-5">
            <label className="flex items-center text-sm font-semibold mb-2 text-purple-300">
              <Wand2 size={16} className="mr-2" />
              {t('generator.aiTitle')}
            </label>
            <div className="flex space-x-3 mb-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('generator.aiPlaceholder')}
                className="flex-1 bg-[#1a3c6d] border border-[#2a4d85] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder-blue-400"
              />
              <button
                onClick={handleGenerateDraft}
                disabled={isGenerating || !prompt.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg text-sm font-medium transition-colors flex items-center whitespace-nowrap"
              >
                {isGenerating ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                {t('generator.btnDraft')}
              </button>
            </div>
            {aiDraft ? (
              <div className="p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg text-sm text-purple-100 whitespace-pre-wrap">
                {aiDraft}
              </div>
            ) : null}
          </div>

          <div className="pt-6 border-t border-[#2a4d85] flex justify-end space-x-4">
            <button
              onClick={handlePreview}
              disabled={!aiDraft}
              title={!aiDraft ? 'Chưa có nội dung để xem trước' : undefined}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('generator.btnPreview')}
            </button>
            <button
              onClick={handleExport}
              disabled={!aiDraft}
              title={!aiDraft ? 'Chưa có nội dung để xuất file' : undefined}
              className="px-6 py-2.5 rounded-lg text-sm font-bold bg-gold text-[#061932] hover:bg-gold-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors shadow-lg shadow-yellow-500/20"
            >
              <FileArchive size={18} className="mr-2" />
              {t('generator.btnExport')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
