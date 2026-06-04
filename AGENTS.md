# bill-manager 项目规范

## 项目概述
账单管理工具 — Next.js + Vercel 部署
- 当前状态：稳定，已部署

## Git 规范
- commit 格式：feat/fix/docs/chore + 中文描述
- 部署前必须 
pm run build 通过

## 特殊约束
- Vercel 部署，注意环境变量配置
- 敏感的账单数据不入 git
