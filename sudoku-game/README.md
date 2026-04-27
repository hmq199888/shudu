# 数独游戏 Sudoku Game

一个功能完善、界面优美的数独游戏，支持 Android APK 格式。

## 功能特点

- ✅ 完整数独规则实现
- ✅ 三个难度等级：简单、中等、困难
- ✅ 笔记模式 - 标注可能的候选数字
- ✅ 提示功能 - 提供合理的提示
- ✅ 错误检测 - 自动标记错误的数字
- ✅ 计时功能 - 记录游戏时长
- ✅ 验证功能 - 检查当前填入的数字是否正确
- ✅ 重置功能 - 清除所有用户输入
- ✅ 新游戏 - 重新开始一局
- ✅ 自动解题算法 - 使用回溯算法生成有效数独

## 技术栈

- React 18 + TypeScript
- Vite 构建工具
- Capacitor 跨平台打包
- GitHub Actions 自动化构建

## 游戏规则

1. 9×9 的格子被分成 9 个 3×3 的小宫
2. 每行、每列、每个小宫内数字 1-9 必须出现且只出现一次
3. 根据给定的数字，推断出空白格子应填的数字

## 开发

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 添加 Android 平台
npx cap add android

# 同步到 Android
npx cap sync android

# 构建 APK
cd android && ./gradlew assembleDebug
```

## APK 下载

APK 文件会在每次 push 到 main 分支时自动构建，你可以从 GitHub Actions 构建日志中下载。

## License

MIT
