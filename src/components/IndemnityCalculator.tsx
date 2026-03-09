import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Calendar, Clock, Banknote, AlertCircle, FileText, Printer } from 'lucide-react';
import { intervalToDuration } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { calculateIndemnity, IndemnityResult } from '../utils/indemnity';
import { cn } from '../utils/cn';

export default function IndemnityCalculator() {
  const [mode, setMode] = useState<'dates' | 'duration'>('dates');
  
  const [salary, setSalary] = useState<number | string>(400);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [durationYears, setDurationYears] = useState<number | string>(0);
  const [durationMonths, setDurationMonths] = useState<number | string>(0);
  const [durationDays, setDurationDays] = useState<number | string>(0);

  const [result, setResult] = useState<IndemnityResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-calculate duration when dates change
  useEffect(() => {
    if (mode === 'dates' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start <= end) {
        // We add 1 day to make it inclusive if standard practice?
        // Usually work duration is inclusive of the last day.
        // Let's stick to standard date diff for now.
        // If I work from Jan 1 to Jan 1, is it 1 day? Yes.
        // differenceInDays(Jan 2, Jan 1) = 1.
        // intervalToDuration tends to be exclusive of the end?
        // Let's verify `intervalToDuration`.
        // If start 2020-01-01, end 2021-01-01. Result 1 year.
        // If user selects last working day.
        
        const duration = intervalToDuration({ start, end });
        setDurationYears(duration.years || 0);
        setDurationMonths(duration.months || 0);
        setDurationDays(duration.days || 0);
      }
    }
  }, [startDate, endDate, mode]);

  const handleCalculate = () => {
    const s = Number(salary);
    const y = Number(durationYears);
    const m = Number(durationMonths);
    const d = Number(durationDays);

    if (isNaN(s) || isNaN(y) || isNaN(m) || isNaN(d)) return;

    const res = calculateIndemnity(s, y, m, d);
    setResult(res);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' د.ك';
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة');
      return;
    }

    const reportDate = new Date().toLocaleDateString('ar-KW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const content = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير نهاية الخدمة</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tajawal', Arial, sans-serif; background: white; color: #000; padding: 20px; }
          .report-container { max-width: 800px; margin: 0 auto; }
          .report-header {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 30px;
            page-break-after: avoid;
          }
          .report-header h1 { font-size: 28px; margin-bottom: 10px; }
          .report-header p { font-size: 14px; opacity: 0.9; margin-bottom: 5px; }
          .report-date { font-size: 12px; opacity: 0.8; }
          .report-section { margin-bottom: 30px; page-break-inside: avoid; }
          .section-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          .result-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            margin-bottom: 8px;
            border-radius: 6px;
          }
          .result-item.total {
            background: #f3f4f6;
            border: 2px solid #1f2937;
            font-weight: bold;
            font-size: 16px;
          }
          .result-label { color: #374151; font-weight: 500; }
          .result-value { color: #1f2937; font-weight: bold; font-size: 15px; direction: ltr; }
          .alert-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            font-size: 13px;
            color: #92400e;
            page-break-inside: avoid;
          }
          .info-box {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            font-size: 13px;
            color: #065f46;
            page-break-inside: avoid;
          }
          .report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            page-break-inside: avoid;
          }
          @media print {
            body { padding: 0; }
            .report-container { max-width: 100%; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <h1>تقرير نهاية الخدمة</h1>
            <p>نظام حساب مكافأة نهاية الخدمة</p>
            <p style="margin-top: 10px; font-size: 12px;">وفقاً لقوانين ديوان الخدمة المدنية - دولة الكويت</p>
            <div class="report-date">${reportDate}</div>
          </div>

          ${resultRef.current ? `
            <div class="report-section">
              <div class="section-title">معلومات الحساب</div>
              ${resultRef.current.innerHTML}
            </div>
          ` : ''}

          <div class="report-footer">
            <p>هذا التقرير تم إنشاؤه بواسطة نظام حساب نهاية الخدمة</p>
            <p style="margin-top: 10px; font-size: 11px;">تنبيه: هذه الحاسبة تقديرية فقط ولا تُعتَبر مرجعاً قانونياً أو مالياً</p>
          </div>
        </div>

        <script>
          window.print();
          window.close();
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleExportPDF = async () => {
    if (!resultRef.current) {
      alert('لم يتم العثور على البيانات المراد تصديرها');
      return;
    }

    try {
      // Create a professional report container
      const container = document.createElement('div');
      container.style.cssText = `
        background: white;
        color: black;
        padding: 40px 30px;
        font-family: 'Tajawal', Arial, sans-serif;
        font-size: 14px;
        direction: rtl;
        line-height: 1.6;
      `;

      // Add report header
      const header = document.createElement('div');
      header.style.cssText = `
        border-bottom: 3px solid #1f2937;
        padding-bottom: 20px;
        margin-bottom: 30px;
        text-align: center;
      `;
      
      const title = document.createElement('h1');
      title.textContent = 'تقرير نهاية الخدمة';
      title.style.cssText = 'font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px;';
      
      const subtitle = document.createElement('p');
      subtitle.textContent = 'نظام حساب مكافأة نهاية الخدمة';
      subtitle.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 5px;';
      
      const date = document.createElement('p');
      const now = new Date().toLocaleDateString('ar-KW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      date.textContent = `التاريخ: ${now}`;
      date.style.cssText = 'font-size: 12px; color: #999;';
      
      header.appendChild(title);
      header.appendChild(subtitle);
      header.appendChild(date);
      container.appendChild(header);

      // Add content
      const content = document.createElement('div');
      content.innerHTML = resultRef.current.innerHTML;

      // Clean and style the content
      content.querySelectorAll('*').forEach((el: any) => {
        el.removeAttribute('class');
        el.style.cssText = '';
      });

      content.querySelectorAll('h3').forEach((el: any) => {
        el.style.cssText = `
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin: 20px 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        `;
      });

      content.querySelectorAll('div').forEach((el: any) => {
        const text = el.textContent || '';
        
        if (text.includes('الإجمالي') || text.includes('المستحق') || text.includes('الخمس سنوات الأولى')) {
          el.style.cssText = `
            background: #f3f4f6;
            color: black;
            padding: 15px;
            margin: 12px 0;
            border-right: 4px solid #3b82f6;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
          `;
        } else if (text.includes('ثانياً') || text.includes('ثالثاً') || text.includes('رابعاً')) {
          el.style.cssText = `
            background: #f9fafb;
            color: black;
            padding: 12px;
            margin: 8px 0;
            border: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 500;
          `;
        } else if (text.includes('تجاوز') || text.includes('سقف')) {
          el.style.cssText = `
            background: #fef3c7;
            color: #92400e;
            padding: 12px;
            margin: 15px 0;
            border-right: 4px solid #f59e0b;
            border-radius: 4px;
            font-size: 13px;
          `;
        } else {
          el.style.cssText = `
            color: black;
            background: white;
            padding: 5px 0;
            margin: 0;
          `;
        }
      });

      // Hide buttons and SVGs
      content.querySelectorAll('button, svg').forEach((el: any) => {
        el.style.display = 'none';
      });

      container.appendChild(content);

      // Add footer
      const footer = document.createElement('div');
      footer.style.cssText = `
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 11px;
        color: #999;
      `;
      footer.innerHTML = `
        <p>وفقاً لقوانين ديوان الخدمة المدنية - دولة الكويت</p>
        <p style="margin-top: 8px;">تنبيه: هذه الحاسبة تقديرية فقط ولا تُعتَبر مرجعاً قانونياً أو مالياً</p>
      `;
      container.appendChild(footer);

      // Append to body temporarily
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowHeight: container.scrollHeight,
        windowWidth: container.scrollWidth,
      });

      // Remove from body
      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      }) as any;

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight < pageHeight - 40) {
        pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
      } else {
        let remainingHeight = imgHeight;
        let sourceY = 0;

        while (remainingHeight > 0) {
          const canvasHeight = Math.min(
            remainingHeight,
            (canvas.height * (pageHeight - 40)) / imgHeight
          );

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvasHeight;

          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              canvas,
              0,
              sourceY,
              canvas.width,
              canvasHeight,
              0,
              0,
              canvas.width,
              canvasHeight
            );

            const pageImgData = tempCanvas.toDataURL('image/png');
            const pageImgHeight = (canvasHeight * imgWidth) / canvas.width;
            pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, pageImgHeight);
          }

          sourceY += canvasHeight;
          remainingHeight -= canvasHeight;

          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      pdf.save(`تقرير-نهاية-الخدمة-${new Date().getTime()}.pdf`);
      alert('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`حدث خطأ أثناء تصدير PDF:\n${errorMsg}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100" dir="rtl">
      <div className="bg-slate-900 text-white p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-indigo-600 opacity-20 transform -skew-y-6 origin-top-left scale-150"></div>
        <h2 className="text-2xl font-bold relative z-10 flex items-center justify-center gap-2">
          <Calculator className="w-6 h-6" />
          نظام حساب نهاية الخدمة
        </h2>
        <p className="text-indigo-200 text-sm mt-2 relative z-10">وفقاً لقوانين ديوان الخدمة المدنية - دولة الكويت</p>
      </div>

      <div className="p-8 space-y-8">
        {/* Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMode('dates')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
              mode === 'dates' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Calendar className="w-4 h-4" />
            حسب التاريخ
          </button>
          <button
            onClick={() => setMode('duration')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
              mode === 'duration' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Clock className="w-4 h-4" />
            حسب المدة
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-slate-400" />
              الراتب الأساسي (د.ك)
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-left dir-ltr"
              placeholder="400"
            />
          </div>

          {mode === 'dates' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ التعيين</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-left"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ نهاية الخدمة</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-left"
                />
              </div>
            </div>
          ) : null}

          {/* Duration Display/Input */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              مدة الخدمة المحتسبة
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">سنوات</label>
                <input
                  type="number"
                  value={durationYears}
                  onChange={(e) => setDurationYears(e.target.value)}
                  readOnly={mode === 'dates'}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border outline-none text-center font-bold text-slate-800",
                    mode === 'dates' ? "bg-transparent border-transparent" : "bg-white border-slate-200 focus:border-indigo-500"
                  )}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">أشهر</label>
                <input
                  type="number"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  readOnly={mode === 'dates'}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border outline-none text-center font-bold text-slate-800",
                    mode === 'dates' ? "bg-transparent border-transparent" : "bg-white border-slate-200 focus:border-indigo-500"
                  )}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">أيام</label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  readOnly={mode === 'dates'}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border outline-none text-center font-bold text-slate-800",
                    mode === 'dates' ? "bg-transparent border-transparent" : "bg-white border-slate-200 focus:border-indigo-500"
                  )}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 text-lg"
          >
            احسب مكافأة نهاية الخدمة
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Print and Export Buttons */}
            <div className="flex gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                طباعة
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                تصدير PDF
              </button>
            </div>

            <div ref={resultRef} className="border-t border-slate-100 pt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">تفاصيل الاحتساب</h3>
              <div className="space-y-3">
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-600 font-medium">الخمس سنوات الأولى</span>
                  <span className="font-bold text-slate-900 dir-ltr">{formatCurrency(result.firstFiveAmount)}</span>
                </div>

                {(result.remainderYearsAmount > 0 || result.remainderMonthsAmount > 0 || result.remainderDaysAmount > 0) && (
                  <>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-slate-100">
                      <span className="text-slate-600">ثانياً عن السنوات المتبقية</span>
                      <span className="font-semibold text-slate-900 dir-ltr">{formatCurrency(result.remainderYearsAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-slate-100">
                      <span className="text-slate-600">ثالثاً عن الأشهر</span>
                      <span className="font-semibold text-slate-900 dir-ltr">{formatCurrency(result.remainderMonthsAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-slate-100">
                      <span className="text-slate-600">رابعاً عن الأيام</span>
                      <span className="font-semibold text-slate-900 dir-ltr">{formatCurrency(result.remainderDaysAmount)}</span>
                    </div>
                  </>
                )}
                
                {result.isCapped && (
                   <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>
                        تجاوز إجمالي المكافأة الحد الأقصى ({formatCurrency(result.capAmount)}). تم تطبيق سقف 18 راتب.
                      </p>
                   </div>
                )}

                <div className="mt-6 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-xl">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-indigo-200 font-medium">الإجمالي المستحق</span>
                    <span className="text-4xl font-bold tracking-tight dir-ltr">{formatCurrency(result.finalTotal)}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
