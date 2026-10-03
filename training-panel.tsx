import { useState } from "react";
import { Brain, BookOpen, Trash2 } from "lucide-react";
import { useFlowStore } from "@/lib/flow/store";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function TrainingPanel() {
  const enabled = useFlowStore((s) => s.trainingEnabled);
  const examples = useFlowStore((s) => s.trainingExamples);
  const candidates = useFlowStore((s) => s.learningCandidates);
  const setEnabled = useFlowStore((s) => s.setTrainingEnabled);
  const addExample = useFlowStore((s) => s.addTrainingExample);
  const removeExample = useFlowStore((s) => s.removeTrainingExample);
  const teachCandidate = useFlowStore((s) => s.teachLearningCandidate);
  const dismissCandidate = useFlowStore((s) => s.dismissLearningCandidate);
  const [user, setUser] = useState("");
  const [answer, setAnswer] = useState("");
  const [candidateAnswers, setCandidateAnswers] = useState<Record<string, string>>({});

  const add = () => {
    if (!user.trim() || !answer.trim()) return;
    addExample(user, answer);
    setUser("");
    setAnswer("");
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="rounded-2xl bg-raised p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-forest text-surface">
            <Brain className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Entrenamiento del bot</p>
            <p className="mt-1 text-xs leading-5 text-muted">Enséñale respuestas aprobadas. La IA las usará como ejemplos cuando sean relevantes.</p>
          </div>
        </div>
        <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl bg-surface px-3 py-2.5">
          <span>Aprendizaje activado</span>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-4 accent-[var(--forest)]" />
        </label>
      </div>

      {candidates.length > 0 ? (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-50/70 p-4 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Brain className="size-4" />
            </span>
            <div>
              <p className="font-medium">Preguntas que Vía no supo responder</p>
              <p className="mt-1 text-xs leading-5 text-muted">Cuando detecta una respuesta de incertidumbre, la deja aquí para que tú le enseñes la respuesta correcta.</p>
            </div>
          </div>
          <div className="mt-3 grid gap-3">
            {candidates.map((candidate) => {
              const value = candidateAnswers[candidate.id] ?? "";
              return (
                <div key={candidate.id} className="rounded-xl border border-line bg-surface p-3">
                  <p className="text-xs font-medium">Cliente: {candidate.user}</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">Respuesta que dio Vía: {candidate.botAnswer}</p>
                  <Textarea
                    value={value}
                    onChange={(e) => setCandidateAnswers((prev) => ({ ...prev, [candidate.id]: e.target.value }))}
                    placeholder="Escribe la respuesta correcta que debe aprender"
                    className="mt-2"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!value.trim()) return;
                        teachCandidate(candidate.id, value);
                        setCandidateAnswers((prev) => { const next = { ...prev }; delete next[candidate.id]; return next; });
                      }}
                      disabled={!value.trim()}
                    >
                      Enseñarle
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => dismissCandidate(candidate.id)}>Descartar</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-forest" />
          <p className="font-medium">Enseñarle algo nuevo</p>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">Escribe un ejemplo de lo que puede preguntar un cliente y la respuesta correcta.</p>
        <div className="mt-3 grid gap-2">
          <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Cliente: ¿Cuál es el horario?" />
          <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Bot: Abrimos de lunes a sábado de 8 a.m. a 6 p.m." />
          <Button onClick={add} disabled={!user.trim() || !answer.trim()}>Guardar entrenamiento</Button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">Ejemplos aprendidos</p>
          <span className="text-[11px] text-muted">{examples.length}/100</span>
        </div>
        {examples.length === 0 ? (
          <div className="rounded-2xl bg-raised p-4 text-xs leading-5 text-muted">Todavía no hay ejemplos. Agrega algunos para que la IA tenga una guía propia.</div>
        ) : (
          <div className="grid gap-2">
            {examples.map((example) => (
              <div key={example.id} className="rounded-2xl border border-line bg-surface p-3">
                <p className="text-xs font-medium">{example.user}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{example.answer}</p>
                <button type="button" onClick={() => removeExample(example.id)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted hover:text-danger">
                  <Trash2 className="size-3" /> Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] leading-5 text-subtle">Vía puede detectar respuestas de incertidumbre durante las conversaciones. Las preguntas aparecen aquí como pendientes y solo se convierten en conocimiento cuando tú apruebas y escribes la respuesta correcta.</p>
    </div>
  );
}
