"use client";

import { useEffect, useState } from "react";
import AuthForm from "./components/AuthForm";
import { FcLock } from "react-icons/fc";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";

import firebaseClientApp from "../libs/firebase/client";
import LoadingPage from "../components/LoadingPage";
import { useRouter } from "next/navigation";

const auth = getAuth(firebaseClientApp);

const Auth = () => {
  const [csrfToken, setCsrfToken] = useState("loading...");
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    const el = document.querySelector(
      'meta[name="x-csrf-token"]'
    ) as HTMLMetaElement | null;
    if (el) setCsrfToken(el.content);
    else setCsrfToken("missing");
  }, []);

  if (loading) {
    return (
      <>
        <LoadingPage />
      </>
    );
  }

  if (user) {
    return router.push("/live_chat");
  }

  return (
    <div
      className="
        flex 
        h-screen
        flex-col 
        justify-center 
        py-12 
        sm:px-6 
        lg:px-8 
        bg-gray-100
      "
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <FcLock className="mx-auto w-auto" size={60} />
        <h2
          className="
            mt-6 
            text-center 
            text-3xl 
            font-bold 
            tracking-tight 
            text-gray-900
          "
        >
          Welcome to Stream Chat
        </h2>
      </div>
      <AuthForm csrfToken={csrfToken} />
    </div>
  );
};

export default Auth;
