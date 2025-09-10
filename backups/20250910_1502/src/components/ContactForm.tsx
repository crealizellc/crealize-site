import React, { useState } from 'react';

/**
 * 联系我们表单组件
 * 字段：姓名、公司名、Email（必填）、Telegram账号、内容（必填）
 * 提交到 Google Apps Script/Sheet API
 */
const GOOGLE_SCRIPT_URL = '' // TODO: 填写你的 Google Apps Script 部署链接

export const ContactForm: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    telegram: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!form.email || !form.message) {
      setError('請填寫必填項');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        setForm({ name: '', company: '', email: '', telegram: '', message: '' });
      } else {
        setError('提交失敗，請稍後再試');
      }
    } catch {
      setError('網絡錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-[480px] mx-auto bg-white rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col mt-24 mb-24 border border-gray-100"
      style={{ isolation: 'isolate', boxShadow: '0 8px 32px 0 rgba(34,34,34,0.12)', backdropFilter: 'blur(2px)', outline: '2px solid red' }}
    >
      <div className="mb-6">
        <div className="font-brand text-2xl sm:text-3xl font-bold mb-2 text-gray-900 tracking-wide" style={{letterSpacing:'0.04em'}}>聯繫我們</div>
        <div className="text-gray-500 text-base">歡迎商務合作、媒體聯繫、技術諮詢或加入團隊</div>
      </div>
      <form
        className="flex flex-col gap-5"
        style={{ isolation: 'isolate' }}
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <input
          className="w-full block text-base font-normal text-gray-800 font-sans border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black bg-gray-50 placeholder-gray-400 transition"
          type="text"
          name="name"
          placeholder="姓名（必填）"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="w-full block text-base font-normal text-gray-800 font-sans border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black bg-gray-50 placeholder-gray-400 transition"
          type="text"
          name="company"
          placeholder="公司名（可選）"
          value={form.company}
          onChange={handleChange}
        />
        <input
          className="w-full block text-base font-normal text-gray-800 font-sans border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black bg-gray-50 placeholder-gray-400 transition"
          type="email"
          name="email"
          placeholder="Email（必填）"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="w-full block text-base font-normal text-gray-800 font-sans border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black bg-gray-50 placeholder-gray-400 transition"
          type="text"
          name="telegram"
          placeholder="Telegram帳號（可選）"
          value={form.telegram}
          onChange={handleChange}
        />
        <textarea
          className="w-full block text-base font-normal text-gray-800 font-sans border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-black bg-gray-50 placeholder-gray-400 min-h-[112px] transition"
          name="message"
          placeholder="內容（必填）"
          value={form.message}
          onChange={handleChange}
          required
        />
        {error && <div className="text-red-500 text-sm text-center leading-[1]">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center leading-[1]">感謝您的聯繫，我們會盡快回覆！</div>}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-black text-white font-semibold text-lg shadow-md hover:bg-gray-900 transition disabled:opacity-60 mt-2"
          disabled={loading}
        >
          {loading ? '發送中…' : '發送'}
        </button>
      </form>
    </div>
  );
};

export default ContactForm; 