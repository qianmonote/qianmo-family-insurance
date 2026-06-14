"use client";

import { Suspense } from "react";

import Loader from "@/components/loader";
import SignInForm from "@/components/sign-in-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<Loader />}>
      <SignInForm />
    </Suspense>
  );
}
