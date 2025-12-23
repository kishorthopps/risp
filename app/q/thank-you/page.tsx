import ThankYouPage from "@/components/thank-you/ThankYouPage";
import { Suspense } from "react";

export default function ThankYou() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThankYouPage />
    </Suspense>
  );
}