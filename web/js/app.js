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

  document.getElementById('so-season').textContent = reportData.meta.season;
  document.getElementById('so-week').textContent = l.seasonWeek;
  document.getElementById('so-remaining').textContent = l.weeksRemaining;

  // 最新数据日期格式化 MM/DD
  const dateStr = reportData.meta.latestDate;
  const mmdd = dateStr.substring(4, 6) + '/' + dateStr.substring(6, 8);
  document.getElementById('so-update').textContent = mmdd + ' 更新';
}

/**
 * 渲染第一名高光（Slide 3）
 */
function renderRank1() {
  const l = latest();
  if (!l) return;

  document.getElementById('r1-score').textContent = l.rank1.score;
  document.getElementById('r1-player').textContent = l.rank1.player;
  document.getElementById('r1-class').innerHTML =
    iconImg(l.rank1.class, 'icon-md') + showName(l.rank1.class);

  const teamEl = document.getElementById('r1-team');
  teamEl.innerHTML = l.rank1.team
    .map(m => `<span class="member">${m}</span>`)
    .join('');
}

/**
 * 渲染国家队生态（Slide 4）
 */
function renderEco() {
  const l = latest();
  if (!l) return;

  document.getElementById('eco-national').textContent =
    (l.nationalTeamRatio * 100).toFixed(0) + '%';
  document.getElementById('eco-non-national').textContent =
    (l.nonNationalRatio * 100).toFixed(0) + '%';

  // 渲染国家队阵容
  const lineupEl = document.getElementById('eco-lineup');
  if (!lineupEl || !reportData.nationalTeam) return;

  const roleIcons = {
    '坦克': '🛡️',
    '治疗': '💚',
    '输出': '⚔️'
  };

  lineupEl.innerHTML = reportData.nationalTeam.map(item => `
    <div class="lineup-role">
      <div class="lineup-role-name">${roleIcons[item.role] || ''} ${item.role}</div>
      <div class="lineup-classes">
        ${item.classes.map(c => `
          <span class="lineup-class-tag">
            ${iconImg(c, 'icon-sm')}<span>${showName(c)}</span>
          </span>
        `).join('')}
      </div>
    </div>
  `).join('');
}

/**
 * 渲染信仰专精卡片（Slide 5）
 */
function renderFaith() {
  const l = latest();
  if (!l) return;

  const container = document.getElementById('faith-cards');
  container.innerHTML = l.faithSpecs.map(spec => `
    <div class="faith-card">
      ${iconImg(spec.name, 'icon-lg')}
      <div class="faith-spec-name">${showName(spec.name)}</div>
      <div class="faith-spec-score">${spec.score}</div>
      <div class="faith-spec-label">最高分数</div>
    </div>
  `).join('');
}

/**
 * 渲染所有非图表模块
 */
function renderAll() {
  renderOverview();
  renderRank1();
  renderEco();
  renderFaith();
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
      case 3: initPieChart(); break;
      case 5: initDungeonChart(); break;
      case 6: initIronChart(); break;
    }
  }, 100);
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

  await loadData();
  if (!reportData) return;

  renderAll();

  // 初始化当前幻灯片的图表
  initChartForSlide(currentSlide);
}

main();
