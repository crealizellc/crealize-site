import React, { useState } from 'react';
import { BrandHeroText } from './BrandHeroText';

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
      setError('请填写必填项');
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
        setError('提交失败，请稍后再试');
      }
    } catch (err) {
      setError('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto bg-white rounded-xl shadow p-8 flex flex-col gap-4 mt-12 mb-8" style={{ isolation: 'isolate' }}>
      <form
        className="!flex !flex-col !gap-[0.25em] !leading-[1]"
        style={{ isolation: 'isolate' }}
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <input
          className="!block !w-full text-base font-normal text-gray-700 font-sans border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black leading-[1] appearance-none placeholder-gray-400"
          type="text"
          name="name"
          placeholder="姓名（必填）"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="!block !w-full text-base font-normal text-gray-700 font-sans border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black leading-[1] appearance-none placeholder-gray-400"
          type="text"
          name="company"
          placeholder="公司名（可选）"
          value={form.company}
          onChange={handleChange}
        />
        <input
          className="!block !w-full text-base font-normal text-gray-700 font-sans border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black leading-[1] appearance-none placeholder-gray-400"
          type="email"
          name="email"
          placeholder="Email（必填）"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="!block !w-full text-base font-normal text-gray-700 font-sans border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black leading-[1] appearance-none placeholder-gray-400"
          type="text"
          name="telegram"
          placeholder="Telegram账号（可选）"
          value={form.telegram}
          onChange={handleChange}
        />
        <textarea
          className="!block !w-full text-base font-normal text-gray-700 font-sans border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-black min-h-[96px] leading-[1] appearance-none placeholder-gray-400"
          name="message"
          placeholder="内容（必填）"
          value={form.message}
          onChange={handleChange}
          required
        />
        {error && <div className="text-red-500 text-sm text-center leading-[1]">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center leading-[1]">感谢您的联系，我们会尽快回复！</div>}
        <button
          type="submit"
          className="!block !w-full btn-brand py-2 rounded bg-black text-white font-semibold text-lg shadow hover:bg-gray-800 transition disabled:opacity-60 leading-[1]"
          disabled={loading}
        >
          {loading ? '发送中…' : '发送'}
        </button>
      </form>
    </div>
  );
};

export default ContactForm; 