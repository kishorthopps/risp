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
      text: "During the past week my child felt scared or unsure of him/her self",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "Emotional wellbeing"
    },

    // C. Self–esteem
    {
      id: 9,
      text: "During the past week my child was proud of him/her self",
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
      text: "During the past week my child got along well with his/her friends",
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
      text: "During the past week my child coped well with the assignments set in nursery school/ kindergarten",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "School"
    },
    {
      id: 22,
      text: "During the past week my child enjoyed the nursery school/ kindergarten",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: false,
      section: "School"
    },
    {
      id: 23,
      text: "During the past week my child looked forward to nursery school/kindergarten",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "School"
    },
    {
      id: 24,
      text: "During the past week my child made lots of mistakes when doing minor assignments or homework",
      type: "multiple-choice",
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "R",
      optional: false,
      section: "School"
    },

    // G. Optional Questions
    ...[
      "During the past week my child was moody and whined a lot",
      "During the past week my child had a healthy appetite",
      "During the past week I managed to show patience and understanding towards my child",
      "During the past week my child felt under pressure",
      "During the past week my child slept soundly",
      "During the past week my child romped around and was very active",
      "During the past week my child kept bursting into tears",
      "During the past week my child was cheerful and in a good mood",
      "During the past week my child was alert and able to concentrate well",
      "During the past week my child was easily distracted and absent-minded",
      "During the past week my child enjoyed being with other children",
      "During the past week I had to give my child a telling-off",
      "During the past week I praised my child",
      "During the past week my child had problems with teachers, kindergarten staff or other child-minders",
      "During the past week my child was nervous and fidgety",
      "During the past week my child was lively and energetic",
      "During the past week my child complained of being in pain",
      "During the past week my child was sociable and outgoing",
      "During the past week my child succeeded at everything he set out to do",
      "During the past week my child became dissatisfied easily",
      "During the past week my child cried bitterly",
      "During the past week my child lost his temper quickly"
    ].map((text, index) => ({
      id: 25 + index,
      text,
      type: "multiple-choice" as const,
      options: ["All the time", "Often", "Sometimes", "Seldom", "Never"],
      scoreType: "S",
      optional: true,
      section: "Optional"
    }))
  ];
  
  
export const slug = "KINDL36";
export const assessmentId = "cf92d387-b45c-4f15-81be-73facac0fd18";