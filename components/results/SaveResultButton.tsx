"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveDiagnosis } from "@/lib/actions/save-diagnosis";

type Props = {
  type: "quick" | "full";
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  isLoggedIn: boolean;
};

export function SaveResultButton({ type, input, result, isLoggedIn }: Props) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const res = await saveDiagnosis({ type, input, result });
      if (res.error) {
        setError(res.error);
      } else {
        setSaved(true);
      }
    });
  }

  if (!isLoggedIn) {
    return (
      <a href="/auth/signup">
        <Button variant="outline" className="w-full" size="lg">
          結果を保存する（無料アカウント作成）
        </Button>
      </a>
    );
  }

  if (saved) {
    return (
      <Button variant="outline" className="w-full" size="lg" disabled>
        保存済み
      </Button>
    );
  }

  return (
    <>
      <Button onClick={handleSave} variant="outline" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "保存中..." : "結果を保存する"}
      </Button>
      {error !== "" ? <p className="text-sm text-red-600 text-center">{error}</p> : null}
    </>
  );
}
