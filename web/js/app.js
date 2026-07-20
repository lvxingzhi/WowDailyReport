/**
 * 大秘境分数行情 · 幻灯片导航与数据渲染
 *
 * 职责：幻灯片切换、数据加载、非图表模块渲染
 * @author ext.ahs.lvxingz1
 */

/* ==================== 幻灯片导航 ==================== */

/** 当前幻灯片索引（从 0 开始） */
let currentSlide = 0;

/** 幻灯片总数 */
const totalSlides = 7;

/** 所有 slide 元素 */
let slides = [];

/** 所有导航圆点 */
let dots = [];

/** 已加载的数据 */
let reportData = null;

/**
 * 根据专精名生成图标 <img> 标签
 * 直接使用 Excel 中填入的名称（如 D增辉/H神牧/T熊T）拼接文件名
 * @param {string} name - 专精名（需与 images/ 中文件名一致）
 * @param {string} sizeClass - 尺寸 CSS 类（可选）
 * @returns {string} HTML 字符串
 */
function iconImg(name, sizeClass = '') {
  if (!name) return '';
  return `<img class="spec-icon ${sizeClass}" src="../images/${name}.jpg" alt="${name}" onerror="this.style.display='none'">`;
}

/**
 * 去掉 D/H/T 前缀，返回纯粹的名称用于展示
 * @param {string} name - 带前缀的专精名（如 D增辉）
 * @returns {string} 纯名称（如 增辉）
 */
function showName(name) {
  if (!name) return '';
  return name.replace(/^[DHT]/, '');
}

/**
 * 根据专精名中的 T/H/D 前缀判断角色职责
 * @param {string} className - 带前缀的专精名（如 T熊T、H奶僧、D增辉）
 * @returns {{role: string, roleClass: string}} role 为中文职责名，roleClass 为 CSS 类名
 */
function getRoleFromClass(className) {
  if (!className) return { role: '输出', roleClass: 'dps' };
  const prefix = className.charAt(0);
  switch (prefix) {
    case 'T': return { role: '坦克', roleClass: 'tank' };
    case 'H': return { role: '治疗', roleClass: 'healer' };
    default: return { role: '输出', roleClass: 'dps' };
  }
}

const SLIDE_IDS = [
  'slide-1', 'slide-2', 'slide-3', 'slide-4',
  'slide-5', 'slide-6', 'slide-7'
];

/**
 * 切换到指定幻灯片
 * @param {number} index - 目标幻灯片索引
 */
function goToSlide(index) {
  if (index < 0 || index >= totalSlides) return;

  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');

  currentSlide = index;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');

  // 更新 URL hash
  window.location.hash = SLIDE_IDS[currentSlide];

  // 切换后初始化对应图表
  initChartForSlide(currentSlide);
}

/** 切换到上一页 */
function prevSlide() {
  goToSlide(currentSlide - 1);
}

/** 切换到下一页 */
function nextSlide() {
  goToSlide(currentSlide + 1);
}

/* ==================== 数据加载 ==================== */

/**
 * 从 current.json 加载数据
 * @returns {Promise<object>} 解析后的数据
 */
async function loadData() {
  try {
    const resp = await fetch('../data/current.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    reportData = await resp.json();
    return reportData;
  } catch (err) {
    console.error('[数据加载失败]', err);
    return null;
  }
}

/* ==================== 模块渲染 ==================== */

/** 获取最新一天的数据 */
function latest() {
  if (!reportData || !reportData.daily.length) return null;
  return reportData.daily[reportData.daily.length - 1];
}

/**
 * 渲染赛季概览（Slide 1）
 */
function renderOverview() {
  const l = latest();
  if (!l) return;

  document.getElementById('so-week').textContent = l.seasonWeek;
  document.getElementById('so-remaining').textContent = l.weeksRemaining;

  // 固定顶部：赛季名称 + 更新日期
  const dateStr = reportData.meta.latestDate;
  const mmdd = dateStr.substring(4, 6) + '/' + dateStr.substring(6, 8);
  document.getElementById('ph-season').textContent = reportData.meta.season;
  document.getElementById('ph-date').textContent = mmdd + ' 更新';
  document.getElementById('ph-week').textContent = '第 ' + l.seasonWeek + ' 周';
}

/**
 * 渲染第一名5人小队（Slide 3）
 */
function renderRank1() {
  const l = latest();
  if (!l) return;

  document.getElementById('r1-score').textContent = l.rank1.score;

  const roleIcons = { '坦克': '🛡️', '治疗': '💚', '输出': '⚔️' };

  const teamEl = document.getElementById('r1-team');
  teamEl.innerHTML = l.rank1.team
    .map(member => {
      const { role, roleClass } = getRoleFromClass(member.class);
      return `
        <div class="team-card team-${roleClass}">
          <span class="team-role-badge">${roleIcons[role]} ${role}</span>
          <span class="team-player-icon">${iconImg(member.class, 'icon-md')}</span>
          <span class="team-player-name">${member.player}</span>
        </div>
      `;
    })
    .join('');
}

/**
 * 渲染强势阵容（Slide 4）
 * 展示 2 套阵容卡片，每套 5 个成员
 */
function renderEco() {
  const lineupEl = document.getElementById('eco-lineup');
  if (!lineupEl || !reportData.nationalTeam) return;

  const roleIcons = {
    '坦克': '🛡️',
    '治疗': '💚',
    '输出': '⚔️'
  };

  lineupEl.innerHTML = reportData.nationalTeam.map(group => `
    <div class="lineup-group">
      <div class="lineup-group-title">${group.group}</div>
      <div class="lineup-members">
        ${group.members.map(m => `
          <div class="lineup-member-card">
            <div class="lineup-member-role ${m.role === '坦克' ? 'role-tank' : m.role === '治疗' ? 'role-healer' : 'role-dps'}">
              ${roleIcons[m.role] || ''} ${m.role}
            </div>
            <div class="lineup-member-class">
              ${iconImg(m.class, 'icon-md')}${showName(m.class)}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

/**
 * 渲染副本限时最高层数列表（Slide 6）
 */
function renderDungeons() {
  const l = latest();
  if (!l) return;

  const container = document.getElementById('dungeon-list');
  if (!container) return;

  // 按层数从高到低排序，层数不同时用不同颜色区分
  const sorted = [...l.dungeons].sort((a, b) => b.level - a.level);
  const maxLevel = sorted[0]?.level || 0;

  // 颜色阶梯：高→低，金→橙→蓝紫→蓝灰
  const colors = [
    '#e4c76b', '#d49a3c', '#c97a5a', '#a07a8b',
    '#6a8fbf', '#5a7faa', '#4a6f95', '#3a5f80'
  ];

  container.innerHTML = sorted.map((d, i) => `
    <div class="dungeon-row" style="border-left: 4px solid ${colors[i]}; background: ${colors[i]}0a;">
      <span class="dungeon-name" style="color: ${colors[i]}">${d.name}</span>
      <span class="dungeon-level">
        <span class="dungeon-level-num" style="color: ${colors[i]}">${d.level}</span>
        <span class="dungeon-level-suffix">层</span>
      </span>
    </div>
  `).join('');
}

/**
 * 渲染专精分数排行表格（Slide 5）
 * 40 专精按分数从高到低展示，4 列网格
 */
function renderFaith() {
  const l = latest();
  if (!l) return;

  const container = document.getElementById('faith-table');
  if (!container) return;

  const specs = l.faithSpecs;
  // 按分数从高到低分行排列，每列 10 行
  const rows = [];
  const cols = 4;
  const perCol = Math.ceil(specs.length / cols);
  for (let r = 0; r < perCol; r++) {
    const cells = [];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx < specs.length) {
        const spec = specs[idx];
        cells.push(`
          <div class="faith-cell">
            <span class="faith-rank">#${idx + 1}</span>
            ${iconImg(spec.name, 'icon-sm')}
            <span class="faith-name">${showName(spec.name)}</span>
            <span class="faith-score">${spec.score}</span>
          </div>
        `);
      } else {
        cells.push('<div class="faith-cell faith-cell-empty"></div>');
      }
    }
    rows.push(`<div class="faith-row">${cells.join('')}</div>`);
  }
  container.innerHTML = rows.join('');
}

/**
 * 渲染所有非图表模块
 */
function renderAll() {
  renderOverview();
  renderRank1();
  renderEco();
  renderFaith();
  renderDungeons();
}

/* ==================== 一图流模式 ==================== */

/** 当前是否为一图流模式 */
let onePagerActive = false;

/**
 * 切换一图流 / 幻灯片模式
 */
function toggleOnePager() {
  onePagerActive = !onePagerActive;
  document.body.classList.toggle('one-pager-mode', onePagerActive);

  const btn = document.getElementById('btn-onepager');
  btn.textContent = onePagerActive ? '幻灯片' : '一图流';

  if (onePagerActive) {
    renderOnePager();
    window.scrollTo(0, 0);
  }
}

/**
 * 渲染一图流（垂直长图），仅使用最新一天数据
 */
function renderOnePager() {
  const container = document.getElementById('one-pager');
  if (!container) return;

  const l = latest();
  if (!l) {
    container.innerHTML = '<div class="op-container"><p style="text-align:center;color:#5a6377;">暂无数据</p></div>';
    return;
  }

  // 赛季 + 日期 + 周数
  const dateStr = reportData.meta.latestDate;
  const mmdd = dateStr.substring(4, 6) + '/' + dateStr.substring(6, 8);

  // 队伍角色辅助
  const roleIcons = { '坦克': '🛡️', '治疗': '💚', '输出': '⚔️' };

  // 副本颜色
  const colors = [
    '#e4c76b', '#d49a3c', '#c97a5a', '#a07a8b',
    '#6a8fbf', '#5a7faa', '#4a6f95', '#3a5f80'
  ];
  const sortedDungeons = [...l.dungeons].sort((a, b) => b.level - a.level);

  // 专精排行：4列网格排序
  const specs = l.faithSpecs;
  const cols = 4;
  const perCol = Math.ceil(specs.length / cols);

  container.innerHTML = `
    <div class="op-container">

      <!-- 页头 -->
      <div class="op-header">
        <div class="op-header-title">大秘境周报</div>
        <div class="op-header-meta">
          <span>${reportData.meta.season}</span>
          <span class="sep">·</span>
          <span>${mmdd} 更新</span>
          <span class="sep">·</span>
          <span>第 ${l.seasonWeek} 周</span>
          <span class="sep">·</span>
          <span>预计剩余 ${l.weeksRemaining} 周</span>
        </div>
      </div>

      <!-- 分数概览 -->
      <div class="op-section">
        <div class="op-section-title">分数</div>
        <div class="op-score-row">
          <div class="op-score-card accent-gold">
            <div class="op-score-value">${l.rank1.score}</div>
            <div class="op-score-label">最高分数</div>
          </div>
          <div class="op-score-card accent-orange">
            <div class="op-score-value">${l.top01Pct}</div>
            <div class="op-score-label">0.1% 分数线</div>
          </div>
          <div class="op-score-card accent-blue">
            <div class="op-score-value">${l.top1Pct}</div>
            <div class="op-score-label">1% 分数线</div>
          </div>
        </div>
      </div>

      <!-- TOP 队伍 -->
      <div class="op-section">
        <div class="op-section-title">世界TOP</div>
        <div class="op-top5-row">
          ${l.rank1.team.map(member => {
            const { role, roleClass } = getRoleFromClass(member.class);
            return `
              <div class="op-top5-card role-${roleClass}">
                <span class="op-top5-role">${roleIcons[role]} ${role}</span>
                ${iconImg(member.class, 'icon-sm')}
                <span class="op-top5-name">${member.player}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 强势阵容 -->
      <div class="op-section">
        <div class="op-section-title">强势阵容</div>
        <div class="op-lineup-row">
          ${reportData.nationalTeam.map(group => `
            <div class="op-lineup-group">
              <div class="op-lineup-group-title">${group.group}</div>
              ${group.members.map(m => `
                <div class="op-lineup-member">
                  <span class="op-lineup-role ${m.role === '坦克' ? 'role-tank' : m.role === '治疗' ? 'role-healer' : 'role-dps'}">${roleIcons[m.role] || ''} ${m.role}</span>
                  <span class="op-lineup-class">${iconImg(m.class, 'icon-sm')}${showName(m.class)}</span>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 专精分数排行 -->
      <div class="op-section">
        <div class="op-section-title">专精分数排行</div>
        <div class="op-specs-grid">
          ${(() => {
            const cells = [];
            for (let r = 0; r < perCol; r++) {
              for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                if (idx < specs.length) {
                  const spec = specs[idx];
                  cells.push(`
                    <div class="op-spec-cell">
                      <span class="op-spec-rank">#${idx + 1}</span>
                      ${iconImg(spec.name, 'icon-sm')}
                      <span class="op-spec-name">${showName(spec.name)}</span>
                      <span class="op-spec-score">${spec.score}</span>
                    </div>
                  `);
                }
              }
            }
            return cells.join('');
          })()}
        </div>
      </div>

      <!-- 副本限时 -->
      <div class="op-section">
        <div class="op-section-title">限时最高层数</div>
        <div class="op-dungeon-list">
          ${sortedDungeons.map((d, i) => `
            <div class="op-dungeon-row" style="border-left:4px solid ${colors[i]};background:${colors[i]}08;">
              <span class="op-dungeon-name" style="color:${colors[i]}">${d.name}</span>
              <span>
                <span class="op-dungeon-level" style="color:${colors[i]}">${d.level}</span>
                <span class="op-dungeon-level-suffix">层</span>
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 铁钥匙人数 -->
      <div class="op-section">
        <div class="op-section-title">铁钥匙人数</div>
        <div class="op-iron-row">
          <div class="op-iron-card">
            <div class="op-iron-value gold">${l.iron24}</div>
            <div class="op-iron-label">24 铁钥匙</div>
          </div>
          <div class="op-iron-card">
            <div class="op-iron-value orange">${l.iron23}</div>
            <div class="op-iron-label">23 铁钥匙</div>
          </div>
        </div>
      </div>

      <!-- 页脚 -->
      <div class="op-footer">
        ${reportData.meta.season} · ${mmdd} 更新 · 数据来源 Raider.IO
        <br>制作者: 西番芥 · B站 西番芥 · space.bilibili.com/346688237
      </div>

      <!-- 浮动返回按钮 -->
      <button class="op-back-btn" onclick="toggleOnePager()">返回幻灯片</button>

    </div>
  `;
}

/* ==================== 图表调度 ==================== */

/**
 * 根据幻灯片索引决定是否初始化对应图表
 * @param {number} index - 幻灯片索引
 */
function initChartForSlide(index) {
  // 使用 setTimeout 确保 DOM 渲染后再初始化
  setTimeout(() => {
    switch (index) {
      case 1: initScoreTrendChart(); break;
      case 6: initIronChart(); break;
    }
  }, 100);
}

/* ==================== 主题切换 ==================== */

/** 当前激活的主题名称 */
let currentTheme = 'default';

/**
 * 应用指定主题，更新页面 data-theme 和按钮激活态
 * @param {string} theme - 主题名（'default' | 'emerald' | 'frost' | 'shadow' | 'blazing'）
 */
function setTheme(theme) {
  currentTheme = theme;
  if (theme === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  // 更新按钮激活状态
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === theme);
  });
  // 持久化
  try { localStorage.setItem('wow-theme', theme); } catch (_) {}
}

/**
 * 初始化主题切换：加载已保存的主题 + 绑定事件
 */
function initThemes() {
  const saved = (() => {
    try { return localStorage.getItem('wow-theme'); } catch (_) { return null; }
  })();
  // 应用保存的主题
  if (saved && saved !== 'default') {
    setTheme(saved);
  } else {
    setTheme('default');
  }
  // 绑定按钮事件
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.themeVal));
  });
}

/* ==================== 初始化入口 ==================== */

/** 初始化幻灯片和导航 */
function initNavigation() {
  slides = document.querySelectorAll('.slide');
  const dotsContainer = document.getElementById('nav-dots');

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'nav-dot';
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });
  dots = document.querySelectorAll('.nav-dot');

  // 键盘导航
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      prevSlide();
    }
  });

  // 按钮导航
  document.getElementById('nav-prev').addEventListener('click', prevSlide);
  document.getElementById('nav-next').addEventListener('click', nextSlide);

  // 一图流切换
  document.getElementById('btn-onepager').addEventListener('click', toggleOnePager);

  // URL hash 定位
  const hash = window.location.hash.slice(1);
  const hashIdx = SLIDE_IDS.indexOf(hash);
  const startIdx = hashIdx >= 0 ? hashIdx : 0;
  goToSlide(startIdx);
}

/**
 * 主入口：加载数据 → 渲染模块 → 初始化图表
 */
async function main() {
  initNavigation();
  initThemes();

  await loadData();
  if (!reportData) return;

  renderAll();

  // 初始化当前幻灯片的图表
  initChartForSlide(currentSlide);
}

main();
