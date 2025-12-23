"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import FormHeader from "@/components/form/FormHeader";
import IntroPage from "@/components/form/IntroPage";
import FormFooter from "@/components/form/FormFooter";
import MultipleChoice from "@/components/form/QuestionTypes/MultipleChoice";
import NumberInput from "@/components/form/QuestionTypes/NumberInput";
import ShortAnswer from "@/components/form/QuestionTypes/ShortAnswer";
import RadioQuestion from "@/components/form/QuestionTypes/RadioQuestion";
import { motion, AnimatePresence } from "@/components/ui/motion";
import { mcApiService } from "@/lib/mcApiService";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { calculateSectionScores, getSectionStatsAndRecommendation } from "@/components/report/reportUtils";

interface AssessmentState {
  currentQuestion: number;
  answers: Record<number, string>;
  optionalQuestionsMode: null | 'ask' | 'skip';
  showIntro: boolean;
  timestamp: number;
}

interface ResponseItem {
  question: string;
  response: string | object;
  score: number;
  section: string | null;
}

export default function FormPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showOptionalPrompt, setShowOptionalPrompt] = useState(false);
  const [optionalQuestionsMode, setOptionalQuestionsMode] = useState<null | 'ask' | 'skip'>(null);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedState, setSavedState] = useState<AssessmentState | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams?.get("userId") || "";
  const assignmentId = searchParams?.get("id") || "";
  const organisationId = searchParams?.get("organisationId") || "";
  const slug = searchParams?.get("slug") || "";

  // Generate unique key for this assessment
  const getStorageKey = () => `assessment_${userId}_${assignmentId}_${slug}`;

  // Save state to localStorage
  const saveToLocalStorage = (state: Partial<AssessmentState>) => {
    try {
      const currentState: AssessmentState = {
        currentQuestion,
        answers,
        optionalQuestionsMode,
        showIntro,
        timestamp: Date.now(),
        ...state
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(currentState));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // Load state from localStorage
  const loadFromLocalStorage = (): AssessmentState | null => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (saved) {
        const state = JSON.parse(saved) as AssessmentState;
        // Check if the saved state is not too old (e.g., 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (state.timestamp > sevenDaysAgo) {
          return state;
        } else {
          // Remove old state
          localStorage.removeItem(getStorageKey());
        }
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
    return null;
  };

  // Clear localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  };

  // Resume from saved state
  const resumeFromSavedState = () => {
    if (savedState) {
      setCurrentQuestion(savedState.currentQuestion);
      setAnswers(savedState.answers);
      setOptionalQuestionsMode(savedState.optionalQuestionsMode);
      setShowIntro(savedState.showIntro);
      setShowResumeDialog(false);
      setSavedState(null);
    }
  };

  // Start fresh assessment
  const startFreshAssessment = () => {
    clearLocalStorage();
    setShowResumeDialog(false);
    setSavedState(null);
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { wellbeingQuestions } = await import(`@/lib/[slug]/${slug}`);
        setQuestions(wellbeingQuestions);
        
        // Check for saved state after questions are loaded
        const saved = loadFromLocalStorage();
        if (saved && saved.currentQuestion > 0) {
          setSavedState(saved);
          setShowResumeDialog(true);
        }
      } catch (error) {
        console.error("Error loading questions:", error);
      }
    };

    if (slug) {
      fetchQuestions();
    }
  }, [slug]);

  useEffect(() => {
    setProgress((currentQuestion / (questions.length - 1)) * 100);
  }, [currentQuestion, questions]);

  // Save state whenever important data changes
  useEffect(() => {
    if (questions.length > 0 && !showIntro) {
      saveToLocalStorage({
        currentQuestion,
        answers,
        optionalQuestionsMode,
        showIntro
      });
    }
  }, [currentQuestion, answers, optionalQuestionsMode, showIntro, questions.length]);

  // Auto-save answers with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (questions.length > 0 && Object.keys(answers).length > 0) {
        saveToLocalStorage({ answers });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [answers, questions.length]);

  const handleNext = () => {
    const currentQuestionData = questions[currentQuestion];
    const currentAnswer = answers[currentQuestionData.id];

    // Check if current question is mandatory and not answered
    if (!currentQuestionData.optional && (!currentAnswer || currentAnswer.trim() === "")) {
      return;
    }

    const nextQuestion = questions[currentQuestion + 1];
    if (nextQuestion?.optional && optionalQuestionsMode === null && !showOptionalPrompt) {
      setShowOptionalPrompt(true);
      return;
    }

    // If user chose to skip all optional questions, skip to the next non-optional or end
    if (nextQuestion?.optional && optionalQuestionsMode === 'skip') {
      let nextIdx = currentQuestion + 1;
      while (nextIdx < questions.length && questions[nextIdx]?.optional) {
        nextIdx++;
      }
      if (nextIdx < questions.length) {
        setDirection(1);
        setCurrentQuestion(nextIdx);
        window.scrollTo(0, 0);
      } else {
        setShowSubmitConfirmation(true);
      }
      return;
    }

    setDirection(1);
    setCurrentQuestion(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setDirection(-1);
      setCurrentQuestion(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSkipOptional = () => {
    setShowOptionalPrompt(false);
    setOptionalQuestionsMode('skip');
    let nextIdx = currentQuestion + 1;
    while (nextIdx < questions.length && questions[nextIdx]?.optional) {
      nextIdx++;
    }
    if (nextIdx < questions.length) {
      setDirection(1);
      setCurrentQuestion(nextIdx);
      window.scrollTo(0, 0);
    } else {
      setShowSubmitConfirmation(true);
    }
  };

  const handleSubmit = async () => {
    const submittedAt = new Date().toISOString();
    let finalScore = 0;

    const responses: ResponseItem[] = Object.entries(answers).map(([questionId, answer]) => {
      const question = questions.find(q => q.id === parseInt(questionId));
      const optionIndex = question?.options?.indexOf(answer) ?? -1;
      let score = 0;

      if (optionIndex >= 0) {
        score = question?.scoreType === "S" 
          ? optionIndex + 1 
          : 5 - optionIndex;
        finalScore += score;
      }

      return {
        question: question?.text || "Unknown question",
        response: answer,
        score,
        section: question.section
      };
    });

    // Compute section scores using reportUtils
    const sectionScores = calculateSectionScores(responses);

    // Enrich with normative & recommendation
    const sectionReports = sectionScores.map((s) => {
      const { mean, sd, recommendation } = getSectionStatsAndRecommendation(slug, s.section, s.score);
      const normativeScore = mean && sd ? Math.round((mean - sd) * 100) / 100 : undefined;
      return {
        section: s.section,
        score: s.score,
        normativeScore,
        recommendation,
      };
    });

    // Push Final Score row (total score + section breakdown)
    responses.push({
      question: "Final Score",
      response: sectionReports,
      score: finalScore,
      section: null
    });

    try {
      await mcApiService.patch(
        `/organisations/${organisationId}/assessment-assignments/${assignmentId}/response`,
        {
          userId,
          submittedBy: userId,
          submittedAt,
          status: "COMPLETED",
          responses,
          report: {}
        }
      );

      // Clear localStorage after successful submission
      clearLocalStorage();
      
      router.push(`./thank-you?finalScore=${finalScore}`);
    } catch (error) {
      console.error("Error submitting responses:", error);
      // Don't clear localStorage if submission failed
    }
  };

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }));
  };

  const handleStartAssessment = () => {
    setShowIntro(false);
  };

  const renderQuestion = () => {
    const question = questions[currentQuestion];
    const value = answers[question.id];

    const variants = {
      enter: (direction: number) => ({
        y: direction > 0 ? 100 : -100,
        opacity: 0
      }),
      center: {
        y: 0,
        opacity: 1
      },
      exit: (direction: number) => ({
        y: direction < 0 ? 100 : -100,
        opacity: 0
      })
    };

    return (
      <motion.div
        key={currentQuestion}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          y: { type: "spring", stiffness: 500, damping: 30 },
          opacity: { duration: 0.15 }
        }}
      >
        {(() => {
          switch (question.type) {
            case "multiple-choice":
              return (
                <MultipleChoice
                  question={question.text}
                  options={question.options || []}
                  onChange={handleAnswer}
                  value={value}
                />
              );
            case "number":
              return (
                <NumberInput
                  question={question.text}
                  onChange={handleAnswer}
                  value={value}
                />
              );
            case "short-answer":
              return (
                <ShortAnswer
                  question={question.text}
                  onChange={handleAnswer}
                  value={value}
                />
              );
            case "radio":
              return (
                <RadioQuestion
                  question={question.text}
                  options={question.options || []}
                  onChange={handleAnswer}
                  value={value}
                />
              );
            default:
              return null;
          }
        })()}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <FormHeader
        currentQuestion={showIntro ? undefined : currentQuestion}
        totalQuestions={showIntro ? undefined : questions.length}
        showProgress={!showIntro}
      />

      <main className="flex-1 flex flex-col">
        <div className="container max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col">
          {showIntro ? (
            <div className="flex-1 flex items-center justify-center">
              <IntroPage onStart={handleStartAssessment} />
            </div>
          ) : (
            <>
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence initial={false} mode="wait" custom={direction}>
                  {questions.length > 0 && renderQuestion()}
                </AnimatePresence>
              </div>

              <div className="mt-8 flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentQuestion < questions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={
                      !questions[currentQuestion]?.optional &&
                      (!answers[questions[currentQuestion]?.id] || answers[questions[currentQuestion]?.id].trim() === "")
                    }
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowSubmitConfirmation(true)}
                    disabled={
                      !questions[currentQuestion]?.optional &&
                      (!answers[questions[currentQuestion]?.id] || answers[questions[currentQuestion]?.id].trim() === "")
                    }
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                  >
                    Submit
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <FormFooter />

      {/* Resume Assessment Dialog */}
      {showResumeDialog && (
        <Dialog open={showResumeDialog} onOpenChange={() => { }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resume Assessment</DialogTitle>
              <DialogDescription>
                We found a previous session of this assessment. Would you like to continue where you left off or start fresh?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={resumeFromSavedState}>
                Resume
              </Button>
              <Button variant="outline" onClick={startFreshAssessment}>
                Start Fresh
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Optional Questions Dialog */}
      {showOptionalPrompt && (
        <Dialog open={showOptionalPrompt} onOpenChange={(isOpen) => setShowOptionalPrompt(isOpen)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Optional Questions</DialogTitle>
              <DialogDescription>
                Do you want to proceed with the optional questions?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => {
                setShowOptionalPrompt(false);
                setOptionalQuestionsMode('ask');
                setDirection(1);
                setCurrentQuestion(prev => prev + 1);
                window.scrollTo(0, 0);
              }}>
                Yes
              </Button>
              <Button variant="outline" onClick={handleSkipOptional}>
                No
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirmation && (
        <Dialog open={showSubmitConfirmation} onOpenChange={(isOpen) => setShowSubmitConfirmation(isOpen)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Submission</DialogTitle>
              <DialogDescription>
                Are you sure you want to submit your responses?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleSubmit}>
                Submit
              </Button>
              <Button variant="outline" onClick={() => setShowSubmitConfirmation(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}