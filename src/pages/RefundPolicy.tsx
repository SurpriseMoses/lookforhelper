import SEO from "@/components/SEO";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Refund Policy | Look For Helper"
        description="Look For Helper's policy on refunds for seeker contact access, helper subscriptions and featured boosts."
        path="/refund-policy"
      />
      <div className="container max-w-3xl py-12 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">Refund Policy — Look for Helper</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Seeker Payments</h2>
          <p className="text-muted-foreground">
            Payments made by seekers to unlock contact/chat access are <strong>non-refundable</strong> because access is activated immediately upon payment.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">2. Helper Payments</h2>
          <p className="text-muted-foreground mb-2">Payments for the following helper services are <strong>non-refundable</strong> once activated:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Profile visibility subscription</li>
            <li>Featured Boosts</li>
            <li>Verified Identity badge</li>
            <li>Background Check</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Failed or Duplicate Charges</h2>
          <p className="text-muted-foreground">
            If a user is charged incorrectly or more than once, they may contact support within <strong>7 days</strong> for investigation and a possible refund.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Service Errors</h2>
          <p className="text-muted-foreground mb-2">
            If a paid feature is not activated due to a system error, the platform will either:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Activate the feature manually, or</li>
            <li>Issue a full refund if activation is not possible.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Contact Us</h2>
          <p className="text-muted-foreground">
            For refund-related inquiries, please contact:{" "}
            <a href="mailto:help.lookforhelper@gmail.com?subject=Refund%20or%20Dispute%20Request%20-%20Look%20for%20Helper" className="text-primary underline">
              help.lookforhelper@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;
