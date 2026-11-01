import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReset = () => {
    try {
      // If error is storage quota related, clear problem key
      localStorage.removeItem('said_store_hero_slides_v2');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080C0A] text-[#F3EFE6] flex items-center justify-center p-4 font-['Tajawal',sans-serif]">
          <div className="max-w-md w-full bg-[#121A16] border border-[#2B3C31] rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Cairo']">
                حدث خطأ غير متوقع
              </h2>
              <p className="text-xs sm:text-sm text-[#A89C89] leading-relaxed">
                نعتذر عن هذا الخطأ المؤقت. تم تسجيل المشكلة ويمكنك إعادة المحاولة بسهولة.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1A2520] hover:bg-[#25352D] text-[#FAF5EC] font-bold py-3 px-4 rounded-xl text-xs sm:text-sm border border-[#2B3C31] transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#F3BA63]" />
                <span>تحديث الصفحة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
