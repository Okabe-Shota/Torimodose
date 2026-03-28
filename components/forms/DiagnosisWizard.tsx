"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

type Question = {
  key: string
  text: string
  followUp?: string
}

const QUESTIONS: Question[] = [
  { key: "medical_expenses", text: "年間の医療費が10万円を超えましたか？", followUp: "医療費の合計額（万円）" },
  { key: "furusato_nozei", text: "ふるさと納税をしていますか？" },
  { key: "ideco", text: "iDeCo（個人型確定拠出年金）に加入していますか？" },
  { key: "life_insurance", text: "生命保険に加入していますか？" },
  { key: "earthquake_insurance", text: "地震保険に加入していますか？" },
  { key: "housing_loan", text: "住宅ローンを組んでいますか？" },
  { key: "spouse", text: "配偶者はいますか？（年収103万円以下）" },
  { key: "dependents", text: "16歳以上の扶養家族はいますか？" },
  { key: "working_student", text: "働きながら学校に通っていますか？" },
  { key: "casualty_loss", text: "災害・盗難の被害を受けましたか？" },
]

type AnswerEntry = { using: boolean; amount?: number }

type Props = {
  annualIncome: number
  age: number
}

export function DiagnosisWizard({ annualIncome, age }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({})
  const [followUpValue, setFollowUpValue] = useState("")
  const [pendingYes, setPendingYes] = useState(false)

  const currentQuestion = QUESTIONS[step]
  const progress = Math.round((step / QUESTIONS.length) * 100)

  function handleNo() {
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: { using: false } }))
    setPendingYes(false)
    setFollowUpValue("")
    advance()
  }

  function handleYes() {
    if (currentQuestion.followUp) {
      setPendingYes(true)
    } else {
      setAnswers((prev) => ({ ...prev, [currentQuestion.key]: { using: true } }))
      advance()
    }
  }

  function handleFollowUpSubmit() {
    const amount = followUpValue ? parseFloat(followUpValue) : undefined
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.key]: { using: true, ...(amount !== undefined ? { amount } : {}) },
    }))
    setPendingYes(false)
    setFollowUpValue("")
    advance()
  }

  function advance() {
    const nextStep = step + 1
    if (nextStep >= QUESTIONS.length) {
      const encoded = encodeURIComponent(JSON.stringify(answers))
      router.push(`/result/full?data=${encoded}`)
    } else {
      setStep(nextStep)
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {step + 1} / {QUESTIONS.length}
          </span>
        </div>
        <Progress value={progress} />
        <CardTitle className="mt-4 text-base leading-relaxed">
          {currentQuestion.text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!pendingYes ? (
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleYes}
            >
              はい
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={handleNo}
            >
              いいえ
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Input
              type="number"
              placeholder={currentQuestion.followUp}
              value={followUpValue}
              onChange={(e) => setFollowUpValue(e.target.value)}
              className="h-10"
            />
            <Button size="lg" onClick={handleFollowUpSubmit}>
              次へ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
