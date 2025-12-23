export type QuestionType = 'multiple-choice' | 'number' | 'short-answer' | 'radio' | 'paragraph';

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
  scoreType?: string;
  optional?: boolean;
  section: string;
}

export const wellbeingQuestions: Question[] = [
    // A. Physical wellbeing
    {
      id: 1,
      text: "During the past week my child felt ill",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "Physical wellbeing"
    },
    {
      id: 2,
      text: "During the past week my child had a headache or tummy-ache",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "Physical wellbeing"
    },
    {
      id: 3,
      text: "During the past week my child was tired and worn-out",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "Physical wellbeing"
    },
    {
      id: 4,
      text: "During the past week my child felt strong and full of energy",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Physical wellbeing"
    },

    // B. Emotional wellbeing
    {
      id: 5,
      text: "During the past week my child had fun and laughed a lot",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Emotional wellbeing"
    },
    {
      id: 6,
      text: "During the past week my child didn't feel much like doing anything",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "Emotional wellbeing"
    },
    {
      id: 7,
      text: "During the past week my child felt alone",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "Emotional wellbeing"
    },
    {
      id: 8,
      text: "During the past week my child felt scared or unsure of him-/ herself",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "Emotional wellbeing"
    },

    // C. Self-esteem
    {
      id: 9,
      text: "During the past week my child was proud of him-/herself",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Self-esteem"
    },
    {
      id: 10,
      text: "During the past week my child felt on top of the world",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Self-esteem"
    },
    {
      id: 11,
      text: "During the past week my child felt pleased with him-/ herself",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Self-esteem"
    },
    {
      id: 12,
      text: "During the past week my child had lots of good ideas",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Self-esteem"
    },

    // D. Family
    {
      id: 13,
      text: "During the past week my child got on well with us as parents",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Family"
    },
    {
      id: 14,
      text: "During the past week my child felt fine at home",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Family"
    },
    {
      id: 15,
      text: "During the past week we quarrelled at home",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "Family"
    },
    {
      id: 16,
      text: "During the past week my child felt that I was bossing him/ her around",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "Family"
    },

    // E. Social contacts
    {
      id: 17,
      text: "During the past week my child did things together with friends",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Social contacts"
    },
    {
      id: 18,
      text: "During the past week my child was liked by other kids",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Social contacts"
    },
    {
      id: 19,
      text: "During the past week my child got along well with his/ her friends",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "Social contacts"
    },
    {
      id: 20,
      text: "During the past week my child felt different from other children",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "Social contacts"
    },

    // F. School
    {
      id: 21,
      text: "During the past week my child coped well with the assignments set in school",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "School"
    },
    {
      id: 22,
      text: "During the past week my child enjoyed the school lessons",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "School"
    },
    {
      id: 23,
      text: "During the past week my child worried about his/her future",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "School"
    },
    {
      id: 24,
      text: "During the past week my child was afraid of bad marks or grades",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "School"
    }
  ];



 
export const slug = "KINDL717";
export const assessmentId = "deb40071-7ce1-4cce-99da-9a75e5b41190";