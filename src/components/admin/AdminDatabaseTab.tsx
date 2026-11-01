import React from 'react';
import { Database, Download, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface AdminDatabaseTabProps {
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminDatabaseTab: React.FC<AdminDatabaseTabProps> = ({ showNotification }) => {
  const dataFiles = [
    { name: 'products.json', label: 'قاعدة بيانات المنتجات', size: 'Unknown' },
    { name: 'categories.json', label: 'قاعدة بيانات التصنيفات', size: 'Unknown' },
    { name: 'orders.json', label: 'قاعدة بيانات الطلبات', size: 'Unknown' },
    { name: 'sellers.json', label: 'قاعدة بيانات البائعين', size: 'Unknown' },
    { name: 'stores.json', label: 'قاعدة بيانات المتاجر', size: 'Unknown' },
    { name: 'settings.json', label: 'إعدادات المتجر العامة', size: 'Unknown' },
    { name: 'store.json', label: 'الملف الرئيسي (Master DB)', size: 'Unknown' },
  ];

  const handleDownload = (filename: string) => {
    const url = `/data/${filename}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`تم بدء تحميل ملف ${filename} بنجاح.`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#213027]">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Cairo']">إدارة ملفات البيانات (Local Storage)</h3>
            <p className="text-xs text-[#8A9B90]">تصفح وحمل ملفات JSON الخاصة بمتجرك مباشرة من الخادم.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dataFiles.map((file) => (
            <div 
              key={file.name}
              className="bg-[#15201A] border border-[#26372D] rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#1A2821] text-[#A89C89] group-hover:text-emerald-400 transition-colors">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{file.label}</div>
                  <div className="text-[10px] text-[#8A9B90] font-mono">{file.name}</div>
                </div>
              </div>
              
              <button
                onClick={() => handleDownload(file.name)}
                className="p-2.5 rounded-xl bg-[#1E2B22] text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all shadow-lg cursor-pointer"
                title="تحميل الملف"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-amber-950/20 border border-amber-900/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-200/80 leading-relaxed">
            <strong className="text-amber-500 block mb-1">تنبيه أمني هام:</strong>
            هذه الملفات تحتوي على جميع بيانات متجرك، زبائنك، وطلباتك. يرجى عدم مشاركتها مع أي جهة غير موثوقة. 
            تأكد دائماً من أخذ نسخة احتياطية (Backup) بانتظام لضمان سلامة بياناتك في حالة حدوث أي طارئ.
          </div>
        </div>
      </div>

      <div className="bg-[#101713] border border-[#213027] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>حالة الاتصال بقاعدة البيانات:</span>
        </h4>
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#8A9B90]">نوع التخزين:</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">Local JSON Persistence</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#8A9B90]">حالة الخادم:</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              متصل ويعمل (Active)
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#8A9B90]">المسار الجذري:</span>
            <span className="text-[10px] font-mono text-[#8A9B90] bg-[#15201A] px-2 py-1 rounded-lg border border-[#26372D]">/app/applet/data/</span>
          </div>
        </div>
      </div>
    </div>
  );
};
