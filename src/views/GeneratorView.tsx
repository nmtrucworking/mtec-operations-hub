import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileArchive, Loader2, Sparkles, UploadCloud, Wand2 } from 'lucide-react';
import { callGeminiAPI } from '../services/gemini';


interface GeneratorViewProps {
  
}

export const GeneratorView = () => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDraft = async () => {
    if (!prompt.trim()) {
      return;
    }

    setIsGenerating(true);
    const aiPrompt = `Đóng vai là thư ký CLB MTEC. Hãy soạn một đoạn nội dung trang trọng, ngắn gọn (tối đa 4 câu) để điền vào 'Thông báo nội bộ' (BM-MTEC-HC-03) dựa trên yêu cầu sau: ${prompt}. Trả lời trực tiếp nội dung, không giải thích dài dòng.`;
    const draft = await callGeminiAPI(aiPrompt);
    setAiDraft(draft);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">{t('generator.title')}</h2>
        <p className="text-blue-300 mt-1">{t('generator.subtitle')}</p>
      </div>

      <div className={`bg-card rounded-xl p-8 border border-[#2a4d85]`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">{t('generator.step1')}</label>
            <select className="w-full bg-[#0a1f3f] border border-[#2a4d85] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ffc20e] transition-colors">
              <option>{t('generator.opt1')}</option>
              <option>{t('generator.opt2')}</option>
              <option>{t('generator.opt3')}</option>
              <option>{t('generator.opt4')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">{t('generator.step2')}</label>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#2a4d85] rounded-lg hover:border-[#ffc20e] hover:bg-[#ffc20e]/5 transition-all">
                <UploadCloud size={32} className="mb-2 text-blue-300" />
                <span className="text-sm font-medium">{t('generator.btnUpload')}</span>
              </button>
              <button className="flex flex-col items-center justify-center p-5 border-2 border-[#2a4d85] bg-[#0a1f3f] rounded-lg hover:border-blue-400 transition-all">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" alt="Sheets" className="h-8 mb-2 opacity-80" />
                <span className="text-sm font-medium">{t('generator.btnLink')}</span>
              </button>
            </div>
          </div>

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
            {aiDraft ? <div className="p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-sm text-purple-100 italic">"{aiDraft}"</div> : null}
          </div>

          <div className="pt-6 border-t border-[#2a4d85] flex justify-end space-x-4">
            <button className="px-6 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:text-white transition-colors">
              {t('generator.btnPreview')}
            </button>
            <button className={`px-6 py-2.5 rounded-lg text-sm font-bold bg-gold text-[#061932] hover:bg-gold-hover flex items-center transition-colors shadow-lg shadow-yellow-500/20`}>
              <FileArchive size={18} className="mr-2" />
              {t('generator.btnExport')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
