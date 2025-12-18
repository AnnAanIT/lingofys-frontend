
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Book, Zap, CreditCard, Users, 
  Scale, Target, Calendar, RefreshCcw, DollarSign, 
  Activity, Info, LayoutDashboard, Search, Wallet, 
  Award, Settings, MessageSquare, ShieldCheck, 
  BarChart3, Component, ShieldAlert, FileText, TrendingUp,
  ChevronRight, PlayCircle, Layers, Fingerprint, Globe,
  Shield, CheckCircle, Database, Calculator, Workflow, Clock,
  Lock, TrendingDown, Landmark
} from 'lucide-react';

export default function Readme() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-100 selection:text-brand-900 pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <button onClick={() => navigate('/login')} className="flex items-center text-slate-400 hover:text-slate-900 font-bold text-sm mb-8 transition-all group">
                        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Application
                    </button>
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 bg-brand-600 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3">
                            <Landmark size={32} />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tight text-slate-900">Platform Manifesto</h1>
                            <p className="text-xl text-slate-500 font-medium mt-2 text-balance max-w-2xl">Bản đặc tả chi tiết về logic vận hành, công thức toán học và quy trình cấu hình hệ thống.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 pt-16 space-y-32">
                
                {/* 1. ADMIN ONBOARDING FLOW */}
                <section className="space-y-12">
                    <div className="flex items-center gap-3 text-brand-600 border-b border-brand-100 pb-4">
                        <Workflow size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight">01. Quy trình thiết lập (Admin Flow)</h2>
                    </div>
                    
                    <p className="text-slate-600 text-lg leading-relaxed max-w-4xl">
                        Để nền tảng bắt đầu vận hành, Admin cần đi qua 4 bước cấu hình kinh tế nền tảng (Economic Baseline) theo trình tự sau:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black italic">Step 1</div>
                            <h3 className="text-xl font-bold">Xác định tỷ giá Credit (The Spread)</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Tại mục <strong>Admin > Pricing Config</strong>, thiết lập <code>topupConversionRatio</code>. 
                                <br/><br/>
                                <span className="text-brand-600 font-bold">Ví dụ:</span> Nếu đặt là 0.8, nghĩa là $1 USD đổi được 0.8 Credit. Học viên phải trả ~$1.25 USD cho mỗi 1 Credit. Đây là nơi tạo ra lợi nhuận gộp ngay khi dòng tiền đi vào (Inflow).
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black italic">Step 2</div>
                            <h3 className="text-xl font-bold">Ma trận Công bằng Địa lý</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Thiết lập <strong>Country Multipliers</strong>. Hệ thống tự động điều chỉnh giá theo sức mua vùng miền.
                                <br/><br/>
                                <span className="text-blue-600 font-bold">Ví dụ:</span> Học viên tại Việt Nam có multiplier 0.9 (giảm giá), học viên tại Nhật Bản có multiplier 1.2 (tăng giá). Mentor vẫn nhận đủ Credit gốc, sàn sẽ bù đắp bằng chênh lệch tỷ giá.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black italic">Step 3</div>
                            <h3 className="text-xl font-bold">Phân tầng Mentor (Expert Tiers)</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Gán Mentor vào các <strong>Pricing Groups</strong> (Standard, Native, VIP). 
                                Mỗi nhóm có một hệ số nhân (Tier Multiplier) áp dụng trực tiếp lên đơn giá giờ dạy. 
                                Điều này cho phép tự động hóa việc tính phí cao hơn cho các chuyên gia mà không cần cấu hình thủ công từng người.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black italic">Step 4</div>
                            <h3 className="text-xl font-bold">Gói học định kỳ (Subscriptions)</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Tạo <strong>Subscription Plans</strong> để giữ chân người dùng. Admin cần xác định: Số buổi, Thời hạn (tuần), và đặc biệt là <strong>Hạn mức hủy/dời lịch (Quotas)</strong>. 
                                <br/><br/>
                                Hệ thống dùng Quotas để kỷ luật học viên: Nếu hết lượt dời, họ buộc phải tham gia học hoặc mất buổi đó.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 2. THE MATHEMATICAL ENGINE */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3 text-brand-600 border-b border-brand-100 pb-4">
                        <Calculator size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight">02. Động cơ tính toán (The Engine)</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-12">
                        {/* Unit Economics */}
                        <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={200} /></div>
                            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <DollarSign className="text-brand-400" /> 1. Chênh lệch Inflow/Outflow
                            </h3>
                            <p className="text-slate-400 mb-10 text-lg leading-relaxed">
                                Lợi nhuận của sàn được khóa lại (locked) ngay tại thời điểm học viên nạp tiền. Chúng ta tạo ra một loại tiền tệ nội bộ (Credit) có giá trị nạp vào cao hơn giá trị rút ra.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700">
                                        <h4 className="text-brand-400 font-black text-xs uppercase mb-4 tracking-widest">Inflow (Mentee nạp)</h4>
                                        <div className="text-3xl font-mono font-black mb-2">$1.00 USD &rarr; 0.8 Credits</div>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold italic">Nghĩa là: 1 Credit = $1.25 USD</p>
                                    </div>
                                    <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700">
                                        <h4 className="text-red-400 font-black text-xs uppercase mb-4 tracking-widest">Outflow (Mentor rút)</h4>
                                        <div className="text-3xl font-mono font-black mb-2">1 Credit &rarr; $1.00 USD</div>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold italic">Nghĩa là: Tỷ giá rút tiền cố định 1:1</p>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center bg-brand-600/10 border border-brand-500/20 p-10 rounded-[2.5rem]">
                                    <h4 className="text-xl font-bold mb-4 text-brand-400">Kết quả tài chính:</h4>
                                    <ul className="space-y-4 text-slate-300 text-sm">
                                        <li className="flex gap-3"><ChevronRight className="text-brand-400 shrink-0" /> <span><strong>Margin 20%:</strong> Sàn giữ lại $0.25 trên mỗi Credit lưu thông.</span></li>
                                        <li className="flex gap-3"><ChevronRight className="text-brand-400 shrink-0" /> <span><strong>Real-time Solvency:</strong> Admin luôn biết cần bao nhiêu tiền mặt thực tế để trả nợ cho tất cả Credit đang tồn tại.</span></li>
                                        <li className="flex gap-3"><ChevronRight className="text-brand-400 shrink-0" /> <span><strong>Affiliate Fuel:</strong> 20% margin này được dùng để chi trả hoa hồng 5-12% cho các Provider.</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Formula */}
                        <div className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                            <h3 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                                <Zap className="text-brand-600" /> 2. Công thức tính giá động
                            </h3>
                            <div className="bg-slate-50 p-10 rounded-3xl font-mono text-3xl text-slate-700 border border-slate-100 mb-10 text-center shadow-inner overflow-x-auto whitespace-nowrap">
                                Rate = <span className="text-brand-600">Base</span> × <span className="text-blue-600">Geo_M</span> × <span className="text-purple-600">Tier_M</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-3">
                                    <span className="flex items-center gap-2 font-black text-brand-600 uppercase text-xs tracking-widest"><Layers size={14}/> Base Unit</span>
                                    <p className="text-sm text-slate-500 leading-relaxed">Giá "Sàn" toàn cầu (ví dụ: 10 Cr). Mọi tính toán đều bắt đầu từ đây.</p>
                                </div>
                                <div className="space-y-3">
                                    <span className="flex items-center gap-2 font-black text-blue-600 uppercase text-xs tracking-widest"><Globe size={14}/> Geo Offset</span>
                                    <p className="text-sm text-slate-500 leading-relaxed">Điều chỉnh theo sức mua. Học viên nghèo trả ít hơn, học viên giàu trả đúng giá.</p>
                                </div>
                                <div className="space-y-3">
                                    <span className="flex items-center gap-2 font-black text-purple-600 uppercase text-xs tracking-widest"><Fingerprint size={14}/> Expert Premium</span>
                                    <p className="text-sm text-slate-500 leading-relaxed">Hệ số kinh nghiệm. Mentor giỏi tự động có giá cao hơn dựa trên nhóm của họ.</p>
                                </div>
                            </div>
                        </div>

                        {/* Escrow Logic */}
                        <div className="p-10 bg-white rounded-[3rem] border border-slate-200 shadow-sm relative">
                            <h3 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                                <ShieldCheck className="text-green-600" /> 3. Quy trình ký quỹ (The Escrow)
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="font-black text-slate-400 mb-4 text-[10px] tracking-widest uppercase">Giai đoạn 1: Booking</div>
                                    <p className="text-xs text-slate-700 leading-relaxed">Credit bị khấu trừ từ Mentee và chuyển vào trạng thái <code>holding</code> (ký quỹ). Mentee thấy tiền giảm, Mentor thấy tiền "đang treo".</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="font-black text-slate-400 mb-4 text-[10px] tracking-widest uppercase">Giai đoạn 2: Complete</div>
                                    <p className="text-xs text-slate-700 leading-relaxed">Khi kết thúc buổi học, Credit từ <code>holding</code> được giải ngân (release) vào ví Mentor. Mentor có thể rút tiền mặt (USD) từ đây.</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="font-black text-slate-400 mb-4 text-[10px] tracking-widest uppercase">Giai đoạn 3: Dispute</div>
                                    <p className="text-xs text-slate-700 leading-relaxed">Nếu có khiếu nại, Admin can thiệp. Admin có quyền <code>Refund</code> (trả tiền cho Mentee) hoặc <code>Dismiss</code> (giải ngân cho Mentor).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. VERCEL DEPLOYMENT GUIDE */}
                <section className="space-y-12">
                    <div className="flex items-center gap-3 text-brand-600 border-b border-brand-100 pb-4">
                        <Zap size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight">03. Hướng dẫn Deploy lên Vercel</h2>
                    </div>

                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold flex items-center gap-2"><CheckCircle className="text-green-400" /> Các bước thực hiện</h3>
                                <ol className="space-y-4 text-slate-400 text-sm">
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center font-bold text-xs text-white">1</span>
                                        <span>Đẩy mã nguồn lên một Git Repository (GitHub, GitLab, hoặc Bitbucket).</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center font-bold text-xs text-white">2</span>
                                        <span>Truy cập <strong>vercel.com</strong> và chọn "Add New" -> "Project".</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center font-bold text-xs text-white">3</span>
                                        <span>Import Repository đã đẩy lên ở Bước 1.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center font-bold text-xs text-white">4</span>
                                        <span>Vercel sẽ tự động phát hiện các file cấu hình và chọn Framework Preset là <strong>Vite</strong>.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center font-bold text-xs text-white">5</span>
                                        <span>Trong phần <strong>Environment Variables</strong>, thêm <code>API_KEY</code> với giá trị là Gemini API Key của bạn.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center font-bold text-xs text-white">6</span>
                                        <span>Nhấn <strong>Deploy</strong>. Vercel sẽ biên dịch code TypeScript thành JavaScript và cung cấp URL công khai.</span>
                                    </li>
                                </ol>
                            </div>
                            <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield className="text-brand-400" /> Cấu hình chuẩn trên Vercel</h3>
                                <ul className="space-y-3 text-xs text-slate-400">
                                    <li className="flex gap-2"><CheckCircle size={12} className="mt-0.5 text-brand-400"/> <strong>Framework Preset:</strong> Vite</li>
                                    <li className="flex gap-2"><CheckCircle size={12} className="mt-0.5 text-brand-400"/> <strong>Build Command:</strong> <code>npm run build</code></li>
                                    <li className="flex gap-2"><CheckCircle size={12} className="mt-0.5 text-brand-400"/> <strong>Output Directory:</strong> <code>dist</code></li>
                                    <li className="flex gap-2"><CheckCircle size={12} className="mt-0.5 text-brand-400"/> <strong>Root Directory:</strong> Thư mục gốc (./)</li>
                                </ul>
                                <div className="mt-6 p-4 bg-orange-950/30 border border-orange-900/50 rounded-xl">
                                    <p className="text-orange-400 text-[10px] leading-relaxed">
                                        <strong>Lưu ý:</strong> Trình duyệt không thể chạy trực tiếp file .tsx. Việc chọn preset Vite giúp Vercel chạy lệnh build để chuyển đổi code sang dạng trình duyệt hiểu được.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final Button */}
                <div className="pt-10 text-center">
                    <button 
                        onClick={() => navigate('/login')}
                        className="px-16 py-6 bg-slate-900 text-white font-black uppercase text-sm tracking-[0.2em] rounded-3xl hover:bg-slate-800 transition-all shadow-2xl active:scale-95 hover:-translate-y-1"
                    >
                        Accept Manifesto & Proceed
                    </button>
                </div>
            </div>
        </div>
    );
}
