"use client";

import React, { useMemo } from 'react';
import { useSchoolAssignmentReport } from '@/hooks/useAssessments';
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf, Image } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { AssessmentAssignment } from '@/lib/types';

// Helper to extract the final score details from an assignment
const getFinalScoreDetails = (assignment: AssessmentAssignment) => {
  if (assignment.status !== 'COMPLETED' || !Array.isArray(assignment.responses)) {
    return null;
  }
  const finalScoreEntry = (assignment.responses as any[]).find((r: any) => r.question === "Final Score");
  if (!finalScoreEntry || !Array.isArray(finalScoreEntry.response) || finalScoreEntry.response.length === 0) {
    return null;
  }
  return finalScoreEntry.response;
};

// Helper to determine the most frequent recommendation from a list
const getOverallRecommendation = (recommendations: string[]) => {
    if (recommendations.length === 0) return 'N/A';
    if (recommendations.includes('Low')) return 'Low';
    if (recommendations.includes('Average')) return 'Average';
    if (recommendations.every(r => r === 'Excellent')) return 'Excellent';
    return 'Average';
};


// PDF styles
const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#fff', fontFamily: 'Helvetica' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center', color: '#1a237e' },
  subtitle: { fontSize: 14, marginBottom: 20, textAlign: 'center', color: '#546e7a' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 12, borderBottomWidth: 2, borderBottomColor: '#1a237e', paddingBottom: 6, color: '#1a237e' },
  
  // Executive Summary Styles
  summaryContainer: { backgroundColor: '#f1f3f5', borderRadius: 8, padding: 16, marginTop: 20 },
  summaryText: { fontSize: 11, marginBottom: 6, lineHeight: 1.5, color: '#495057' },
  summaryPoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  summaryBullet: { fontSize: 12, marginRight: 8, color: '#1a237e' },

  // Table Styles
  table: { width: '100%', marginTop: 12, borderStyle: 'solid', borderWidth: 1, borderColor: '#dee2e6' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#dee2e6', minHeight: 25, backgroundColor: '#fff' },
  tableHeader: { backgroundColor: '#e9ecef' },
  tableCol: { flex: 2, padding: 8, fontSize: 10, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#dee2e6' },
  tableColWide: { flex: 3 },
  tableCell: { textAlign: 'center' },
  tableCellBold: { fontWeight: 'bold', textAlign: 'center', fontSize: 11 },
  
  // Footer Styles
  footer: { position: 'absolute', bottom: 25, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: 'grey' },
});

const PDFReport = ({ reportData, projectName }: any) => {
  const { overview, groups, insights } = reportData;

  return (
    <Document>
      {/* Page 1: Cover Page */}
      <Page size="A4" style={{ ...styles.page, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1a237e' }}>
            School Level Assessment Report
          </Text>
          <Text style={{ fontSize: 22, marginTop: 12, color: '#3949ab' }}>
            {projectName}
          </Text>
          <Text style={{ fontSize: 14, marginTop: 32, color: '#546e7a' }}>
            Generated on: {new Date().toLocaleDateString()}
          </Text>
        </View>
        <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
          <Image src='/NH_logo.png' style={{ width: 180, height: 'auto' }} />
        </View>
      </Page>

      {/* Page 2: Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryPoint}>
            <Text style={styles.summaryBullet}>•</Text>
            <Text style={styles.summaryText}>
              {overview.numberOfGroups} classes and {overview.totalStudents} students are involved in the Nalla Health program.
            </Text>
          </View>
          <View style={styles.summaryPoint}>
            <Text style={styles.summaryBullet}>•</Text>
            <Text style={styles.summaryText}>
              {overview.completedStudents} students have completed wellbeing assessments.
            </Text>
          </View>
          <View style={styles.summaryPoint}>
            <Text style={styles.summaryBullet}>•</Text>
            <Text style={styles.summaryText}>
              The quality of life for {overview.studentsWithinExpectationsPercentage}% of children is within or above normal expectations based on their assessment scores.
            </Text>
          </View>
           {/* These are example static points as requested */}
          {/* <View style={styles.summaryPoint}>
            <Text style={styles.summaryBullet}>•</Text>
            <Text style={styles.summaryText}>
              76% of parents have downloaded their child’s assessment reports.
            </Text>
          </View> */}
        </View>

        <Text style={styles.sectionTitle}>Key Insights & Recommendations</Text>
         <View style={styles.summaryContainer}>
            {insights.lowSections.length > 0 && (
                <View style={styles.summaryPoint}>
                    <Text style={styles.summaryBullet}>•</Text>
                    <Text style={styles.summaryText}>
                        The main areas of concern across the school are **{insights.lowSections.join(', ')}**.
                    </Text>
                </View>
            )}
            {insights.highSections.length > 0 && (
                <View style={styles.summaryPoint}>
                    <Text style={styles.summaryBullet}>•</Text>
                    <Text style={styles.summaryText}>
                        Key strengths were observed in **{insights.highSections.join(', ')}**.
                    </Text>
                </View>
            )}
          <View style={styles.summaryPoint}>
            <Text style={styles.summaryBullet}>•</Text>
            <Text style={styles.summaryText}>
              We recommend focussing on activities to improve confidence and social relationships, targeting the identified areas of concern.
            </Text>
          </View>
         </View>
         <Text style={styles.footer}>Page 2</Text>
      </Page>
      
      {/* Page 3: Data Tables */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Wellbeing Assessment Overview</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableCol}><Text style={styles.tableCellBold}>Number of Students</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCellBold}>Completion Rate (%)</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCellBold}>Average Score</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{overview.totalStudents}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{overview.completionRate}%</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{overview.averageScore}</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Group-wise Summary</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCol, styles.tableColWide]}><Text style={styles.tableCellBold}>Group Name</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCellBold}>Average Score</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCellBold}>Normalized Score</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCellBold}>Recommendation</Text></View>
          </View>
          {groups.map((group: any) => (
            <View key={group.groupId} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.tableColWide]}><Text style={styles.tableCell}>{group.groupName}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{group.averageScore ?? 'N/A'}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{group.averageNormativeScore ?? 'N/A'}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{group.recommendation}</Text></View>
            </View>
          ))}
        </View>
        <Text style={styles.footer}>Page 3</Text>
      </Page>

      {/* Subsequent Pages: Detailed Group Breakdown */}
      {groups.filter((g: any) => g.sections.length > 0).map((group: any, index: number) => (
        <Page key={group.groupId} size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Detailed Breakdown: {group.groupName}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCol, styles.tableColWide]}><Text style={styles.tableCellBold}>Section</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCellBold}>Average Score</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCellBold}>Normative Score</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCellBold}>Recommendation</Text></View>
            </View>
            {group.sections.map((section: any) => (
              <View key={section.section} style={styles.tableRow}>
                <View style={[styles.tableCol, styles.tableColWide]}><Text style={styles.tableCell}>{section.section}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{section.averageScore}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{section.averageNormativeScore}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{section.recommendation}</Text></View>
              </View>
            ))}
          </View>
          <Text style={styles.footer}>Page {4 + index}</Text>
        </Page>
      ))}

      {/* Final Page: Recommended Actions */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Recommended Actions</Text>
        <View style={styles.summaryContainer}>
            {insights.highSections.length > 0 && (
                <View style={styles.summaryPoint}>
                    <Text style={styles.summaryBullet}>•</Text>
                    <Text style={styles.summaryText}>
                        Celebrate Strengths: Acknowledge groups and sections that are performing well, especially in areas like **{insights.highSections.join(', ')}**. Share successful practices across classes.
                    </Text>
                </View>
            )}
            {insights.lowSections.length > 0 && (
                <View style={styles.summaryPoint}>
                    <Text style={styles.summaryBullet}>•</Text>
                    <Text style={styles.summaryText}>
                        Targeted Intervention: For groups with lower overall scores, particularly in **{insights.lowSections.join(', ')}**, consider implementing classroom-based social-emotional learning (SEL) activities.
                    </Text>
                </View>
            )}
          <View style={styles.summaryPoint}>
            <Text style={styles.summaryBullet}>•</Text>
            <Text style={styles.summaryText}>
               Parental Engagement: Host a workshop for parents to discuss the importance of wellbeing and provide strategies to support their children's confidence and social skills at home.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};


interface SchoolLevelReportProps {
  orgId: string;
  projectId: string;
  projectName?: string;
  onClose: () => void;
}

const SchoolLevelReport: React.FC<SchoolLevelReportProps> = ({ orgId, projectId, projectName, onClose }) => {
  const { data: reportData, isLoading } = useSchoolAssignmentReport(orgId, projectId);
  const assignments = reportData?.assignments || [];

  const reportDataProcessed = useMemo(() => {
    if (!assignments || assignments.length === 0) {
      return { 
        overview: { totalStudents: 0, completedStudents: 0, completionRate: 0, averageScore: 0, numberOfGroups: 0, studentsWithinExpectationsPercentage: 0 }, 
        groups: [],
        insights: { lowSections: [], highSections: [] }
      };
    }

    const completedAssignments = assignments.filter((a: any) => getFinalScoreDetails(a) !== null);
    
    // Overview calculations
    const uniqueUserIds = new Set(assignments.map((a: any) => a.userId));
    const uniqueCompletedUserIds = new Set(completedAssignments.map((a: any) => a.userId));
    const totalStudents = uniqueUserIds.size;
    const completedStudents = uniqueCompletedUserIds.size;
    const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;
    const numberOfGroups = new Set(assignments.map((a: any) => a.groupId).filter(Boolean)).size;

    let studentsWithinExpectations = 0;
    uniqueCompletedUserIds.forEach(userId => {
        const userAssignments = completedAssignments.filter(a => a.userId === userId);
        // FIX: Add 'any' type to bypass TypeScript error for 'submittedAt'
        const latestAssignment = userAssignments.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
        const sections = getFinalScoreDetails(latestAssignment);
        if (sections) {
            const avgScore = sections.reduce((sum: number, s: any) => sum + s.score, 0) / sections.length;
            const avgNormative = sections.reduce((sum: number, s: any) => sum + s.normativeScore, 0) / sections.length;
            if (avgScore >= avgNormative) {
                studentsWithinExpectations++;
            }
        }
    });
    const studentsWithinExpectationsPercentage = completedStudents > 0 ? Math.round((studentsWithinExpectations / completedStudents) * 100) : 0;


    const allScores = completedAssignments.flatMap((a: any) => {
      const sections = getFinalScoreDetails(a);
      if (!sections) return [];
      const avg = sections.reduce((sum: number, s: any) => sum + s.score, 0) / sections.length;
      return [avg];
    });
    const averageScore = allScores.length > 0 ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length) : 0;

    // Grouping data
    const groupedData: { [key: string]: any[] } = {};
    assignments.forEach((a: any) => {
      const groupId = a.groupId || 'Ungrouped';
      if (!groupedData[groupId]) groupedData[groupId] = [];
      groupedData[groupId].push(a);
    });

    // Group-specific calculations
    const allSectionRecommendations: { [key: string]: string[] } = {};
    const groupStats = Object.keys(groupedData).map(groupId => {
      const groupAssignments = groupedData[groupId];
      const completedInGroup = groupAssignments.filter((a: any) => getFinalScoreDetails(a) !== null);
      const groupName = groupAssignments[0]?.groupName || 'Ungrouped';

      if (completedInGroup.length === 0) {
        return { groupId, groupName, averageScore: null, averageNormativeScore: null, recommendation: 'N/A', sections: [] };
      }

      const groupScores = completedInGroup.map((a: any) => getFinalScoreDetails(a)!.reduce((sum: number, s: any) => sum + s.score, 0) / getFinalScoreDetails(a)!.length);
      const groupNormativeScores = completedInGroup.map((a: any) => getFinalScoreDetails(a)!.reduce((sum: number, s: any) => sum + s.normativeScore, 0) / getFinalScoreDetails(a)!.length);
      
      const averageScore = Math.round(groupScores.reduce((s, v) => s + v, 0) / groupScores.length);
      const averageNormativeScore = Math.round(groupNormativeScores.reduce((s, v) => s + v, 0) / groupNormativeScores.length);
      
      const sectionAggregates: { [key: string]: { scores: number[], normativeScores: number[], recommendations: string[] } } = {};
      completedInGroup.forEach((a: any) => {
        getFinalScoreDetails(a)!.forEach((s: any) => {
          if (!sectionAggregates[s.section]) sectionAggregates[s.section] = { scores: [], normativeScores: [], recommendations: [] };
          sectionAggregates[s.section].scores.push(s.score);
          sectionAggregates[s.section].normativeScores.push(s.normativeScore);
          sectionAggregates[s.section].recommendations.push(s.recommendation);
        });
      });
      
      const sections = Object.entries(sectionAggregates).map(([section, data]) => {
        const sectionRec = getOverallRecommendation(data.recommendations);
        if (!allSectionRecommendations[section]) allSectionRecommendations[section] = [];
        allSectionRecommendations[section].push(sectionRec);
        
        return {
          section,
          averageScore: Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length),
          averageNormativeScore: Math.round(data.normativeScores.reduce((s, v) => s + v, 0) / data.normativeScores.length),
          recommendation: sectionRec,
        };
      }).sort((a, b) => a.section.localeCompare(b.section));

      const groupRecommendation = getOverallRecommendation(sections.map(s => s.recommendation));

      return { groupId, groupName, averageScore, averageNormativeScore, recommendation: groupRecommendation, sections };
    }).sort((a, b) => a.groupName.localeCompare(b.groupName));

    // Insights calculation
    const sectionCounts = Object.entries(allSectionRecommendations).map(([section, recs]) => ({
        section,
        lows: recs.filter(r => r === 'Low').length,
        highs: recs.filter(r => r === 'Excellent').length,
    }));
    const lowSections = sectionCounts.sort((a, b) => b.lows - a.lows).filter(s => s.lows > 0).map(s => s.section);
    const highSections = sectionCounts.sort((a, b) => b.highs - a.highs).filter(s => s.highs > 0).map(s => s.section);


    return { 
        overview: { totalStudents, completedStudents, completionRate, averageScore, numberOfGroups, studentsWithinExpectationsPercentage }, 
        groups: groupStats,
        insights: { lowSections, highSections }
    };
  }, [assignments]);


  const handleDownload = async () => {
    try {
      const doc = <PDFReport reportData={reportDataProcessed} projectName={projectName} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `school-report-${projectName}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate PDF", e);
    }
  };

  if (isLoading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">Loading report data...</div>
      </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-[95%] max-w-6xl h-[90%] flex flex-col">
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b rounded-t-lg">
          <h2 className="text-xl font-bold">School Level Report</h2>
          <div className="flex gap-2">
            <Button onClick={handleDownload}>Download PDF</Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <PDFReport reportData={reportDataProcessed} projectName={projectName} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

export default SchoolLevelReport;