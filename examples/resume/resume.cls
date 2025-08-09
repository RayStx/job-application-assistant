\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{resume}[2015/05/25 An elegant Résumé class]
\LoadClass[10pt]{article}

% disable indent globally
\setlength{\parindent}{0pt}

% some general improvements, defines the XeTeX logo
\RequirePackage{xltxtra}

% use xifthen
\RequirePackage{xifthen}

% use fontawesome
\RequirePackage{fontawesome}

% use xcolor for customizing color
\RequirePackage[usenames,dvipsnames]{xcolor}

% loading fonts
\RequirePackage{fontspec}

% Overleaf兼容的字体设置方案
% 方案一：使用Overleaf内置的Source Han Sans（推荐中文简历）
% \setmainfont{Source Han Sans SC}[
%   BoldFont = Source Han Sans SC Bold,
%   ItalicFont = Source Han Sans SC,
%   BoldItalicFont = Source Han Sans SC Bold
% ]

% 方案二：使用经典学术字体Times New Roman（推荐英文简历）
\setmainfont{Times New Roman}[
  BoldFont = Times New Roman Bold,
  ItalicFont = Times New Roman Italic,
  BoldItalicFont = Times New Roman Bold Italic
]

% 方案三：使用现代字体Calibri（清晰易读）
% \setmainfont{Calibri}[
%   BoldFont = Calibri Bold,
%   ItalicFont = Calibri Italic,
%   BoldItalicFont = Calibri Bold Italic
% ]

% 中文字体设置（如果需要中英混排）
\RequirePackage{xeCJK}
% \setCJKmainfont{Source Han Sans SC}[
%   BoldFont = Source Han Sans SC Bold
% ]

% 设置等宽字体
\setmonofont{Courier New}

% 页面布局设置
\RequirePackage[
	a4paper,
	left=0.543in,
	right=0.543in,
	top=0.3in,
	bottom=0.3in,
	nohead
]{geometry}

\RequirePackage{titlesec}
\RequirePackage{enumitem}
\RequirePackage{graphicx}
\RequirePackage{calc}

% 列表设置
\setlist{noitemsep}
\setlist[itemize]{topsep=0.25em, leftmargin=1.5pc}
\setlist[enumerate]{topsep=0.25em, leftmargin=1.5pc}

\RequirePackage[super]{nth}

% 章节标题格式
\titleformat{\section}
  {\large\bfseries\raggedright}  % 调整为large以适应微软雅黑
  {}{0em}
  {}
  [\titlerule]

\titlespacing*{\section}{0cm}{*1}{*1}

\titleformat{\subsection}
  {\normalsize\bfseries\raggedright}  % 调整子标题大小
  {}{0em}
  {}

\titlespacing*{\subsection}{0cm}{*1}{*0.5}

% 修复照片显示的命令 - 保持原有居中布局
\newcommand{\yourphoto}[1]{%
  \vspace{-4em}% 向上调整，与姓名对齐
  \hfill
  \makebox[0pt][r]{%
    \raisebox{0pt}[0pt][0pt]{%
      \includegraphics[width=2.5cm, height=3.2cm, keepaspectratio]{#1}%
    }%
  }%
  \par
  \vspace{1em}% 调整为标准间距
}

% 完整的头部信息命令（姓名+联系信息+照片）
\newcommand{\namewithphoto}[4]{%
  \vspace{1em}% 增加与顶部的距离
  \begin{center}
    % 姓名部分，保持原有样式
    {\Huge\bfseries{#1}}
    \vspace{1.2ex}
    
    % 联系信息部分（新格式）
    {\normalsize{#2 | #3}} \\
    \vspace{0.3ex}
    {\normalsize{微信：#4}}
  \end{center}
  
  % 照片定位到右上角
  \vspace{-7em}% 向上移动到与姓名同一高度（调整以适应新的顶部间距）
  \hfill
  \makebox[0pt][r]{%
    \includegraphics[width=2.5cm, height=3.2cm, keepaspectratio]{images/photo.jpg}%
  }
  \par
  \vspace{-1em}% 调整为标准间距，避免过大空隙
}

% 传统的日期区间命令
\newcommand{\datedsection}[2]{%
  \section[#1]{#1 \hfill #2}%
}

\newcommand{\datedsubsection}[2]{%
  \subsection[#1]{#1 \hfill #2}%
}

\newcommand{\datedline}[2]{%
  {\par #1 \hfill #2 \par}%
}

% 简化的姓名命令（增加顶部间距）
\newcommand{\name}[1]{
  \vspace{1em}% 增加与顶部的距离
  \centerline{\Huge\bfseries{#1}}
  \vspace{1.2ex}
}

% 联系信息命令（新格式：电话|邮箱，微信单独一行）
\newcommand{\contactInfo}[3]{
  \begin{center}
    {\normalsize{#1 | #2}} \\
    \vspace{0.3ex}
    {\normalsize{微信：#3}}
  \end{center}
  \vspace{0.5ex}
}

% 扩展的联系信息命令
\newcommand{\fullContactInfo}[4]{
  \begin{center}
    {\normalsize{#1 | #2}} \\
    \vspace{0.3ex}
    {\normalsize{微信：#3}}
    \ifthenelse{\isempty{#4}}%
      {}%
      {\\ \vspace{0.3ex} {\normalsize{#4}}}%
  \end{center}
  \vspace{0.5ex}
}

% 角色描述命令
\newcommand{\role}[2]{
  {\par \textit{#1} \quad #2 \par}
  \vspace{0.5ex}
}

% 技能条目命令
\newcommand{\skill}[2]{
  \textbf{#1}: #2
}

% 项目描述命令
\newcommand{\project}[3]{
  \datedsubsection{#1}{#2}
  #3
}

% 教育经历命令
\newcommand{\education}[4]{
  \datedsubsection{#1}{#2}
  \textit{#3} \hfill \textbf{#4}
}

% 工作经历命令
\newcommand{\experience}[4]{
  \datedsubsection{#1}{#2}
  \role{#3}{#4}
}