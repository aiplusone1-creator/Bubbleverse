import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import {
  Building2,
  Play,
  FileCheck,
  Download,
  Users,
  Coins,
  Sparkles,
  School,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StudentRosterItem {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  grade: string;
  photoStatus: 'ready' | 'pending';
  status: 'idle' | 'generating' | 'completed';
  pdfUrl?: string;
}

export default function AdminB2B() {
  const [institutionName, setInstitutionName] = useState('مدرسة النخبة الدولية (الرياض)');
  const [country, setCountry] = useState<'EG' | 'SA'>('SA');
  const [selectedTheme, setSelectedTheme] = useState('space_adventure');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [roster, setRoster] = useState<StudentRosterItem[]>([
    { id: '1', name: 'عمر خالد', gender: 'boy', grade: 'KG2 - أ', photoStatus: 'ready', status: 'idle' },
    { id: '2', name: 'سارة محمد', gender: 'girl', grade: 'KG2 - أ', photoStatus: 'ready', status: 'idle' },
    { id: '3', name: 'ياسين أحمد', gender: 'boy', grade: 'KG2 - ب', photoStatus: 'ready', status: 'idle' },
    { id: '4', name: 'ليان فهد', gender: 'girl', grade: 'KG2 - ب', photoStatus: 'ready', status: 'idle' },
    { id: '5', name: 'عبدالله سعود', gender: 'boy', grade: 'KG2 - ج', photoStatus: 'ready', status: 'idle' },
    { id: '6', name: 'مريم طارق', gender: 'girl', grade: 'KG2 - ج', photoStatus: 'ready', status: 'idle' },
    { id: '7', name: 'حمزة إبراهيم', gender: 'boy', grade: 'KG2 - د', photoStatus: 'ready', status: 'idle' },
    { id: '8', name: 'نور العتيبي', gender: 'girl', grade: 'KG2 - د', photoStatus: 'ready', status: 'idle' },
  ]);

  const unitPrice = country === 'EG' ? 120 : 35;
  const currency = country === 'EG' ? 'ج.م' : 'ر.س';
  const totalStudents = roster.length;
  const totalContract = totalStudents * unitPrice;
  const depositRequired = totalContract * 0.5;

  const handleStartBatch = () => {
    setIsProcessing(true);
    setProgress(0);
    toast.info(`بدء تشغيل ماكينة التوليد الدفعة لعدد ${roster.length} طالباً...`);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      const pct = Math.min(100, Math.round((currentStep / roster.length) * 100));
      setProgress(pct);

      setRoster((prev) =>
        prev.map((student, idx) => {
          if (idx < currentStep) {
            return {
              ...student,
              status: 'completed',
              pdfUrl: `/export/pdf/b2b-${student.id}.pdf`,
            };
          } else if (idx === currentStep) {
            return { ...student, status: 'generating' };
          }
          return student;
        })
      );

      if (currentStep >= roster.length) {
        clearInterval(interval);
        setIsProcessing(false);
        toast.success(`تم بنجاح توليد كافة قصص دفعة ${institutionName}! الـ PDFs جاهزة للتحميل والطباعة.`);
      }
    }, 700);
  };

  const handleExportZip = () => {
    toast.success(`جاري تجهيز حزمة ZIP لجميع ملفات الـ PDF (مقاس 210×210mm جاهز للمطبعة)...`);
    setTimeout(() => {
      window.open('/bubble-books/space.webp', '_blank');
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Building2 className="h-6 w-6 text-cyan-400" />
              B2B School & Bulk Generator • ماكينة المدارس والحضانات
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              توليد دفعات القصص المخصصة بالجملة (50-300+ طالب) بشعار المدرسة وتصدير ملفات الطباعة الفورية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportZip}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              <Download className="h-4 w-4 mr-2" />
              تصدير حزمة الـ PDF للمطبعة (ZIP)
            </Button>
          </div>
        </div>

        {/* Contract Economics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
              <School className="w-4 h-4 text-purple-400" />
              المؤسسة / المدرسة
            </div>
            <div className="text-sm font-bold text-white truncate">{institutionName}</div>
            <div className="text-[11px] text-slate-500 mt-1">{country === 'EG' ? '🇪🇬 مصر' : '🇸🇦 السعودية'}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
              <Users className="w-4 h-4 text-cyan-400" />
              إجمالي الطلاب
            </div>
            <div className="text-xl font-bold text-white">{totalStudents} طالب</div>
            <div className="text-[11px] text-emerald-400 mt-1">جميع الصور والأسماء مكتملة</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
              <Coins className="w-4 h-4 text-amber-400" />
              قيمة العقد الإجمالية
            </div>
            <div className="text-xl font-bold text-amber-300">
              {totalContract.toLocaleString()} {currency}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">بمعدل {unitPrice} {currency} / طالب</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              عربون التعاقد (50%)
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {depositRequired.toLocaleString()} {currency}
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-1">مدفوع ومؤكد ✅</div>
          </div>
        </div>

        {/* Setup & Configuration Row */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            إعدادات قالب الدفعة الموحد
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">اسم المؤسسة</label>
              <Input
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">الدولة والعملة</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as 'EG' | 'SA')}
                className="w-full bg-slate-950 border border-slate-800 rounded-md h-9 px-3 text-xs text-slate-200"
              >
                <option value="SA">🇸🇦 السعودية (35 ر.س / طالب)</option>
                <option value="EG">🇪🇬 مصر (120 ج.م / طالب)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">قالب القصة المعتمد</label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md h-9 px-3 text-xs text-slate-200"
              >
                <option value="space_adventure">رحلة إلى الفضاء مع أبطال المدرسة</option>
                <option value="cooperation_magic">قوة الصداقة والتعاون في الغابة السحرية</option>
                <option value="graduation_heroes">حفل تخرج أبطال المستقبل (روضة النخبة)</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              ملف الأسماء: <strong className="text-slate-200">KG2_Graduation_Roster.xlsx</strong>
              <span className="text-slate-600">•</span>
              مجلد الصور: <strong className="text-slate-200">Photos_ZIP (8/8)</strong>
            </div>

            <Button
              onClick={handleStartBatch}
              disabled={isProcessing}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs px-5 h-9"
            >
              <Play className="w-3.5 h-3.5 mr-2" />
              {isProcessing ? `جاري تشغيل الدفعة (${progress}%)...` : 'بدء تشغيل ماكينة التوليد (Start Batch)'}
            </Button>
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>تقدم المعالجة والتوليد...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Student Roster Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              كشف طلاب الدفعة
            </h3>
            <Badge variant="outline" className="text-slate-400 border-slate-700">
              جاهز للتصدير
            </Badge>
          </div>

          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950">
                <TableRow className="border-slate-800">
                  <TableHead className="text-xs text-slate-400">#</TableHead>
                  <TableHead className="text-xs text-slate-400">اسم الطالب / الطالبة</TableHead>
                  <TableHead className="text-xs text-slate-400">الفصل</TableHead>
                  <TableHead className="text-xs text-slate-400">حالة الصورة</TableHead>
                  <TableHead className="text-xs text-slate-400">حالة التوليد</TableHead>
                  <TableHead className="text-xs text-slate-400 text-right">ملف PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((student) => (
                  <TableRow key={student.id} className="border-slate-800 hover:bg-slate-800/40">
                    <TableCell className="text-xs font-mono text-slate-500">{student.id}</TableCell>
                    <TableCell className="text-xs font-semibold text-white">{student.name}</TableCell>
                    <TableCell className="text-xs text-slate-400">{student.grade}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-950 text-emerald-300 border-emerald-500/30 text-[10px]">
                        جاهزة ومطابقة
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${
                          student.status === 'completed'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                            : student.status === 'generating'
                            ? 'bg-purple-950 text-purple-300 border-purple-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {student.status === 'completed'
                          ? 'مكتمل ✅'
                          : student.status === 'generating'
                          ? 'جاري التوليد...'
                          : 'في الانتظار'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {student.pdfUrl ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300"
                          onClick={() => window.open(student.pdfUrl, '_blank')}
                        >
                          <FileCheck className="w-3.5 h-3.5 ml-1" />
                          معاينة PDF
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-600">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}