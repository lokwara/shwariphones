import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { nprogress } from "@mantine/nprogress";
import Loader from "./loader";

export default function RouteLoader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = (url) => {
      // setLoading(true);
      nprogress.start();
    };
    const handleComplete = (url) => {
      // setLoading(false);
      nprogress.complete();
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // return loading ? <Loader /> : null;
  return;
}
