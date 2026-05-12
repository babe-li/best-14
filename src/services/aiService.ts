import { GoogleGenAI, Type } from "@google/genai";

// Initialize AI
// The API key is provided in the environment
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

const MODEL_NAME = "gemini-3-flash-preview";

export interface StudentPerformanceRecord {
  subjectId: string;
  marks: number;
  grade: string;
  term: number;
}

export interface AIPredictionResult {
  predictedGrade: string;
  confidence: number;
  reasoning: string;
  recommendation: string;
}

export interface AIFeedbackResult {
  feedback: string;
  tone: 'encouraging' | 'constructive' | 'congratulatory';
}

export const aiService = {
  /**
   * Generates feedback for a student based on their exam score.
   */
  async generateStudentFeedback(
    studentName: string, 
    subject: string, 
    score: number, 
    totalMarks: number = 100
  ): Promise<AIFeedbackResult> {
    const percentage = (score / totalMarks) * 100;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `You are an expert teacher at Miyomboni Secondary School in Tanzania. 
        Generate a personalized, short, and impactful feedback comment for a student.
        
        Student: ${studentName}
        Subject: ${subject}
        Score: ${score}/${totalMarks} (${percentage.toFixed(1)}%)
        
        The feedback should be in English, but you can use some Swahili encouraging words if appropriate (like 'Hongera', 'Kazi nzuri').
        Keep it under 15 words.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              feedback: { type: Type.STRING },
              tone: { 
                type: Type.STRING,
                enum: ['encouraging', 'constructive', 'congratulatory']
              }
            },
            required: ["feedback", "tone"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return result;
    } catch (error) {
      console.error("AI Feedback Error:", error);
      return {
        feedback: score > (totalMarks * 0.6) ? "Good effort, keep it up!" : "You have potential, let's work harder next time.",
        tone: score > (totalMarks * 0.6) ? 'encouraging' : 'constructive'
      };
    }
  },

  /**
   * Predicts future performance based on past records.
   */
  async predictPerformance(
    studentName: string,
    records: StudentPerformanceRecord[]
  ): Promise<AIPredictionResult> {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze this student's performance and predict their final NECTA grade category (Div I, II, III, IV, 0).
        
        Student: ${studentName}
        Past Records: ${JSON.stringify(records)}
        
        Provide a prediction based on trends and common NECTA patterns.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predictedGrade: { type: Type.STRING, description: "NECTA Division prediction" },
              confidence: { type: Type.NUMBER, description: "Confidence level 0-1" },
              reasoning: { type: Type.STRING, description: "Detailed reasoning" },
              recommendation: { type: Type.STRING, description: "Actionable study advice" }
            },
            required: ["predictedGrade", "confidence", "reasoning", "recommendation"]
          }
        }
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI Prediction Error:", error);
      return {
        predictedGrade: "Unknown",
        confidence: 0,
        reasoning: "Insufficient data for AI analysis.",
        recommendation: "Continue regular assessments."
      };
    }
  },

  /**
   * Generates a summary for administrators about financial trends.
   */
  async getFinancialInsights(
    summaryData: { totalExpected: number; totalCollected: number; overdueCount: number }
  ): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze these school finance stats and provide a executive summary for the Board of Miyomboni Secondary School.
        
        Expected Revenue: ${summaryData.totalExpected} TZS
        Collected: ${summaryData.totalCollected} TZS
        Students with Overdue Fees: ${summaryData.overdueCount}
        
        Keep it professional, concise, and focused on operational sustainability.`,
      });

      return response.text || "Financial health is within normal range.";
    } catch (error) {
      return "Data analysis unavailable.";
    }
  },

  /**
   * Drafts a message to parents regarding a student's attendance concerns.
   */
  async draftAttendanceAlert(
    studentName: string,
    attendanceRate: number,
    daysAbsent: number
  ): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Draft a professional yet concerned SMS message to a parent about their child's attendance.
        
        Student: ${studentName}
        Attendance Rate: ${attendanceRate}%
        Days Absent: ${daysAbsent}
        
        The message should be in English but polite and firm, encouraging the parent to visit the school. Keep it under 160 characters.`,
      });
      return response.text || "";
    } catch (error) {
      return `Dear Parent, ${studentName} has been absent for ${daysAbsent} days recently (Rate: ${attendanceRate}%). Please contact the academic office.`;
    }
  },

  /**
   * Suggests library books or resources for a student based on their weakest subjects.
   */
  async suggestLearningResources(
    subject: string,
    score: number
  ): Promise<string[]> {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Suggest 3 specific book titles or educational resources available in Tanzania that could help a secondary student struggling in ${subject} (scored ${score}%).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["suggestions"]
          }
        }
      });
      const result = JSON.parse(response.text || "{}");
      return result.suggestions || [];
    } catch (error) {
      return ["NECTA Review Manual", "Tanzania Institute of Education (TIE) Textbook", "Practical Guide for " + subject];
    }
  }
};
