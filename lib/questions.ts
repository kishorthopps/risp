export type QuestionType = 'multiple-choice' | 'number' | 'short-answer' | 'radio' | 'paragraph';

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
}

export const questions: Question[] = [
  {
    id: 1,
    text: "In general, how would your child rate her/his health?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 2,
    text: "Has your child felt fit and well?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 3,
    text: "Has your child been physically active (e.g. running, climbing, biking)?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 4,
    text: "Has your child been able to run well?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 5,
    text: "Has your child felt full of energy?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 6,
    text: "Has your child felt that life was enjoyable?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 7,
    text: "Has your child felt pleased that he/she is alive?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 8,
    text: "Has your child felt satisfied with his/her life?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 9,
    text: "Has your child been in a good mood?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 10,
    text: "Has your child felt cheerful?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 11,
    text: "Has your child had fun?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 12,
    text: "General mood",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 13,
    text: "Has your child felt that he/she does everything badly?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 14,
    text: "Has your child felt sad?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 15,
    text: "Has your child felt so bad that he/she didn't want to do anything?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 16,
    text: "Has your child felt that everything in his/her life goes wrong?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 17,
    text: "Has your child felt fed up?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 18,
    text: "Has your child felt lonely?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 19,
    text: "Has your child felt under pressure?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  {
    id: 20,
    text: "Has your child been happy with the way he/she is?",
    type: "multiple-choice",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  },
  // Continue with questions 21-53
  ...[...Array(33)].map((_, index) => ({
    id: index + 21,
    text: [
      "Has your child been happy with his/her clothes?",
      "Has your child been worried about the way he/she looks?",
      "Has your child felt jealous of the way other girls and boys look?",
      "Has your child wanted to change something about his/her body?",
      "Has your child had enough time for him/herself?",
      "Has your child been able to do the things that he/she wants to do in his/her free time?",
      "Has your child had enough opportunity to be outside?",
      "Has your child had enough time to meet friends?",
      "Has your child been able to choose what to do in his/her free time?",
      "Has your child felt understood by his/her parent(s)?",
      "Has your child felt loved by his/her parent(s)?",
      "Has your child been happy at home?",
      "Has your child felt that his/her parent(s) had enough time for him/her?",
      "Has your child felt that his/her parent(s) treated him/her fairly?",
      "Has your child been able to talk to his/her parent(s) when he/she wanted to?",
      "Has your child had enough money to do the same things as his/her friends?",
      "Has your child felt that he/she had enough money for his/her expenses?",
      "Does your child feel that he/she has enough money to do things with his/her friends?",
      "Has your child spent time with his/her friends?",
      "Has your child done things with other girls and boys?",
      "Has your child had fun with his/her friends?",
      "Have your child and his/her friends helped each other?",
      "Has your child been able to talk about everything with his/her friends?",
      "Has your child been able to rely on his/her friends?",
      "Has your child been happy at school?",
      "Has your child got on well at school?",
      "Has your child been satisfied with his/her teachers?",
      "Has your child been able to pay attention?",
      "Has your child enjoyed going to school?",
      "Has your child got along well with his/her teachers?",
      "Has your child been afraid of other girls and boys?",
      "Have other girls and boys made fun of your child?",
      "Have other girls and boys bullied your child?"
    ][index],
    type: "multiple-choice" as const,
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"]
  })),
  {
    id: 54,
    text: "How many days in the past week did your child spend time on a smartphone?",
    type: "number"
  },
  {
    id: 55,
    text: "How long does your child spend on a smartphone?",
    type: "short-answer"
  },
  {
    id: 56,
    text: "Did your child use the smartphone with supervision?",
    type: "radio",
    options: ["Yes", "No"]
  },
  {
    id: 57,
    text: "Did you check the smartphone for what they watched?",
    type: "radio",
    options: ["Yes", "No"]
  }
];

export const slug = "Mental Health";
export const assessmentId = "4ddda850-ba1f-467d-b17a-04138dc458d6";