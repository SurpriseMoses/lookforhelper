import { useState } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, Printer } from "lucide-react";

interface ContractFields {
  employerName: string;
  employerAddress: string;
  employeeName: string;
  employeeId: string;
  startDate: string;
  jobTitle: string;
  workplace: string;
  hoursPerWeek: string;
  workingDays: string;
  wage: string;
  payDay: string;
  leaveDays: string;
  noticePeriod: string;
  duties: string;
}

const initial: ContractFields = {
  employerName: "",
  employerAddress: "",
  employeeName: "",
  employeeId: "",
  startDate: "",
  jobTitle: "Domestic Worker",
  workplace: "",
  hoursPerWeek: "45",
  workingDays: "Monday to Friday",
  wage: "",
  payDay: "Last day of each month",
  leaveDays: "21",
  noticePeriod: "4 weeks",
  duties: "General cleaning, laundry, ironing, and other reasonable household duties as agreed.",
};

const buildContractText = (f: ContractFields) => `EMPLOYMENT CONTRACT — DOMESTIC WORKER
(In terms of the Basic Conditions of Employment Act, No. 75 of 1997, and Sectoral Determination 7)

1. PARTIES
Employer: ${f.employerName || "________________________"}
Address: ${f.employerAddress || "________________________"}

Employee: ${f.employeeName || "________________________"}
ID Number: ${f.employeeId || "________________________"}

2. COMMENCEMENT
The employment shall commence on ${f.startDate || "____ / ____ / ______"} and shall continue until terminated in accordance with this contract.

3. JOB TITLE & PLACE OF WORK
Job Title: ${f.jobTitle}
Place of Work: ${f.workplace || "________________________"}

4. ORDINARY HOURS OF WORK
Hours per week: ${f.hoursPerWeek} hours
Working days: ${f.workingDays}
Overtime, Sunday and public-holiday work shall be paid in accordance with the BCEA.

5. REMUNERATION
Wage: R${f.wage || "________"} per month, to be paid on ${f.payDay}.
The wage shall not be less than the National Minimum Wage of R30.23 per hour.

6. DEDUCTIONS
The Employer shall deduct 1% of the Employee's wage as a UIF contribution and shall contribute a further 1%, paid monthly to the UIF via uFiling.

7. LEAVE
Annual Leave: ${f.leaveDays} consecutive days on full pay per annual leave cycle.
Sick Leave: As per the BCEA.
Family Responsibility Leave: As per the BCEA.

8. DUTIES
${f.duties}

9. TERMINATION
Either party may terminate this agreement by giving ${f.noticePeriod} written notice.

10. GENERAL
This contract constitutes the entire agreement between the parties. Any amendments must be in writing and signed by both parties.

Signed at __________________________ on this ____ day of ________________ 20____.

____________________________            ____________________________
Employer signature                                  Employee signature
`;

const downloadPdf = (text: string, filename: string) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text, maxWidth);
  let y = margin;
  const lineHeight = 14;
  lines.forEach((line: string) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });
  doc.save(filename);
};

const TEMPLATE_TEXT = buildContractText(initial);

const ContractBuilder = () => {
  const [fields, setFields] = useState<ContractFields>(initial);
  const update = (k: keyof ContractFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((prev) => ({ ...prev, [k]: e.target.value }));

  const handleDownloadTemplate = () =>
    downloadPdf(TEMPLATE_TEXT, "domestic-worker-contract-template.pdf");

  const handleDownloadCustom = () =>
    downloadPdf(buildContractText(fields), "domestic-worker-contract.pdf");

  const handlePrint = () => {
    const text = buildContractText(fields);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Employment Contract</title>
      <style>body{font-family:ui-sans-serif,system-ui,sans-serif;white-space:pre-wrap;padding:32px;line-height:1.5;color:#111;}@media print{body{padding:16mm;}}</style>
      </head><body>${text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string))}<script>window.onload=()=>setTimeout(()=>window.print(),200);</script></body></html>`);
    w.document.close();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle>Employment Contract</CardTitle>
            <CardDescription>
              Download the standard template, or fill in the details below to print your own custom contract.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleDownloadTemplate} className="gap-2">
            <Download className="h-4 w-4" /> Download Contract Template
          </Button>
        </div>

        <div className="border-t pt-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Build Your Custom Contract</h3>
            <p className="text-sm text-muted-foreground">Fill in the fields, then download or print.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employer full name" id="employerName" value={fields.employerName} onChange={update("employerName")} />
            <Field label="Employer address" id="employerAddress" value={fields.employerAddress} onChange={update("employerAddress")} />
            <Field label="Employee full name" id="employeeName" value={fields.employeeName} onChange={update("employeeName")} />
            <Field label="Employee ID number" id="employeeId" value={fields.employeeId} onChange={update("employeeId")} />
            <Field label="Start date" id="startDate" type="date" value={fields.startDate} onChange={update("startDate")} />
            <Field label="Job title" id="jobTitle" value={fields.jobTitle} onChange={update("jobTitle")} />
            <Field label="Place of work" id="workplace" value={fields.workplace} onChange={update("workplace")} />
            <Field label="Hours per week" id="hoursPerWeek" type="number" value={fields.hoursPerWeek} onChange={update("hoursPerWeek")} />
            <Field label="Working days" id="workingDays" value={fields.workingDays} onChange={update("workingDays")} />
            <Field label="Monthly wage (R)" id="wage" type="number" value={fields.wage} onChange={update("wage")} />
            <Field label="Pay day" id="payDay" value={fields.payDay} onChange={update("payDay")} />
            <Field label="Annual leave (days)" id="leaveDays" type="number" value={fields.leaveDays} onChange={update("leaveDays")} />
            <Field label="Notice period" id="noticePeriod" value={fields.noticePeriod} onChange={update("noticePeriod")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duties">Duties</Label>
            <Textarea id="duties" rows={3} value={fields.duties} onChange={update("duties")} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownloadCustom} className="gap-2">
              <Download className="h-4 w-4" /> Download Custom Contract (PDF)
            </Button>
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" /> Print to PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Field = ({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} type={type} value={value} onChange={onChange} />
  </div>
);

export default ContractBuilder;
