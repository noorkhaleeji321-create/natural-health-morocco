import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';

const container = document.getElementById('root');
if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (err) {
    console.error('Fatal initialization error:', err);
    container.innerHTML = `
      <div style="min-height: 100vh; background-color: #0C100E; color: #FAF5EC; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Cairo', sans-serif; text-align: center; padding: 24px;">
        <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #EF4444; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">⚠️</div>
        <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #FAF5EC;">حدث خطأ أثناء تحميل المتجر</h2>
        <p style="font-size: 13px; color: #A89C89; max-width: 420px; margin: 0 0 24px 0; line-height: 1.6;">تم تسجيل المشكلة. يمكنك إعادة تحميل الصفحة لإعادة تهيئة البيانات بنجاح.</p>
        <button onclick="window.location.reload();" style="background-color: #D97706; color: white; border: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);">
          إعادة تحميل المتجر
        </button>
      </div>
    `;
  }
}

