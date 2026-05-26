import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileCheck2, HeartPulse, Banknote, ExternalLink, ArrowRight } from "lucide-react";
import UifCalculator from "@/components/labour/UifCalculator";
import ContractBuilder from "@/components/labour/ContractBuilder";

function openExternal(url: string) {
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) {
      win.opener = null;
      return;
    }
  } catch {}
  // Fallback for PWA standalone where window.open may be blocked
  window.location.href = url;
}

const UFILING_UIF_APPLICATION_URL = "https://ufiling.labour.gov.za/uif/register";

const ext = {
  target: "_blank" as const,
  rel: "noopener noreferrer",
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    openExternal(e.currentTarget.href);
  },
};

const LabourSecurity = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Labour Security: UIF & Compliance Guide | Look For Helper"
        description="South African employer guide to UIF, COIDA and the National Minimum Wage (R30.23/hr) for domestic workers. Includes a UIF calculator and contract template."
        path="/labour-security"
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Labour Security: UIF & Legal Compliance for Domestic Workers",
          description:
            "A practical employer guide to UIF, COIDA and the South African National Minimum Wage for domestic workers, with a UIF calculator and downloadable contract template.",
          author: { "@type": "Organization", name: "Look For Helper" },
          publisher: {
            "@type": "Organization",
            name: "Look For Helper",
            logo: {
              "@type": "ImageObject",
              url: "https://www.lookforhelper.co.za/pwa-512x512-v6.png",
            },
          },
          mainEntityOfPage: "https://www.lookforhelper.co.za/labour-security",
        }}
      />
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
                <a href={UFILING_UIF_APPLICATION_URL} {...ext}>
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
              <li>Register as an employer on <a className="text-primary underline" href={UFILING_UIF_APPLICATION_URL} {...ext}>uFiling</a>.</li>
              <li>Add your domestic worker as an employee (you'll need their ID number).</li>
              <li>Contribute <strong>2% of monthly wages</strong> — 1% deducted from the worker, 1% paid by you.</li>
              <li>Submit declarations and pay UIF monthly through uFiling.</li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <a href={UFILING_UIF_APPLICATION_URL} {...ext}>
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

        {/* UIF Calculator */}
        <UifCalculator />

        {/* Employment contract builder */}
        <ContractBuilder />

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

    </div>
  );
};

export default LabourSecurity;
