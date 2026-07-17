/**
 * 大秘境分数行情 · ECharts 图表初始化
 *
 * 职责：初始化分数趋势折线图、生态环形图、副本柱状图、铁钥匙趋势图
 * @author ext.ahs.lvxingz1
 */

/** ECharts 暗色主题公共配置 */
const darkTheme = {
  textStyle: { color: '#8892a4' },
  legend: { textStyle: { color: '#8892a4' } },
};

/**
 * 初始化分数行情趋势图（Slide 2）
 * 最高分数 / 1%分数 / 0.1%分数 三条折线
 */
function initScoreTrendChart() {
  const dom = document.getElementById('chart-score-trend');
  if (!dom) return;

  // 如果已初始化则复用
  let chart = dom._echartInstance;
  if (!chart) {
    chart = echarts.init(dom);
    dom._echartInstance = chart;
    // 监听窗口 resize
    window.addEventListener('resize', () => chart.resize());
  }

  if (!reportData || !reportData.daily.length) return;

  const dates = reportData.daily.map(d => d.date.substring(4, 8));
  const lastIdx = reportData.daily.length - 1;

  /** 构建带最新值高亮的数据数组 */
  function makeHighlightData(values, normalSize, hlSize) {
    return values.map((v, i) => i === lastIdx
      ? { value: v, symbolSize: hlSize, itemStyle: { shadowBlur: 16, shadowColor: 'rgba(228, 199, 107, 0.5)' } }
      : v);
  }

  const option = {
    ...darkTheme,
    grid: { top: 40, right: 60, bottom: 60, left: 80 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: 'rgba(201, 168, 76, 0.3)',
      textStyle: { color: '#f0f0f0', fontSize: 16 }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#2a3040' } },
      axisLabel: { color: '#8892a4', fontSize: 16 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '分数',
      nameTextStyle: { color: '#8892a4', fontSize: 14 },
      axisLabel: { color: '#8892a4', fontSize: 16 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      min: function (val) { return Math.floor(val.min / 100) * 100 - 50; },
      max: function (val) { return Math.ceil(val.max / 100) * 100 + 50; }
    },
    series: [
      {
        name: '最高分数',
        type: 'line',
        data: makeHighlightData(reportData.daily.map(d => d.rank1.score), 10, 18),
        lineStyle: { color: '#e4c76b', width: 3 },
        itemStyle: { color: '#e4c76b' },
        symbol: 'circle',
        symbolSize: 10,
        label: { show: true, color: '#e4c76b', fontSize: 16, position: 'top' }
      },
      {
        name: '0.1%分数',
        type: 'line',
        data: makeHighlightData(reportData.daily.map(d => d.top01Pct), 8, 14),
        lineStyle: { color: '#d4783b', width: 2, type: 'dashed' },
        itemStyle: { color: '#d4783b' },
        symbol: 'diamond',
        symbolSize: 8,
        label: { show: true, color: '#d4783b', fontSize: 14, position: 'top' }
      },
      {
        name: '1%分数',
        type: 'line',
        data: makeHighlightData(reportData.daily.map(d => d.top1Pct), 8, 14),
        lineStyle: { color: '#5a8fbf', width: 2 },
        itemStyle: { color: '#5a8fbf' },
        symbol: 'triangle',
        symbolSize: 8,
        label: { show: true, color: '#5a8fbf', fontSize: 14, position: 'bottom' }
      }
    ]
  };

  chart.setOption(option, true);
  chart.resize();
}

/**
 * 初始化副本限时完成层数柱状图（Slide 6）
 */
function initDungeonChart() {
  const dom = document.getElementById('chart-dungeons');
  if (!dom) return;

  let chart = dom._echartInstance;
  if (!chart) {
    chart = echarts.init(dom);
    dom._echartInstance = chart;
    window.addEventListener('resize', () => chart.resize());
  }

  if (!reportData) return;
  const l = reportData.daily[reportData.daily.length - 1];
  if (!l) return;

  const dungeons = l.dungeons;
  const names = dungeons.map(d => d.name);
  const levels = dungeons.map(d => d.level);

  const option = {
    ...darkTheme,
    grid: { top: 40, right: 60, bottom: 80, left: 60 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: 'rgba(201, 168, 76, 0.3)',
      textStyle: { color: '#f0f0f0', fontSize: 18 },
      formatter: '{b}: {c}层'
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: '#2a3040' } },
      axisLabel: { color: '#8892a4', fontSize: 16, rotate: 20 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '层数',
      nameTextStyle: { color: '#8892a4', fontSize: 14 },
      axisLabel: { color: '#8892a4', fontSize: 16 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      min: 20,
      max: 26,
      interval: 1
    },
    series: [
      {
        type: 'bar',
        data: levels.map((level, i) => ({
          value: level,
          itemStyle: {
            color: level >= 25
              ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#e4c76b' },
                  { offset: 1, color: '#c9a84c' }
                ])
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#5a8fbf' },
                  { offset: 1, color: '#3a6f9f' }
                ])
          }
        })),
        barWidth: 48,
        label: {
          show: true,
          position: 'top',
          color: '#f0f0f0',
          fontSize: 20,
          fontWeight: 'bold'
        },
        itemStyle: {
          borderRadius: [8, 8, 0, 0]
        }
      }
    ]
  };

  chart.setOption(option, true);
  chart.resize();
}

/**
 * 初始化铁钥匙人数趋势图（Slide 7）
 * 24铁 / 23铁 两条折线
 */
function initIronChart() {
  const dom = document.getElementById('chart-iron');
  if (!dom) return;

  let chart = dom._echartInstance;
  if (!chart) {
    chart = echarts.init(dom);
    dom._echartInstance = chart;
    window.addEventListener('resize', () => chart.resize());
  }

  if (!reportData || !reportData.daily.length) return;

  const dates = reportData.daily.map(d => d.date.substring(4, 8));
  const lastIdx2 = reportData.daily.length - 1;

  function makeHighlightData(values) {
    return values.map((v, i) => i === lastIdx2
      ? { value: v, symbolSize: 18, itemStyle: { shadowBlur: 16, shadowColor: 'rgba(228, 199, 107, 0.5)' } }
      : v);
  }

  const option = {
    ...darkTheme,
    grid: { top: 40, right: 60, bottom: 60, left: 80 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: 'rgba(201, 168, 76, 0.3)',
      textStyle: { color: '#f0f0f0', fontSize: 16 }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#2a3040' } },
      axisLabel: { color: '#8892a4', fontSize: 16 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '人数',
      nameTextStyle: { color: '#8892a4', fontSize: 14 },
      axisLabel: { color: '#8892a4', fontSize: 16 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }
    },
    series: [
      {
        name: '24铁人数',
        type: 'line',
        data: makeHighlightData(reportData.daily.map(d => d.iron24)),
        lineStyle: { color: '#e4c76b', width: 3 },
        itemStyle: { color: '#e4c76b' },
        symbol: 'circle',
        symbolSize: 10,
        label: { show: true, color: '#e4c76b', fontSize: 16, position: 'top' }
      },
      {
        name: '23铁人数',
        type: 'line',
        data: makeHighlightData(reportData.daily.map(d => d.iron23)),
        lineStyle: { color: '#d4783b', width: 3 },
        itemStyle: { color: '#d4783b' },
        symbol: 'diamond',
        symbolSize: 10,
        label: { show: true, color: '#d4783b', fontSize: 16, position: 'top' }
      }
    ]
  };

  chart.setOption(option, true);
  chart.resize();
}
