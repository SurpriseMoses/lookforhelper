import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ArrowRight } from "lucide-react";

const TASKS = [
  { id: "uif", label: "Register for UIF on uFiling" },
  { id: "contract", label: "Sign a written Employment Contract" },
  { id: "coida", label: "Register with the Compensation Fund (COIDA)" },
  { id: "wage", label: "Confirm wage meets National Minimum Wage (R30.23/hr)" },
  { id: "payslip", label: "Provide monthly payslips" },
];

const STORAGE_KEY = "compliance_checklist_v1";

const ComplianceChecklistCard = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const completed = TASKS.filter((t) => checked[t.id]).length;
  const pct = Math.round((completed / TASKS.length) * 100);

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Compliance Checklist</CardTitle>
            <CardDescription>
              Stay legally compliant when employing a domestic worker.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
            <span>{completed} of {TASKS.length} complete</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        <ul className="space-y-2.5">
          {TASKS.map((task) => (
            <li key={task.id} className="flex items-start gap-3">
              <Checkbox
                id={`task-${task.id}`}
                checked={!!checked[task.id]}
                onCheckedChange={() => toggle(task.id)}
                className="mt-0.5"
              />
              <label
                htmlFor={`task-${task.id}`}
                className={`text-sm cursor-pointer ${checked[task.id] ? "line-through text-muted-foreground" : "text-foreground"}`}
              >
                {task.label}
              </label>
            </li>
          ))}
        </ul>

        <Button asChild className="w-full gap-2">
          <Link to="/labour-security">
            View Labour Security Guide <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ComplianceChecklistCard;
