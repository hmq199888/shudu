#!/bin/bash

# 数独游戏 - GitHub 推送脚本

echo "请先运行以下命令进行 GitHub 认证:"
echo "  gh auth login"
echo ""
echo "认证完成后，运行以下命令推送代码:"
echo ""
echo "  cd sudoku-game"
echo "  gh repo create sudoku-game --public --source=. --push"
echo ""
echo "或者如果已经创建了仓库，直接推送:"
echo "  git remote add origin https://github.com/YOUR_USERNAME/sudoku-game.git"
echo "  git branch -M main"
echo "  git push -u origin main"
