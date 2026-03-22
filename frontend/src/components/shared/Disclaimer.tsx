import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p>
        <strong>Disclaimer:</strong> Aura is an AI emotional support assistant
        and is not a substitute for professional mental health care. If you are
        in crisis, please contact a helpline or emergency services immediately.
      </p>
    </div>
  );
}
