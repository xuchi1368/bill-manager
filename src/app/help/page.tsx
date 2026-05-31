'use client';

import PageTransition from '@/components/PageTransition';

export default function HelpPage() {
  return (
    <PageTransition>
      <h2 className="text-lg font-bold text-[#3d342b] mb-4">使用手册</h2>

      <div className="space-y-4">

        {/* 总览 */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">📋 关于账单管理</h3>
          <p className="text-[13px] text-[#6b5d52] leading-relaxed">
            账单管理是一款个人财务助手，帮助你记录日常收支、查看消费结构、管理定期账单。
            数据存储在云端，手机电脑都能用同一个账号登录。
          </p>
        </div>

        {/* 各功能 */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">📊 仪表盘</h3>
          <p className="text-[13px] text-[#6b5d52] leading-relaxed">
            首页概览本月收入、支出、结余。能看到各分类的预算进度（环形图），
            以及每日收支趋势图和最近流水。点击"查看全部"可以跳到记账页。
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">✏️ 记账</h3>
          <p className="text-[13px] text-[#6b5d52] leading-relaxed">
            左边表单记一笔（收入/支出、金额、分类、渠道、日期），右边列表查看和编辑已有记录。
            支持搜索、按日期筛选、导出 CSV。点击记录上的编辑按钮可修改，删除前会弹框确认。
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">📈 报表</h3>
          <p className="text-[13px] text-[#6b5d52] leading-relaxed">
            按月查看支出结构和收入来源（饼图），每日收支趋势（折线图），
            环比对比（本月 vs 上月各分类变化），以及各支付渠道的消费占比。
            左上角箭头可切换月份。
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">🔁 周期账单</h3>
          <p className="text-[13px] text-[#6b5d52] leading-relaxed">
            管理定期付款或订阅（如房租、网费、会员）。设置名称、金额、频率（每月/每周/每年）、
            下次到期日。勾选"暂停"可临时跳过。到了到期日系统会自动生成一笔支出记录。
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">📥 数据导入</h3>
          <p className="text-[13px] text-[#6b5d52] leading-relaxed">
            设置 → 数据导入，支持微信和支付宝账单：
          </p>
          <ul className="text-[13px] text-[#6b5d52] list-disc list-inside mt-1 space-y-1">
            <li><b>微信</b>：我 → 服务 → 钱包 → 账单 → 常见问题 → 下载账单 → 用于个人对账 → 下载 <b>XLSX</b> 文件</li>
            <li><b>支付宝</b>：我的 → 账单 → 右上角筛选 → 开具交易流水证明 → 用于对账 → 下载 <b>CSV</b> 文件</li>
          </ul>
          <p className="text-[13px] text-[#6b5d52] mt-2">
            上传后会自动识别分类和渠道，确认无误点"确认导入"即可。
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">📏 自动分类规则</h3>
          <p className="text-[13px] text-[#6b5d52] leading-relaxed">
            设置 → 自动分类，可创建规则：当交易描述包含某个关键词时，自动归到指定分类和渠道。
            还支持金额范围和优先级。导入账单时会优先用你的规则匹配。
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">💾 数据备份</h3>
          <p className="text-[13px] text-[#6b5d52] leading-relaxed">
            设置 → 数据备份，可下载完整数据库备份文件（.db），也可上传之前的备份恢复数据。
            恢复前会自动保存当前数据。
          </p>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">🎨 外观</h3>
          <p className="text-[13px] text-[#6b5d52] leading-relaxed">
            设置 → 外观，可切换图标风格（Lucide 线性 / Emoji / 色块），
            以及标题栏样式（Windows 风格 / Mac 风格 / 跟随系统）。
          </p>
        </div>

      </div>
    </PageTransition>
  );
}
