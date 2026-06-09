import { ArrowRight, FileSearch, GitFork, MessageSquare, ShieldAlert, BarChart3, CheckCircle, Clock } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(37,99,235,0.15)_0%,_transparent_60%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.08)_0%,_transparent_60%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-8 tracking-wide">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              B2B 合作前尽调工具 · MVP 测试版
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              电商品牌合作方
              <br />
              <span className="text-blue-400">信用查询与尽调平台</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-4 max-w-2xl">
              帮助品牌在合作主播、达人、MCN、代运营、私域团长和分销服务商之前，查看公开资料、真实合作反馈、风险标签与合作适配建议。
            </p>
            <p className="text-sm text-slate-500 leading-relaxed mb-10 max-w-2xl">
              所有公开资料标注来源，已验证合作反馈匿名脱敏展示，未验证内容不计入公开评分。
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('list')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
              >
                进入合作方数据库
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => onNavigate('submit')}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/20 text-slate-200 font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                提交合作反馈
              </button>
              <button
                onClick={() => onNavigate('due-diligence')}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/20 text-slate-200 font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                申请尽调报告
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {[
              { label: '合作方档案', value: '100+' },
              { label: '已验证合作反馈', value: '50+' },
              { label: '风险标签类型', value: '20+' },
              { label: '合作前尽调维度', value: '7项' },
            ].map((stat) => (
              <div key={stat.label} className="px-4 sm:px-6 py-5 text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Value Modules */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">四大核心能力</h2>
            <p className="text-gray-500 text-sm">覆盖电商品牌合作方评估全流程，从公开资料到风险预警</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: FileSearch,
                colorClass: 'bg-blue-50 text-blue-600',
                tagClass: 'bg-blue-50 text-blue-600',
                title: '合作方信用档案',
                desc: '整理 MCN 机构、主播达人、代运营团队、私域团长、招商服务商等合作方的公开资料、主体信息与核验状态。支持公司、个人、团队三种实体类型，区分已核验与自述信息。',
                tags: ['主体核验', '公开资料', '多实体类型'],
              },
              {
                icon: GitFork,
                colorClass: 'bg-sky-50 text-sky-600',
                tagClass: 'bg-sky-50 text-sky-600',
                title: '公司 / 达人关系图谱',
                desc: '查看机构与达人、团队与商务、上下游代理之间的公开关联关系。帮助品牌了解合作方的真实背景，识别关联风险与潜在冲突。',
                tags: ['MCN 归属', '团队关系', '关联核查'],
              },
              {
                icon: MessageSquare,
                colorClass: 'bg-emerald-50 text-emerald-600',
                tagClass: 'bg-emerald-50 text-emerald-600',
                title: '品牌合作反馈',
                desc: '沉淀真实合作后的履约评分、沟通评分、转化评分与复投意愿。所有反馈匿名脱敏、结构化展示，仅已验证评价计入公开评分。',
                tags: ['匿名脱敏', '结构化评价', '已验证可信'],
              },
              {
                icon: ShieldAlert,
                colorClass: 'bg-amber-50 text-amber-600',
                tagClass: 'bg-amber-50 text-amber-600',
                title: '合作前风险提示',
                desc: '识别刷数据嫌疑、交付缩水、报价不透明、退货异常、回款争议、合作后失联等风险线索。基于公开资料和已验证评价综合生成，标注风险来源与核验状态。',
                tags: ['分级风险标签', '风险来源标注', '合规提示'],
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-7 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${item.colorClass}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span key={tag} className={`text-xs px-2 py-0.5 rounded-md font-medium ${item.tagClass}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Adaptation Index */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">合作适配指数</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              综合 7 个维度生成 0–100 分的合作适配指数，帮助品牌快速评估合作方的可信度和匹配度。
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '信息真实性', desc: '档案信息与公开资料的一致程度', score: '20分' },
              { label: '履约能力', desc: '历史合作中的履约率与交付质量', score: '20分' },
              { label: '品类适配度', desc: '与品牌产品类目的匹配程度', score: '20分' },
              { label: '转化与反馈', desc: '已验证合作评价的综合结果', score: '20分' },
              { label: '数据透明度', desc: '数据披露的完整度与可验证性', score: '10分' },
              { label: '合规与风控', desc: '工商信息、合同规范与风险标签', score: '10分' },
              { label: '数据完整度', desc: '档案填写的完整程度', score: '10分' },
              { label: '综合指数', desc: '以上维度加权合计', score: '0–100分', highlight: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-5 border ${(item as any).highlight ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className={`text-xs font-bold mb-1 ${(item as any).highlight ? 'text-blue-200' : 'text-blue-600'}`}>{item.score}</div>
                <div className={`text-sm font-semibold mb-1.5 ${(item as any).highlight ? 'text-white' : 'text-gray-900'}`}>{item.label}</div>
                <div className={`text-xs leading-relaxed ${(item as any).highlight ? 'text-blue-100' : 'text-gray-500'}`}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data disclaimer */}
      <section className="py-10 bg-slate-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-5 text-left">
            <CheckCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">关于平台数据说明</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                渠评 Quping 当前为 MVP 测试版。所有公开资料均标注数据来源与核验状态，公开案例不等同于平台已验证合作评价。
                仅 review_status = verified 的合作反馈计入公开评分。未经核验的信息以"待核验"标注。
                平台不承担因信息不完整或未及时更新导致的合作决策风险。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">合作之前，先做尽调</h2>
          <p className="text-slate-400 mb-10 text-sm">查询合作方档案、提交真实合作反馈、申请人工尽调报告</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onNavigate('list')}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors text-sm"
            >
              进入合作方数据库
            </button>
            <button
              onClick={() => onNavigate('submit')}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-sm"
            >
              提交合作反馈
            </button>
            <button
              onClick={() => onNavigate('due-diligence')}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-sm"
            >
              申请尽调报告
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={15} className="text-white" />
            </div>
            <span className="text-white font-bold">渠评 Quping</span>
          </div>
          <p className="text-slate-600 text-xs">© 2026 Quping · 电商品牌合作方信用查询与尽调平台 · MVP 测试版</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Clock size={11} className="text-slate-600" />
            <span className="text-slate-600 text-xs">数据持续更新中</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
