"use client";

import React, { useEffect, useMemo, useState } from 'react';
import ChartJS from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
} from 'chart.js';
import { useGroupAssignmentReport } from '@/hooks/useAssessments';
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf, Image } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  ChartDataLabels
);

interface GroupLevelReportProps {
  orgId: string;
  projectId: string;
  groupId: string;
  groupName?: string;
  onClose: () => void;
}

import { captureChartAsImage } from './reportUtils';

const captureBarChartAsImage = async (totalStudents: number, completedStudents: number, pendingStudents: number): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    const chart = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels: ['Total Students', 'Students Completed', 'Students Pending'],
        datasets: [
          {
            label: 'Count',
            data: [totalStudents, completedStudents, pendingStudents],
            backgroundColor: [
              'rgba(75, 192, 192, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });

    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png');
      chart.destroy();
      resolve(imageData);
    }, 1000);
  });
};

const capturePieChartAsImage = async (belowNormative: number, withinNormative: number): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    const chart = new ChartJS(ctx, {
      type: 'pie',
      data: {
        labels: ['Below Normative Score', 'Within Normative Score'],
        datasets: [
          {
            label: 'Student Count',
            data: [belowNormative, withinNormative],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Student Performance vs. Normative Scores'
          }
        }
      },
    });

    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png');
      chart.destroy();
      resolve(imageData);
    }, 1000);
  });
};

const captureSparklineAsImage = async (scores: number[]): Promise<string> => {
  // Don't generate a chart for a single data point
  if (scores.length <= 1) return '';

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    const chart = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: scores.map((_, i) => `A${i + 1}`), // Simple labels for each point
        datasets: [
          {
            data: scores,
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointRadius: 1.5,
            fill: false,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
            datalabels: {
            display: true,
            align: 'bottom', // Position the label above the data point
            color: '#333333', // Color of the text
            font: {
              size: 9, // Font size for the score
              weight: 'bold',
            },
            offset: -5, 
          },
        },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    });

    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png');
      chart.destroy();
      resolve(imageData);
    }, 200);
  });
};


// Styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 8
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  tableCell: {
    fontSize: 11,
    textAlign: 'center'
  },
  tableCellBold: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  chartImage: {
    width: 430,
    height: 300,
    alignSelf: 'center'
  },
  barChartImage: {
    width: 380,
    height: 220,
    alignSelf: 'center'
  },
  pieChartImage: {
    width: 320,
    height: 240,
    alignSelf: 'center',
  },
  sparklineImage: {
    width: 160,
    height: 40,
    alignSelf: 'center',
  },
  combinedContentContainer: {
    flexDirection: 'column',
    marginTop: 20,
  },
  chartSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  tableSection: {
    width: '100%',
  },
  classOverviewContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'solid',
  },
  classOverviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#2c3e50',
  },
  overviewDetailsRow: {
    marginBottom: 16,
  },
  overviewChartRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewText: {
    fontSize: 12,
    marginBottom: 4,
    color: '#495057',
  },
  overviewTextBold: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2c3e50',
  },
});

const StudentScoresTable = ({ studentScores, hasStats }: { studentScores: any[], hasStats: boolean }) => (
  <View style={styles.tableSection}>
    <Text style={{ fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 10 }}>
      Individual Student Scores
    </Text>
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableRow}>
        <View style={{ ...styles.tableColHeader, width: '25%' }}>
          <Text style={styles.tableCellHeader}>Student Name</Text>
        </View>
        <View style={{ ...styles.tableColHeader, width: '20%' }}>
          <Text style={styles.tableCellHeader}>Latest Score (0-100)</Text>
        </View>
        {hasStats && (
          <View style={{ ...styles.tableColHeader, width: '20%' }}>
            <Text style={styles.tableCellHeader}>Recommendation</Text>
          </View>
        )}
        <View style={{ ...styles.tableColHeader, width: hasStats ? '35%' : '55%' }}>
          <Text style={styles.tableCellHeader}>Previous score trend</Text>
        </View>
      </View>

      {/* Body */}
      {studentScores.map((student, index) => (
        <View style={styles.tableRow} key={index}>
          <View style={{ ...styles.tableCol, width: '25%' }}>
            <Text style={styles.tableCell}>{student.name}</Text>
          </View>
          <View style={{ ...styles.tableCol, width: '20%' }}>
            <Text style={styles.tableCell}>{student.score}</Text>
          </View>
          {hasStats && (
            <View style={{ ...styles.tableCol, width: '20%' }}>
              <Text style={styles.tableCell}>{student.recommendation}</Text>
            </View>
          )}
          <View style={{ ...styles.tableCol, width: hasStats ? '35%' : '55%', justifyContent: 'center', alignItems: 'center' }}>
            {student.sparklineImage ? (
              <Image src={student.sparklineImage} style={styles.sparklineImage} />
            ) : (
              <Text style={styles.tableCell}>
                {/* Fallback for single scores or if image fails */}
                {student.previousScores.length > 0 ? [...student.previousScores, student.score].join(' - ') : 'N/A'}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  </View>
);

const PDFReport = ({
  sectionScores,
  questionnaireSlug,
  hasStats,
  chartImageData,
  barChartImageData,
  pieChartDataUrl,
  groupName,
  totalStudents,
  completedCount,
  pendingCount,
  completionRatio,
  studentScores
}: any) => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={{ ...styles.page, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>
          Group Level Wellness Report
        </Text>
        {groupName && (
          <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 8 }}>{groupName}</Text>
        )}
        <Text style={{ fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
          {new Date().toLocaleDateString()}
        </Text>
      </View>
      <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
        <Image src='/NH_logo.png' style={{ width: 200, height: 'auto' }} />
      </View>
    </Page>

    {/* Main Report Page */}
    <Page size="A4" style={styles.page}>
      {/* Class Overview Section */}
      <View style={styles.classOverviewContainer}>
        <Text style={styles.classOverviewTitle}>Class Overview</Text>

        {/* Details Row */}
        <View style={styles.overviewDetailsRow}>
          <Text style={styles.overviewTextBold}>Total students: {totalStudents}</Text>
          <Text style={styles.overviewText}>Students with completed assessments: {completedCount}</Text>
          <Text style={styles.overviewText}>Students with pending assessments: {pendingCount}</Text>
          <Text style={styles.overviewText}>Completion ratio: {completionRatio}%</Text>
        </View>

        {/* Chart Row */}
        <View style={styles.overviewChartRow}>
          {barChartImageData && (
            <Image src={barChartImageData} style={styles.barChartImage} />
          )}
        </View>
      </View>

      {/* Combined Chart and Table Section */}
      <View style={styles.combinedContentContainer}>
        {/* Radar Chart Section */}
        {chartImageData && (
          <View style={styles.chartSection}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
              Class Average Scores by Domain (from completed students)
            </Text>
            <Image src={chartImageData} style={styles.chartImage} />
          </View>
        )}

        {/* Detailed Analysis Table Section */}
        <View style={styles.tableSection}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 10 }}>
            Detailed Section Analysis (from completed students)
          </Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Domain</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Class Average (0-100)</Text>
              </View>
              {hasStats && (
                <>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Normative Score</Text>
                  </View>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Recommendation</Text>
                  </View>
                </>
              )}
            </View>
            {sectionScores.map((s: any) => {
              const normative = s.normativeScore !== undefined ? Number(s.normativeScore).toFixed(2) : undefined;
              const recommendation = s.recommendation;
              return (
                <View style={styles.tableRow} key={s.section}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCellBold}>{s.section}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{s.score}</Text>
                  </View>
                  {hasStats && (
                    <>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>{normative ?? '-'}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>{recommendation ?? '-'}</Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
            {/* Overall Average Row */}
            {(() => {
              if (sectionScores.length === 0) return null;
              const overallScore = Math.round(
                sectionScores.reduce((sum: number, s: any) => sum + s.score, 0) / sectionScores.length
              );
              const overallNormative = hasStats ?
                (() => {
                  const vals = sectionScores.map((s: any) => s.normativeScore).filter((v: any) => v !== undefined && v !== null);
                  if (vals.length === 0) return undefined;
                  const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
                  return avg.toFixed(2);
                })() : undefined;

              let overallRecommendation = '';
              if (hasStats && overallNormative) {
                if (overallScore < parseFloat(overallNormative)) overallRecommendation = "Low";
                else if (overallScore < parseFloat(overallNormative) * 1.2) overallRecommendation = "Average";
                else overallRecommendation = "Excellent";
              }

              return (
                <View style={styles.tableRow} key="overall">
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCellBold}>Overall Average</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCellBold}>{overallScore}</Text>
                  </View>
                  {hasStats && (
                    <>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCellBold}>{overallNormative}</Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCellBold}>{overallRecommendation}</Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })()}
          </View>
        </View>
      </View>

      {/* Recommendations Section */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          Group Recommendations
        </Text>
        {(() => {
          if (sectionScores.length === 0) {
            return (
              <Text style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.5 }}>
                No completed assessments available to generate group recommendations.
              </Text>
            )
          }
          const lowSections = sectionScores.filter((s: any) => s.recommendation === 'Low').map((s: any) => s.section);

          const excellentSections = sectionScores.filter((s: any) => s.recommendation === 'Excellent').map((s: any) => s.section);

          const groupName_text = groupName || 'This group';
          const lowStr = lowSections.length > 0 ? lowSections.join(', ') : 'none';
          const excellentStr = excellentSections.length > 0 ? excellentSections.join(', ') : 'none';

          return (
            <Text style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.5 }}>
              {groupName_text} shows strong performance in: {excellentStr}. {'\n'}
              Areas that may need attention: {lowStr}. {'\n'}
              This group-level analysis can help identify patterns and inform targeted interventions or celebrations of success. Consider discussing these results with individual students and their families, as group averages may not reflect individual experiences. {'\n'}
              Use this data to guide classroom activities, wellness programs, and support strategies that address the areas needing attention while building on the group's strengths.
            </Text>
          );
        })()}
      </View>

      {/* Pie Chart Section */}
      {pieChartDataUrl && (
        <View style={{ ...styles.chartSection, marginTop: 20 }}>
          <Image src={pieChartDataUrl} style={styles.pieChartImage} />
        </View>
      )}

      {/* Individual Student Scores Table */}
      <StudentScoresTable studentScores={studentScores} hasStats={hasStats} />

    </Page>
  </Document>
);

const GroupLevelReport: React.FC<GroupLevelReportProps> = ({
  orgId,
  projectId,
  groupId,
  groupName,
  onClose
}) => {
  const { data: reportData, isLoading } = useGroupAssignmentReport(orgId, projectId, groupId);
  const assignments = reportData?.assignments || [];
  const questionnaire = reportData?.questionnaire;
  const [chartDataUrl, setChartDataUrl] = useState<string>('');
  const [barChartDataUrl, setBarChartDataUrl] = useState<string>('');
  const [pieChartDataUrl, setPieChartDataUrl] = useState<string>('');
  const [processedStudentScores, setProcessedStudentScores] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Compute counts
  const totalStudents = new Set(assignments.map((a: any) => a.userId)).size;
  const completedStudents = new Set(assignments.filter((a: any) => a.status === 'COMPLETED').map((a: any) => a.userId)).size;
  const pendingStudents = totalStudents - completedStudents;
  const completionRatio = totalStudents === 0 ? 0 : Math.round((completedStudents / totalStudents) * 100);
  const hasStats = (questionnaire?.slug === 'KINDL36' || questionnaire?.slug === 'KINDL717');

  // Build class-average section scores
  const sectionAverages = useMemo(() => {
    const acc: Record<string, { sum: number; count: number; normativeSum: number; recommendationCounts: Record<string, number> }> = {};
    const completed = assignments.filter((a: any) => a.status === 'COMPLETED');

    completed.forEach((assignment: any) => {
      const finalScoreEntry = assignment.responses?.find((r: any) => r.question === "Final Score");
      if (finalScoreEntry && Array.isArray(finalScoreEntry.response)) {
        finalScoreEntry.response.forEach((s: any) => {
          if (!acc[s.section]) {
            acc[s.section] = { sum: 0, count: 0, normativeSum: 0, recommendationCounts: {} };
          }
          acc[s.section].sum += s.score;
          acc[s.section].count += 1;
          acc[s.section].normativeSum += s.normativeScore || 0;
          acc[s.section].recommendationCounts[s.recommendation || 'N/A'] =
            (acc[s.section].recommendationCounts[s.recommendation || 'N/A'] || 0) + 1;
        });
      }
    });

    return Object.entries(acc)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([section, { sum, count, normativeSum, recommendationCounts }]) => {
        let recommendation = 'N/A';
        if (recommendationCounts['Low']) recommendation = 'Low';
        else if (recommendationCounts['Average']) recommendation = 'Average';
        else if (recommendationCounts['Excellent']) recommendation = 'Excellent';

        return {
          section,
          score: count ? Math.round(sum / count) : 0,
          normativeScore: count ? Math.round(normativeSum / count) : 0,
          recommendation,
        };
      });
  }, [assignments]);

  function calculateAvg(assignment: any) {
    if (!assignment || !Array.isArray(assignment.responses)) return null;
    const finalScoreEntry = assignment.responses.find((r: any) => r.question === "Final Score");
    if (!finalScoreEntry || !Array.isArray(finalScoreEntry.response)) return null;
    const sectionScores: number[] = finalScoreEntry.response.map((s: any) => s.score || 0);
    return sectionScores.length > 0
      ? Math.round(sectionScores.reduce((a: number, b: number) => a + b, 0) / sectionScores.length)
      : null;
  }


  const studentScores = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    assignments.forEach((a: any) => {
      if (!grouped[a.userId]) grouped[a.userId] = [];
      grouped[a.userId].push(a);
    });

    return Object.values(grouped).map((studentAssignments: any[]) => {
      studentAssignments.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
      
      const recentAssignments = studentAssignments.slice(-8);

      const latest = recentAssignments[recentAssignments.length - 1];
      const previous = recentAssignments.slice(0, -1);

      const latestScore = calculateAvg(latest) ?? 0;
      const previousScores = previous
        .map(a => calculateAvg(a))
        .filter(s => s !== null) as number[];
        
      // Recommendation from latest
      let recommendation = 'N/A';
      if (latest.status === 'COMPLETED') {
        const finalScoreEntry = latest.responses?.find((r: any) => r.question === "Final Score");
        if (finalScoreEntry && Array.isArray(finalScoreEntry.response)) {
          if (finalScoreEntry.response.some((s: any) => s.recommendation === "Low")) recommendation = "Low";
          else if (finalScoreEntry.response.some((s: any) => s.recommendation === "Average")) recommendation = "Average";
          else recommendation = "Excellent";
        }
      } else {
        recommendation = "Pending";
      }

      return {
        name: latest.userName || `Student ${latest.userId}`,
        score: latestScore,
        recommendation,
        previousScores,
      };
    });
  }, [assignments]);

  const normativeCounts = useMemo(() => {
    if (!hasStats) return { below: 0, within: 0 };

    let below = 0, within = 0;
    assignments.forEach((assignment: any) => {
      if (assignment.status === 'COMPLETED') {
        const finalScoreEntry = assignment.responses?.find((r: any) => r.question === "Final Score");
        if (finalScoreEntry && Array.isArray(finalScoreEntry.response)) {
          const studentAvgScore = finalScoreEntry.response.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / finalScoreEntry.response.length;
          const avgNormative = finalScoreEntry.response.reduce((sum: number, s: any) => sum + (s.normativeScore || 0), 0) / finalScoreEntry.response.length;

          if (studentAvgScore < avgNormative) below++;
          else within++;
        }
      }
    });

    return { below, within };
  }, [assignments, hasStats]);


  useEffect(() => {
    if (sectionAverages.length > 0) {
      captureChartAsImage(sectionAverages, questionnaire?.slug || '', hasStats)
        .then(setChartDataUrl)
        .catch(console.error);
    }

    captureBarChartAsImage(totalStudents, completedStudents, pendingStudents)
      .then(setBarChartDataUrl)
      .catch(console.error);

    if (hasStats && completedStudents > 0) {
      capturePieChartAsImage(normativeCounts.below, normativeCounts.within)
        .then(setPieChartDataUrl)
        .catch(console.error);
    }

    const generateSparklines = async () => {
      const processedData = await Promise.all(
        studentScores.map(async (student) => {
          const scoreHistory = [...student.previousScores, student.score];
          const sparklineImage = await captureSparklineAsImage(scoreHistory);
          return {
            ...student,
            sparklineImage,
          };
        })
      );
      setProcessedStudentScores(processedData);
    };

    if (studentScores.length > 0) {
      generateSparklines();
    } else {
      setProcessedStudentScores([]); // Clear if there are no students
    }

  }, [sectionAverages, assignments, hasStats, totalStudents, completedStudents, pendingStudents, normativeCounts, studentScores]);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      let imageData = chartDataUrl;
      let barImageData = barChartDataUrl;
      let pieImageData = pieChartDataUrl;

      if (!imageData && sectionAverages.length > 0) {
        imageData = await captureChartAsImage(sectionAverages, questionnaire?.slug || '', hasStats);
      }

      if (!barImageData) {
        barImageData = await captureBarChartAsImage(totalStudents, completedStudents, pendingStudents);
      }

      if (!pieImageData && hasStats && completedStudents > 0) {
        pieImageData = await capturePieChartAsImage(normativeCounts.below, normativeCounts.within);
      }

      const doc = (
        <PDFReport
          sectionScores={sectionAverages}
          questionnaireSlug={questionnaire?.slug}
          hasStats={hasStats}
          chartImageData={imageData}
          barChartImageData={barImageData}
          pieChartDataUrl={pieImageData}
          groupName={groupName}
          totalStudents={totalStudents}
          completedCount={completedStudents}
          pendingCount={pendingStudents}
          completionRatio={completionRatio}
          studentScores={processedStudentScores}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `group-level-report-${groupName || groupId}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">Loading report data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-[95%] max-w-6xl h-[90%] flex flex-col">
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b rounded-t-lg">
          <h2 className="text-xl font-bold">Group Level Report - {groupName}</h2>
          <div className="flex gap-2">
            <Button onClick={handleDownload} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 p-4 overflow-auto">
          <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <PDFReport
              sectionScores={sectionAverages}
              questionnaireSlug={questionnaire?.slug}
              hasStats={hasStats}
              chartImageData={chartDataUrl}
              barChartImageData={barChartDataUrl}
              pieChartDataUrl={pieChartDataUrl}
              groupName={groupName}
              totalStudents={totalStudents}
              completedCount={completedStudents}
              pendingCount={pendingStudents}
              completionRatio={completionRatio}
              studentScores={processedStudentScores}
            />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

export default GroupLevelReport;