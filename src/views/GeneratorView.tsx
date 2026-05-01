import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileArchive, Loader2, Sparkles, UploadCloud, Wand2, Link, FileText, Check } from 'lucide-react';
import { getAITemplates, processAIContext, exportAIDocument, type AITemplate, type AIProcessContextResponse } from '../services/ai';

export const GeneratorView = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingContext, setIsProcessingContext] = useState(false);
  const [context, setContext] = useState<AIProcessContextResponse | null>(null);
  const [contextSource, setContextSource] = useState<'upload' | 'link' | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      const res = await getAITemplates();
      if (res.data) {
        setTemplates(res.data);
        if (res.data.length > 0) setSelectedTemplate(res.data[0].id);
      }
    };
    fetchTemplates();
  }, []);

  const handleProcessContext = async (source: 'upload' | 'link') => {
    setIsProcessingContext(true);
    setContextSource(source);
    
    // In a real app, this would involve a file upload or a prompt for a link
    // For now we simulate with mock data from the backend call
    const res = await processAIContext({ 
      text: source === 'upload' ? "Dữ liệu từ file upload..." : "Dữ liệu từ link Google Sheets..." 
    });
    
    if (res.data) {
      setContext(res.data);
    }
    setIsProcessingContext(false);
  };

  const handleGenerateDraft = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    // Simulate AI generation through backend (though we don't have a direct generate endpoint in the report, 
    // it's usually part of the process or a separate one. The report mentions process-context)
    
    // For the sake of this task, we'll simulate the backend generating the draft
    setTimeout(() => {
      const templateName = templates.find(t => t.id === selectedTemplate)?.name || 'văn bản';
      setAiDraft(`[DỰ THẢO ${templateName}]\nDựa trên ngữ cảnh: ${context?.summary || 'không có'}\nYêu cầu: ${prompt}\n\nNội dung: CLB MTEC thông báo về việc triển khai hoạt động mới...`);
      setIsGenerating(false);
    }, 1500);
  };

  const handleExport = async () => {
    if (!aiDraft) return;

    const res = await exportAIDocument({
      content: aiDraft,
      templateId: selectedTemplate,
      title: `Document_${new Date().getTime()}`
    });

    if (res.data?.downloadUrl) {
      window.open(res.data.downloadUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">{t('generator.title')}</h2>
        <p className="text-blue-300 mt-1">{t('generator.subtitle')}</p>
      </div>

      <div className={`bg-card rounded-xl p-8 border border-[#2a4d85]`}>
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
                onClick={() => handleProcessContext('upload')}
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
                onClick={() => handleProcessContext('link')}
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
            {context && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-start gap-3">
                <FileText size={18} className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Ngữ cảnh đã trích xuất</p>
                  <p className="text-sm text-blue-100 mt-1">{context.summary}</p>
                </div>
              </div>
            )}
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
              disabled={!aiDraft}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:text-white disabled:opacity-50 transition-colors"
            >
              {t('generator.btnPreview')}
            </button>
            <button 
              onClick={handleExport}
              disabled={!aiDraft}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold bg-gold text-[#061932] hover:bg-gold-hover disabled:opacity-50 flex items-center transition-colors shadow-lg shadow-yellow-500/20`}
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
