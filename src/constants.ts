/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SCHOOL_CONFIG = {
  name: "Miyomboni Secondary",
  fullName: "Miyomboni Secondary School - Iringa",
  schoolName: "Miyomboni Secondary School, Iringa",
  schoolTagline: "Excellence in Education",
  currency: "TZS",
  adminCredentials: {
    email: "myovelababeli@gmail.com",
    password: "cian2003",
    name: "Babeli Myovela"
  },
  gradingScale: [
    { grade: 'A', min: 75, max: 100, remark: 'Excellent' },
    { grade: 'B', min: 65, max: 74, remark: 'Very Good' },
    { grade: 'C', min: 45, max: 64, remark: 'Good' },
    { grade: 'D', min: 30, max: 44, remark: 'Satisfactory' },
    { grade: 'F', min: 0, max: 29, remark: 'Fail' }
  ],
  nectaScales: {
    secondary: [
      { grade: 'A', min: 75, max: 100, points: 1, remark: 'Excellent' },
      { grade: 'B', min: 65, max: 74, points: 2, remark: 'Very Good' },
      { grade: 'C', min: 45, max: 64, points: 3, remark: 'Good' },
      { grade: 'D', min: 30, max: 44, points: 4, remark: 'Satisfactory' },
      { grade: 'F', min: 0, max: 29, points: 5, remark: 'Fail' },
    ]
  },
  divisionPoints: {
    secondary: [
      { division: 'I', min: 7, max: 17 },
      { division: 'II', min: 18, max: 21 },
      { division: 'III', min: 22, max: 25 },
      { division: 'IV', min: 26, max: 33 },
      { division: '0', min: 34, max: 35 },
    ]
  },
  academicLevels: [
    'Form 1', 'Form 2', 'Form 3', 'Form 4'
  ] as const,
  defaultSubjects: [
    'Mathematics', 'English', 'Kiswahili', 'Social Studies', 
    'Science and Technology', 'Civics', 'Vocational Skills',
    'History', 'Geography', 'Physics', 'Chemistry', 'Biology'
  ]
};
