# Job Application Assistant - Release Notes

## Version 1.0.0 (Initial Release)

### 核心功能

**岗位管理**
- 自动解析招聘页面信息（主要支持中文平台：阿里、字节、腾讯等）
- 手动添加职位信息
- 使用OpenAI API进行智能解析（可选）

**简历管理** 
- 模块化经历库：教育、工作、项目等可复用模块
- 组合不同模块创建针对性简历版本
- 自动版本编号和追踪
- LaTeX编辑器生成专业PDF格式

**求职信管理**
- 类似简历的模块化管理方式
- 版本控制和申请关联
- 特别适用于国际申请

**版本追踪**
- 每个申请清楚记录使用的简历和求职信版本
- 支持中英文数据分离管理
- 本地存储确保隐私安全

**数据管理**
- 完整的备份和导入/导出功能
- 分语言数据管理
- 纯本地存储，无云端同步

### 安装方法

1. 从[Releases](https://github.com/RayStx/job-application-assistant/releases)下载并解压
2. 运行安装脚本（Windows: `install.bat`，Mac/Linux: `./install.sh`）
3. 在Chrome扩展页面启用"开发者模式"并加载扩展

### 包含内容

- Chrome扩展主体文件
- 安装助手脚本
- 简历模板示例
- 数据库模板示例
- 详细使用文档

### 技术栈

React + TypeScript + Chrome Extension API + LaTeX

### 隐私说明

所有数据存储在本地浏览器中，除OpenAI API调用外无任何外部数据传输。

---

适合需要管理多个求职申请、追踪简历版本、支持中英文分离的求职者使用。