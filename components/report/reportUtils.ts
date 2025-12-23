import { Chart as ChartJS } from 'chart.js/auto';

// Calculate section scores (sum, count, percent score 0-100)
export function calculateSectionScores(responses: any[]) {
  const sectionMap: Record<string, { sum: number; count: number }> = {};
  responses.forEach((r) => {
    if (r.section) {
      if (!sectionMap[r.section]) sectionMap[r.section] = { sum: 0, count: 0 };
      sectionMap[r.section].sum += Number(r.score) || 0;
      sectionMap[r.section].count += 1;
    }
  });

  return Object.entries(sectionMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([section, { sum, count }]) => {
      const lowest = 1 * count;
      const range = 5 * count - 1 * count;
      const transformed = range === 0 ? 0 : ((sum - lowest) / range) * 100;
      return {
        section,
        sum,
        count,
        score: Math.round(transformed),
      };
    });
}

// Helper that returns simple {section, score} list used by group report
export function sectionScoresForResponses(responses: any[]) {
  return calculateSectionScores(responses).map(({ section, score }) => ({ section, score }));
}

// Get stats and recommendation
export function getSectionStatsAndRecommendation(questionnaireSlug: string, section: string, score: number) {
  const ASSESSMENT_STATS: Record<string, Record<string, { mean: number; sd: number }>> = {
    KINDL36: {
      'Emotional wellbeing': { mean: 80.24, sd: 15.713 },
      Family: { mean: 83.04, sd: 11.414 },
      'Physical wellbeing': { mean: 73.57, sd: 13.324 },
      School: { mean: 80.7, sd: 11.905 },
      'Self-esteem': { mean: 79.72, sd: 12.319 },
      'Social contacts': { mean: 83.8, sd: 12.461 },
      Optional: { mean: 80, sd: 15 },
    },
    KINDL717: {
      'Physical wellbeing': { mean: 76.5, sd: 17.3 },
      'Emotional wellbeing': { mean: 80.8, sd: 12.8 },
      'Self-esteem': { mean: 68.8, sd: 14.2 },
      Family: { mean: 77.7, sd: 14.3 },
      'Social contacts': { mean: 78, sd: 13.4 },
      School: { mean: 76, sd: 16 },
    },
  };

  const stats = ASSESSMENT_STATS[questionnaireSlug]?.[section];
  let recommendation = '';
  if (stats) {
    const { mean, sd } = stats;
    if (score < mean - sd) recommendation = 'Low';
    else if (score < mean) recommendation = 'Average';
    else recommendation = 'Excellent';
    return { mean, sd, recommendation };
  }
  return { mean: undefined, sd: undefined, recommendation: undefined };
}

// Capture radar chart as image. label controls primary dataset name (User Score / Class Average etc.)
export const captureChartAsImage = async (
  sectionScores: any[],
  questionnaireSlug: string,
  hasStats: boolean,
  label = 'User Score'
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 550;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    const chart = new ChartJS(ctx, {
      type: 'radar',
      data: {
        labels: sectionScores.map((s) => s.section),
        datasets: [
          {
            label,
            data: sectionScores.map((s) => s.score),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
          },
          ...(hasStats
            ? [
                {
                  label: 'Normative Score',
                  data: sectionScores.map((s) => {
                    const { mean, sd } = getSectionStatsAndRecommendation(questionnaireSlug, s.section, s.score);
                    return mean !== undefined && sd !== undefined ? parseFloat((mean - sd).toFixed(2)) : 0;
                  }),
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 2,
                },
              ]
            : []),
        ],
      },
      options: {
        responsive: false,
        scales: {
          r: {
            angleLines: { display: true },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { stepSize: 20 },
          },
        },
      },
    });

    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png');
      try {
        chart.destroy();
      } catch (e) {
        // ignore
      }
      resolve(imageData);
    }, 1000);
  });
};
