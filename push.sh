#!/bin/bash

# 数独游戏 - GitHub 推送脚本

set -e

echo "开始推送数独游戏到 GitHub..."

# 检查是否有未提交的更改
if git diff --quiet 2>/dev/null && [ -z "$(git status --porcelain)" ]; then
  echo "没有需要推送的更改"
else
  echo "提交更改..."
  git add -A
  git commit -m "feat: 完善数独游戏功能 - 修复bug并添加笔记模式、高亮模式、暂停功能"
fi

# 检查远程仓库
if git remote get-url origin 2>/dev/null; then
  echo "推送代码到远程仓库..."
  git push -u origin main
else
  echo "错误: 未配置远程仓库"
  echo "请先创建 GitHub 仓库，然后运行:"
  echo "  git remote add origin https://github.com/YOUR_USERNAME/sudoku-game.git"
  echo "  git push -u origin main"
  exit 1
fi

echo ""
echo "代码已推送! GitHub Actions 将自动构建 APK。"
echo "等待构建完成..."
echo ""
echo "构建状态查看: https://github.com/$(git config user.name 2>/dev/null || echo "YOUR_USERNAME")/sudoku-game/actions"
