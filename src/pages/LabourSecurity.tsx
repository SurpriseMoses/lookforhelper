import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileCheck2, HeartPulse, Banknote, ExternalLink, ArrowRight, BookOpen } from "lucide-react";

const ext = {
  target: "_blank" as const,
  rel: "noopener noreferrer",
};

const LabourSecurity = () => {
  useEffect(() => {
    document.title = "Labour Security: UIF & Legal Compliance Guide | Look For Helper";
    const desc = "South African employer guide to UIF, COIDA and the National Minimum Wage (R30.23/hr) for domestic workers. Register on uFiling and stay compliant.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", desc);
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container py-12 md:py-20">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> For Families & Employers
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Labour Security: UIF & Legal Compliance for Domestic Workers
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground">
              A practical guide to staying compliant with South African labour law when you employ a
              domestic worker — UIF, COIDA, the National Minimum Wage, and employment contracts.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <a href="https://www.ufiling.co.za/uif/" {...ext}>
                  Register on uFiling <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href="https://www.labour.gov.za" {...ext}>
                  Department of Employment & Labour <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container py-10 md:py-14 space-y-8">
        {/* National Minimum Wage */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>National Minimum Wage</CardTitle>
                <CardDescription>
                  Current statutory minimum for domestic workers in South Africa.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">National Minimum Wage</p>
              <p className="text-3xl font-bold text-foreground">R30.23 <span className="text-base font-medium text-muted-foreground">/ hour</span></p>
              <p className="mt-1 text-xs text-muted-foreground">
                Applies to domestic workers. Paying below this rate is unlawful.
              </p>
            </div>
            <ul className="list-disc pl-5 text-sm text-foreground space-y-1.5">
              <li>Wages must be paid in cash, by cheque, or by direct deposit — never in kind only.</li>
              <li>A written payslip must be issued for every payment.</li>
              <li>Overtime, Sunday and public holiday rates apply per the BCEA.</li>
            </ul>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href="https://www.labour.gov.za/national-minimum-wage" {...ext}>
                Read the official NMW notice <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* UIF */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>UIF Registration (Unemployment Insurance Fund)</CardTitle>
                <CardDescription>
                  Mandatory for any domestic worker who works more than 24 hours a month.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 text-sm text-foreground space-y-2">
              <li>Register as an employer on <a className="text-primary underline" href="https://www.ufiling.co.za/uif/" {...ext}>uFiling</a>.</li>
              <li>Add your domestic worker as an employee (you'll need their ID number).</li>
              <li>Contribute <strong>2% of monthly wages</strong> — 1% deducted from the worker, 1% paid by you.</li>
              <li>Submit declarations and pay UIF monthly through uFiling.</li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <a href="https://www.ufiling.co.za/uif/" {...ext}>
                  Register on uFiling <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a href="https://www.labour.gov.za/uif" {...ext}>
                  UIF guidance <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* COIDA */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>COIDA — Injury on Duty Cover</CardTitle>
                <CardDescription>
                  Domestic workers are covered under the Compensation for Occupational Injuries and Diseases Act.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground">
              Since 2020, employers of domestic workers must register with the Compensation Fund. This protects
              your worker if they are injured, fall ill, or pass away as a result of their work.
            </p>
            <ul className="list-disc pl-5 text-sm text-foreground space-y-1.5">
              <li>Register your household as an employer with the Compensation Fund.</li>
              <li>Submit annual Return of Earnings (W.As.8).</li>
              <li>Pay the annual assessment fee based on declared wages.</li>
              <li>Report any workplace injury within 7 days.</li>
            </ul>
            <Button asChild variant="outline" className="gap-2">
              <a href="https://www.labour.gov.za/compensation-for-occupational-injuries-and-diseases-act" {...ext}>
                COIDA information <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Employment contract */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Written Employment Contract</CardTitle>
                <CardDescription>
                  Required by the Basic Conditions of Employment Act (BCEA).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground">
            <p>Your contract should include working hours, wages, leave entitlement, notice periods, and duties.</p>
            <Button asChild variant="outline" className="gap-2">
              <a href="https://www.labour.gov.za/basic-conditions-of-employment-act" {...ext}>
                Download a sample contract <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Track your compliance progress</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use the Compliance Checklist on your dashboard to tick off each step.
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link to="/dashboard">Go to Dashboard <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          This page is general guidance only and does not constitute legal advice. Always confirm details on
          official sources or consult a labour law professional.
        </p>
      </main>

      <Footer />

      <Helmet>
        <title>Labour Security: UIF & Legal Compliance Guide | Look For Helper</title>
        <meta name="description" content="South African employer guide to UIF, COIDA and the National Minimum Wage (R30.23/hr) for domestic workers. Register on uFiling and stay compliant." />
        <link rel="canonical" href="/labour-security" />
      </Helmet>
    </div>
  );
};

export default LabourSecurity;
