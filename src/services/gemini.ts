export const callGeminiAPI = async (prompt: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  const fetchWithBackoff = async (retries = 5, delay = 1000): Promise<string> => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi từ AI.';
    } catch (error) {
      if (retries === 0) {
        return 'Lỗi: Không thể kết nối với Gemini AI lúc này. Vui lòng thử lại sau.';
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithBackoff(retries - 1, delay * 2);
    }
  };

  return fetchWithBackoff();
};
