/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SCHOOL_CONFIG } from '../constants';
import { type AcademicLevel, type Result } from '../types';

export const getGradeScale = (level: AcademicLevel) => {
  if (level.startsWith('Standard')) {
    return SCHOOL_CONFIG.nectaScales.primary;
  }
  return SCHOOL_CONFIG.nectaScales.secondary;
};

export const calculateGrade = (marks: number, level: AcademicLevel) => {
  const scale = getGradeScale(level);
  for (const item of scale) {
    if (marks >= item.min && marks <= item.max) {
      return item.grade;
    }
  }
  return level.startsWith('Standard') ? 'E' : 'F';
};

export const calculatePoints = (marks: number, level: AcademicLevel) => {
  const scale = getGradeScale(level);
  for (const item of scale) {
    if (marks >= item.min && marks <= item.max) {
      return item.points;
    }
  }
  return 5;
};

export interface NECTAResult {
  division: string;
  points: number;
  gpa: number;
  grades: Record<string, string>;
  credits: number; // Number of Cs or better
}

export const calculateDivision = (results: Result[], level: AcademicLevel): NECTAResult | 'N/A' => {
  if (!level.startsWith('Form')) return 'N/A';

  // Map to points and grades
  const subjectPoints = results.map(r => ({
    marks: r.marks,
    points: calculatePoints(r.marks, level),
    grade: calculateGrade(r.marks, level)
  })).sort((a, b) => a.points - b.points);

  // NECTA O-Level uses best 7 subjects for points
  // Must have at least 7 subjects for a valid division I-III usually
  const top7 = subjectPoints.slice(0, 7);
  const totalPoints = top7.reduce((acc, curr) => acc + curr.points, 0);
  
  // Credits are A, B, or C
  const credits = subjectPoints.filter(s => ['A', 'B', 'C'].includes(s.grade)).length;
  // Passes are D
  const passes = subjectPoints.filter(s => s.grade === 'D').length;
  
  const gradeCount = top7.length;
  const gpa = gradeCount > 0 ? totalPoints / gradeCount : 5;

  const divPoints = SCHOOL_CONFIG.divisionPoints.secondary;
  let division = '0';
  
  // Official NECTA O-Level Division Criteria
  // Div I-III: Typically requires at least 3 Credits (A, B, or C)
  const divI = divPoints.find(dp => dp.division === 'I');
  const divII = divPoints.find(dp => dp.division === 'II');
  const divIII = divPoints.find(dp => dp.division === 'III');
  const divIV = divPoints.find(dp => dp.division === 'IV');
  const divFail = divPoints.find(dp => dp.division === '0');

  if (divI && totalPoints >= divI.min && totalPoints <= divI.max && credits >= 3) {
    division = 'I';
  } else if (divII && totalPoints >= divII.min && totalPoints <= divII.max && credits >= 3) {
    division = 'II';
  } else if (divIII && totalPoints >= divIII.min && totalPoints <= divIII.max && credits >= 3) {
    division = 'III';
  } else if (divIV && totalPoints >= divIV.min && totalPoints <= divIV.max) {
    // Div IV requirement: At least 1 Credit or 2 Passes
    if (credits >= 1 || passes >= 2) {
      division = 'IV';
    } else {
      division = '0';
    }
  } else if (divFail && totalPoints >= divFail.min && totalPoints <= divFail.max) {
    division = '0';
  } else {
    division = '0';
  }

  // Handle case with fewer than 7 subjects - strict NECTA usually requires 7
  if (gradeCount < 7) {
    // In many schools, if they have fewer than 7 they can't get high divisions
    // But for partial reports we might still show a division if they meet points with fewer
    // However, to be strict:
    if (gradeCount < 1) return 'N/A';
  }

  const grades: Record<string, string> = {};
  return { division, points: totalPoints, gpa, credits, grades };
};
