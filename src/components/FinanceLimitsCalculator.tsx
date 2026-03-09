import React, { useMemo, useState, useRef } from "react";
import { Wallet, Percent, CalendarClock, CreditCard, Info, FileText, Printer } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "../utils/cn";

const formatCurrency = (val: number) => {
  if (!isFinite(val)) return "-";
  return (
    val.toLocaleString("en-US", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }) + " د.ك"
  );
};

export default function FinanceLimitsCalculator() {
  const [netSalary, setNetSalary] = useState<string | number>("1000");
  const [maxDeductionPercent, setMaxDeductionPercent] = useState<string | number>(40);
  const [annualRatePercent, setAnnualRatePercent] = useState<string | number>(5);
  const [loanYears, setLoanYears] = useState<string | number>(5);
  const [purchaseYears, setPurchaseYears] = useState<string | number>(4);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    monthlyCap,
    loanMax,
    purchaseMax,
    loanMonths,
    purchaseMonths,
  } = useMemo(() => {
    const s = Number(netSalary);
    const p = Number(maxDeductionPercent);
    const rYear = Number(annualRatePercent);
    const yearsLoan = Number(loanYears);
    const yearsPurchase = Number(purchaseYears);

    if ([s, p, rYear, yearsLoan, yearsPurchase].some((v) => !isFinite(v) || v < 0)) {
      return {
        monthlyCap: 0,
        loanMax: 0,
        purchaseMax: 0,
        loanMonths: yearsLoan * 12,
        purchaseMonths: yearsPurchase * 12,
      };
    }

    const monthlyCapCalculated = (s * p) / 100;

    const rMonthly = rYear / 100 / 12;
    const nLoan = Math.max(1, Math.round(yearsLoan * 12));
    const nPurchase = Math.max(1, Math.round(yearsPurchase * 12));

    const principalFromPayment = (payment: number, r: number, n: number) => {
      if (payment <= 0 || n <= 0) return 0;
      if (r <= 0) return payment * n;
      const factor = r / (1 - Math.pow(1 + r, -n));
      return payment / factor;
    };

    const loanPrincipal = principalFromPayment(monthlyCapCalculated, rMonthly, nLoan);
    const purchasePrincipal = principalFromPayment(monthlyCapCalculated, rMonthly, nPurchase);

    return {
      monthlyCap: monthlyCapCalculated,
      loanMax: loanPrincipal,
      purchaseMax: purchasePrincipal,
      loanMonths: nLoan,
      purchaseMonths: nPurchase,
    };
  }, [annualRatePercent, loanYears, maxDeductionPercent, netSalary, purchaseYears]);

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
        <title>تقرير حدود القروض</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tajawal', Arial, sans-serif; background: white; color: #000; padding: 20px; }
          .report-container { max-width: 800px; margin: 0 auto; }
          .report-header {
            background: linear-gradient(135deg, #065f46 0%, #059669 100%);
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
          .section-title { font-size: 18px; font-weight: bold; color: #065f46; margin-bottom: 15px; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
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
            background: #f0fdf4;
            border: 2px solid #065f46;
            font-weight: bold;
            font-size: 16px;
          }
          .result-label { color: #374151; font-weight: 500; }
          .result-value { color: #065f46; font-weight: bold; font-size: 15px; direction: ltr; }
          .alert-box {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            font-size: 13px;
            color: #065f46;
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
            <h1>تقرير حدود القروض والاستقطاع</h1>
            <p>حاسبة حدود القروض والاستقطاع من الراتب</p>
            <p style="margin-top: 10px; font-size: 12px;">وفق الضوابط الشائعة لبنك الكويت المركزي وديوان الخدمة المدنية</p>
            <div class="report-date">${reportDate}</div>
          </div>

          ${resultRef.current ? `
            <div class="report-section">
              <div class="section-title">نتائج الحساب</div>
              ${resultRef.current.innerHTML}
            </div>
          ` : ''}

          <div class="report-footer">
            <p>هذا التقرير تم إنشاؤه بواسطة حاسبة حدود القروض والاستقطاع</p>
            <p style="margin-top: 10px; font-size: 11px;">تنبيه: هذه الحاسبة تقديرية فقط ولا تُعتَبر استشارة مالية أو قانونية</p>
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
        border-bottom: 3px solid #065f46;
        padding-bottom: 20px;
        margin-bottom: 30px;
        text-align: center;
      `;
      
      const title = document.createElement('h1');
      title.textContent = 'تقرير حدود القروض والاستقطاع';
      title.style.cssText = 'font-size: 24px; font-weight: bold; color: #065f46; margin-bottom: 10px;';
      
      const subtitle = document.createElement('p');
      subtitle.textContent = 'حاسبة حدود القروض والاستقطاع من الراتب';
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

      content.querySelectorAll('h4').forEach((el: any) => {
        el.style.cssText = `
          font-size: 16px;
          font-weight: bold;
          color: #065f46;
          margin: 20px 0 12px 0;
        `;
      });

      content.querySelectorAll('h3').forEach((el: any) => {
        el.style.cssText = `
          font-size: 18px;
          font-weight: bold;
          color: #065f46;
          margin: 20px 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        `;
      });

      content.querySelectorAll('div').forEach((el: any) => {
        const text = el.textContent || '';
        
        if (text.includes('الحد الأقصى للقسط') || text.includes('القسط الشهري')) {
          el.style.cssText = `
            background: #f0fdf4;
            color: black;
            padding: 15px;
            margin: 15px 0;
            border-right: 4px solid #10b981;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
          `;
        } else if (text.includes('القرض الاستهلاكي') || text.includes('المشتريات')) {
          el.style.cssText = `
            background: #f9fafb;
            color: black;
            padding: 15px;
            margin: 12px 0;
            border: 1px solid #d1d5db;
            display: flex;
            flex-direction: column;
            gap: 8px;
          `;
        } else if (text.includes('تقديرية') || text.includes('تنبيه')) {
          el.style.cssText = `
            background: #ecfdf5;
            color: #065f46;
            padding: 12px;
            margin: 15px 0;
            border-right: 4px solid #10b981;
            border-radius: 4px;
            font-size: 12px;
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
        <p>وفق الضوابط الشائعة لبنك الكويت المركزي وديوان الخدمة المدنية</p>
        <p style="margin-top: 8px;">تنبيه: هذه الحاسبة تقديرية فقط ولا تُعتبر استشارة مالية أو قانونية</p>
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

      pdf.save(`تقرير-حدود-القروض-${new Date().getTime()}.pdf`);
      alert('تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`حدث خطأ أثناء تصدير PDF:\n${errorMsg}`);
    }
  };

  return (
    <div
      className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
      dir="rtl"
    >
      <div className="bg-emerald-700 text-white p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-emerald-500 opacity-25 transform -skew-y-6 origin-top-left scale-150" />
        <h2 className="text-2xl font-bold relative z-10 flex items-center justify-center gap-2">
          <CreditCard className="w-6 h-6" />
          حاسبة حدود القروض والاستقطاع من الراتب
        </h2>
        <p className="text-emerald-100 text-sm mt-2 relative z-10">
          وفق الضوابط الشائعة لبنك الكويت المركزي وديوان الخدمة المدنية (قيم تقريبية قابلة للتعديل)
        </p>
      </div>

      <div className="p-8 space-y-6">
        {/* المدخلات */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-400" />
              صافي الراتب الشهري (بعد الاستقطاعات) – د.ك
            </label>
            <input
              type="number"
              value={netSalary}
              onChange={(e) => setNetSalary(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-left dir-ltr"
              placeholder="مثال: 1000"
              min={0}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Percent className="w-4 h-4 text-slate-400" />
                الحد الأقصى لنسبة الاستقطاع من الراتب
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={maxDeductionPercent}
                  onChange={(e) => setMaxDeductionPercent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-left dir-ltr"
                  min={0}
                  max={100}
                />
                <span className="text-slate-500 text-sm">٪ من الراتب</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                القيمة الافتراضية 40٪ هي النسبة الشائعة المسموح بها للاقتطاعات الشهرية.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Percent className="w-4 h-4 text-slate-400" />
                معدل الربح السنوي التقريبي
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={annualRatePercent}
                  onChange={(e) => setAnnualRatePercent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-left dir-ltr"
                  min={0}
                  step={0.25}
                />
                <span className="text-slate-500 text-sm">٪ سنوياً</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                يمكنك تعديلها حسب عرض البنك/الجهة الممولة الفعلي.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <CalendarClock className="w-4 h-4 text-slate-400" />
                مدة القرض الاستهلاكي
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={loanYears}
                  onChange={(e) => setLoanYears(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-left dir-ltr"
                  min={1}
                />
                <span className="text-slate-500 text-sm">سنة</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                المدة الشائعة حسب تعليمات بنك الكويت المركزي هي حتى 5 سنوات.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <CalendarClock className="w-4 h-4 text-slate-400" />
                مدة المشتريات الآجلة (التمويل الاستهلاكي)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={purchaseYears}
                  onChange={(e) => setPurchaseYears(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-left dir-ltr"
                  min={1}
                />
                <span className="text-slate-500 text-sm">سنة</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                المدة الشائعة للمشتريات بالتقسيط حتى 4 سنوات.
              </p>
            </div>
          </div>
        </div>

        {/* النتائج */}
        <div className="mt-4 space-y-4">
          {/* Print and Export Buttons */}
          <div className="flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              طباعة
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              تصدير PDF
            </button>
          </div>

          <div ref={resultRef}>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">الحد الأقصى للقسط الشهري المخصوم من الراتب</h3>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500">بناءً على نسبة الاستقطاع المدخلة</span>
              <span className="text-xl font-bold text-slate-900 dir-ltr">{formatCurrency(monthlyCap)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-2xl p-4 bg-white">
              <h4 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-1">
                <Wallet className="w-4 h-4 text-emerald-500" />
                حد القرض الاستهلاكي التقريبي
              </h4>
              <p className="text-xs text-slate-400 mb-2">
                بافتراض سداد ثابت على مدار مدة القرض وبمعدل الربح المحدد.
              </p>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-lg font-bold text-slate-900 dir-ltr">{formatCurrency(loanMax)}</span>
                <span className="text-[11px] text-slate-500">
                  لمدة تقريبية قدرها {loanMonths} شهر
                </span>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl p-4 bg-white">
              <h4 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                حد المشتريات الآجلة / التقسيط التقريبي
              </h4>
              <p className="text-xs text-slate-400 mb-2">
                تمويل سلع أو خدمات بنظام التقسيط مع نفس القسط الأقصى المسموح.
              </p>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-lg font-bold text-slate-900 dir-ltr">{formatCurrency(purchaseMax)}</span>
                <span className="text-[11px] text-slate-500">
                  لمدة تقريبية قدرها {purchaseMonths} شهر
                </span>
              </div>
            </div>
          </div>

          <div className={cn("mt-2 flex items-start gap-2 text-[11px] text-slate-500 bg-emerald-50 border border-emerald-100 rounded-2xl p-3")}
          >
            <Info className="w-4 h-4 text-emerald-500 mt-[2px]" />
            <p>
              هذه الحاسبة تقديرية فقط ولا تُعتبر استشارة مالية أو قانونية، وتعتمد على افتراضات عامة لقوانين بنك الكويت المركزي
              وديوان الخدمة المدنية في دولة الكويت. يجب الرجوع للجهة المختصة (البنك، بيت التمويل، أو إدارة الموارد البشرية) للحصول على
              الأرقام الدقيقة والحدود المعتمدة فعلاً.
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
