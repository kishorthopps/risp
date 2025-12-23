import React, { useMemo, useState, useRef, useEffect } from "react";
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf, Image } from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import { Chart as ChartJS } from 'chart.js/auto';
import { calculateSectionScores, getSectionStatsAndRecommendation, captureChartAsImage } from './reportUtils';

interface UserLevelReportProps {
  responses: any[];
  assessmentName: string;
  userName: string;
  onClose: () => void;
}

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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 11,
    textAlign: 'center',
  },
  tableCellBold: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  chartImage: {
    width: 430,
    height: 300,
    alignSelf: 'center',
  },
  combinedContentContainer: {
    flexDirection: 'column',
    marginTop: 20,
  },
  chartSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  tableSection: {
    width: '100%',
  },
});

const PDFReport = ({ sectionScores, assessmentName, hasStats, chartImageData, userName }: {
  sectionScores: any[];
  assessmentName: string;
  hasStats: boolean;
  chartImageData?: string;
  userName?: string;
}) => (
  <Document>
    <Page size="A4" style={{ ...styles.page, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>
          Individual Student Wellness and Health Report
        </Text>
        {userName && (
          <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 8 }}>{userName}</Text>
        )}
        <Text style={{ fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
          {new Date().toLocaleDateString()}
        </Text>
      </View>
      <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
        <Image src='/NH_logo.png' style={{ width: 200, height: 'auto' }} />
      </View>
    </Page>

    <Page size="A4" style={styles.page}>
      <View style={styles.combinedContentContainer}>
        {/* Chart Section - Full Width Row */}
        {chartImageData && (
          <View style={styles.chartSection}>
            <Image src={chartImageData} style={styles.chartImage} />
          </View>
        )}

        {/* Table Section - Full Width Row */}
        <View style={styles.tableSection}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Domain</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Score (0-100)</Text></View>
              {hasStats && (
                <>
                  <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Normative Score</Text></View>
                  <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Recommendation</Text></View>
                </>
              )}
            </View>
            {sectionScores.map((s) => {
              const { mean, sd, recommendation } = getSectionStatsAndRecommendation(assessmentName, s.section, s.score);
              const normativeScore = mean && sd ? Math.round((mean - sd) * 100) / 100 : undefined;
              return (
                <View style={styles.tableRow} key={s.section}>
                  <View style={styles.tableCol}><Text style={styles.tableCellBold}>{s.section}</Text></View>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>{s.score}</Text></View>
                  {hasStats && (
                    <>
                      <View style={styles.tableCol}><Text style={styles.tableCell}>{normativeScore}</Text></View>
                      <View style={styles.tableCol}><Text style={styles.tableCell}>{recommendation}</Text></View>
                    </>
                  )}
                </View>
              );
            })}
            {/* Total Row */}
            {(() => {
              const totalScore = Math.round(sectionScores.reduce((sum, s) => sum + s.score, 0) / sectionScores.length);
              const totalNormativeScore = hasStats ? 
                Math.round(sectionScores.reduce((sum, s) => {
                  const { mean, sd } = getSectionStatsAndRecommendation(assessmentName, s.section, s.score);
                  return sum + (mean && sd ? (mean - sd) : 0);
                }, 0) / sectionScores.length * 100) / 100 : undefined;
              
              let totalRecommendation = '';
              if (hasStats && totalNormativeScore) {
                if (totalScore < totalNormativeScore) totalRecommendation = "Low";
                else if (totalScore < totalNormativeScore * 1.2) totalRecommendation = "Average";
                else totalRecommendation = "Excellent";
              }
              
              return (
                <View style={styles.tableRow} key="total">
                  <View style={styles.tableCol}><Text style={styles.tableCellBold}>Total</Text></View>
                  <View style={styles.tableCol}><Text style={styles.tableCellBold}>{totalScore}</Text></View>
                  {hasStats && (
                    <>
                      <View style={styles.tableCol}><Text style={styles.tableCellBold}>{totalNormativeScore}</Text></View>
                      <View style={styles.tableCol}><Text style={styles.tableCellBold}>{totalRecommendation}</Text></View>
                    </>
                  )}
                </View>
              );
            })()}
          </View>
        </View>
      </View>
      {/* Comprehensive Recommendations Section */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          Comprehensive Recommendations
        </Text>
        {(() => {
          // Prepare data for recommendations
          const normalSections = sectionScores.filter(s => {
            const { mean, sd, recommendation } = getSectionStatsAndRecommendation(assessmentName, s.section, s.score);
            return recommendation === 'Excellent' || recommendation === 'Average';
          }).map(s => s.section);
          const careSections = sectionScores.filter(s => {
            const { mean, sd, recommendation } = getSectionStatsAndRecommendation(assessmentName, s.section, s.score);
            return recommendation === 'Low';
          }).map(s => s.section);
          const allNormal = careSections.length === 0;
          const childName = userName || 'Your child';
          // Section names as comma separated
          const normalStr = normalSections.length > 0 ? normalSections.join(', ') : 'none';
          const careStr = careSections.length > 0 ? careSections.join(', ') : 'none';
          return (
            <Text style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.5 }}>
              {childName} wellbeing score is {allNormal ? 'normal' : 'lesser than normal'}. {childName} appears to be doing well in terms of {normalStr}. The areas needing more care are {careStr}. Wellbeing scores help in reflection and is intended to prompt observation and open conversations with your child / children. When you are ready, speak with the class teacher as well. {'\n'}
              Over the next few weeks we will send you some simple personalised tips on the areas needing care. {'\n'}
              At the end of the report, you will find a simple checklist of child wellbeing that will help you. Refer to this checklist once in a while.
            </Text>
          );
        })()}
      </View>
    </Page>
  </Document>
);

const UserLevelReport: React.FC<UserLevelReportProps> = ({ responses, assessmentName, userName, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [chartImageData, setChartImageData] = useState<string>('');
  const sectionScores = useMemo(() => calculateSectionScores(responses), [responses]);
  const hasStats = assessmentName === "KINDL36" || assessmentName === "KINDL717";

  useEffect(() => {
    if (sectionScores.length > 0) {
      captureChartAsImage(sectionScores, assessmentName, hasStats)
        .then(setChartImageData)
        .catch(console.error);
    }
  }, [sectionScores, assessmentName, hasStats]);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      let imageData = chartImageData;
      if (!imageData && sectionScores.length > 0) {
        imageData = await captureChartAsImage(sectionScores, assessmentName, hasStats);
      }

      const doc = (
        <PDFReport
          sectionScores={sectionScores}
          assessmentName={assessmentName}
          hasStats={hasStats}
          chartImageData={imageData}
          userName={userName}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-level-report-${userName}-${assessmentName}-${Date.now()}.pdf`;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-[95%] max-w-6xl h-[90%] flex flex-col">
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b rounded-t-lg">
          <h2 className="text-xl font-bold">User Level Report - {assessmentName}</h2>
          <div className="flex gap-2">
            <Button onClick={handleDownload} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>

        {/* PDF Viewer Only */}
        <div className="flex-1 p-4 overflow-auto">
          <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
          <PDFReport
            sectionScores={sectionScores}
            assessmentName={assessmentName}
            hasStats={hasStats}
            chartImageData={chartImageData}
            userName={userName}
          />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

export default UserLevelReport;