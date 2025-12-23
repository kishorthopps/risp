import FormPage from "@/components/form/FormPage";
import { Suspense } from "react";

export default function Form() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FormPage />
    </Suspense>
  );
}