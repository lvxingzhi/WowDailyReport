/**
 * 大秘境分数行情 · ECharts 图表初始化
 * Neo-brutalism 主题：硬边框、粗线条、高饱和色彩
 * @author ext.ahs.lvxingz1
 */

/** Neo-brutalism 浅色主题 */
const neoTheme = {
  textStyle: { color: '#000000', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 },
  legend: { textStyle: { color: '#000000', fontWeight: 700 } },
};

/** Neo-brutalism 色彩方案 */
const neoColors = {
  top: '#FF6B6B',       // 最高分数 — 红
  pct01: '#C4B5FD',     // 0.1% 分数线 — 紫
  pct09: '#82C878',     // 0.9% 分数线 — 绿
  pct1: '#FFD93D',      // 1% 分数线 — 黄
  pct009: '#F59E0B',    // 0.09% 分数线 — 金橙
  bar: '#000000',       // 柱状图 — 黑
  barAccent: '#FF6B6B', // 柱状图高亮 — 红
};

/**
 * 初始化分数行情趋势图（Slide 2）
 * 最高分数 / 1%分数 / 0.1%分数 三条折线
 */
function initScoreTrendChart() {
  const dom = document.getElementById('chart-score-trend');
  if (!dom) return;

  let chart = dom._echartInstance;
  if (!chart) {
    chart = echarts.init(dom);
    dom._echartInstance = chart;
    window.addEventListener('resize', () => chart.resize());
  }

  if (!reportData || !reportData.daily.length) return;

  const recent = reportData.daily.slice(-7);
  const dates = recent.map(d => d.date.substring(4, 8));
  const lastIdx = recent.length - 1;

  /** 最后一个数据点加粗高亮：去偏移阴影，避免“错位”感 */
  function makeHighlightData(values, normalSize, hlSize, color) {
    return values.map((v, i) => i === lastIdx
      ? {
          value: v,
          symbolSize: hlSize,
          itemStyle: {
            color: color,
            borderColor: '#000000',
            borderWidth: 3
          }
        }
      : v);
  }

  const option = {
    ...neoTheme,
    backgroundColor: '#FFFFFF',
    grid: { top: 30, right: 60, bottom: 50, left: 70 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#000000',
      borderWidth: 3,
      textStyle: { color: '#000000', fontSize: 14, fontWeight: 700 },
      extraCssText: 'box-shadow: 6px 6px 0px 0px #000000;'
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#000000', width: 3 } },
      axisLabel: { color: '#000000', fontSize: 14, fontWeight: 700 },
      axisTick: { show: true, lineStyle: { color: '#000000', width: 2 } }
    },
    yAxis: {
      type: 'value',
      name: '分数',
      nameTextStyle: { color: '#000000', fontSize: 12, fontWeight: 900 },
      axisLabel: { color: '#000000', fontSize: 14, fontWeight: 700 },
      axisLine: { lineStyle: { color: '#000000', width: 3 } },
      splitLine: { lineStyle: { color: '#000000', width: 1, type: 'dashed', opacity: 0.2 } },
      min: function (val) { return Math.floor(val.min / 100) * 100 - 50; },
      max: function (val) { return Math.ceil(val.max / 100) * 100 + 50; }
    },
    series: [
      {
        name: '0.1% 分数线',
        type: 'line',
        data: makeHighlightData(
          recent.map(d => d.top01Pct),
          10, 16, neoColors.pct01
        ),
        lineStyle: { color: neoColors.pct01, width: 4 },
        itemStyle: { color: neoColors.pct01, borderColor: '#000000', borderWidth: 2 },
        symbol: 'diamond',
        symbolSize: 12,
        label: {
          show: true, color: '#000000', fontSize: 16, fontWeight: 900,
          position: 'top',
          backgroundColor: '#FFFFFF', borderColor: '#000000', borderWidth: 2,
          padding: [4, 8], formatter: '{c}'
        }
      },
      {
        name: '1% 分数线',
        type: 'line',
        data: makeHighlightData(
          recent.map(d => d.top1Pct),
          10, 16, neoColors.pct1
        ),
        lineStyle: { color: neoColors.pct1, width: 4 },
        itemStyle: { color: neoColors.pct1, borderColor: '#000000', borderWidth: 2 },
        symbol: 'triangle',
        symbolSize: 12,
        label: {
          show: true, color: '#000000', fontSize: 16, fontWeight: 900,
          position: 'bottom',
          backgroundColor: '#FFFFFF', borderColor: '#000000', borderWidth: 2,
          padding: [4, 8], formatter: '{c}'
        }
      }
    ]
  };

  chart.setOption(option, true);
  chart.resize();
}
