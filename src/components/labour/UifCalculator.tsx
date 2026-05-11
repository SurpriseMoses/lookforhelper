import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

const fmt = (n: number) =>
  `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const UifCalculator = () => {
  const [salary, setSalary] = useState<string>("3500");
  const monthly = Math.max(0, parseFloat(salary) || 0);

  const { employeeShare, employerShare, total } = useMemo(() => {
    const employeeShare = monthly * 0.01;
    const employerShare = monthly * 0.01;
    return { employeeShare, employerShare, total: employeeShare + employerShare };
  }, [monthly]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>UIF Contribution Calculator</CardTitle>
            <CardDescription>
              Enter the monthly wage to see the 1% / 2% UIF breakdown.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-sm">
          <Label htmlFor="uif-salary">Monthly Salary (ZAR)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R
            </span>
            <Input
              id="uif-salary"
              type="number"
              inputMode="decimal"
              min={0}
              step={50}
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="pl-7"
              placeholder="3500"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Employee (1%)</p>
            <p className="text-xl font-bold text-foreground">{fmt(employeeShare)}</p>
            <p className="text-xs text-muted-foreground mt-1">Deducted from wages</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Employer (1%)</p>
            <p className="text-xl font-bold text-foreground">{fmt(employerShare)}</p>
            <p className="text-xs text-muted-foreground mt-1">Paid by you</p>
          </div>
          <div className="rounded-lg border bg-primary/5 border-primary/20 p-4">
            <p className="text-xs text-muted-foreground">Total UIF (2%)</p>
            <p className="text-xl font-bold text-primary">{fmt(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">Submitted monthly</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Estimate only. UIF earnings ceiling and rules may change — confirm on uFiling.
        </p>
      </CardContent>
    </Card>
  );
};

export default UifCalculator;
