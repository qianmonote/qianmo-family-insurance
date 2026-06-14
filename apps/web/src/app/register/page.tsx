"use client";

import { Suspense } from "react";

import Loader from "@/components/loader";
import SignUpForm from "@/components/sign-up-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loader />}>
      <SignUpForm />
    </Suspense>
  );
}
