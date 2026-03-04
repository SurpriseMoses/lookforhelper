const CancellationPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">Cancellation Policy — Look for Helper</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Helper Subscription</h2>
          <p className="text-muted-foreground mb-2">
            Helpers may cancel their visibility subscription at any time from their dashboard.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Cancellation stops future billing immediately.</li>
            <li>Your profile remains visible until the end of the current billing period.</li>
            <li>No partial refunds are issued for unused time.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">2. Featured Boosts</h2>
          <p className="text-muted-foreground">
            Featured Boosts run for a fixed duration (7, 21, or 30 days) and <strong>cannot be cancelled</strong> once activated. The boost will remain active until its expiry date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Seeker Contact Access</h2>
          <p className="text-muted-foreground">
            Seeker access lasts for the purchased period (30 days) and <strong>cannot be cancelled</strong> after activation, as digital access is granted immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Account Deletion</h2>
          <p className="text-muted-foreground">
            Users may request full account deletion at any time by contacting support. Upon deletion, all personal data will be removed in accordance with our Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Contact Us</h2>
          <p className="text-muted-foreground">
            For cancellation or account deletion requests, contact:{" "}
            <a href="mailto:help.lookforhelper@gmail.com?subject=Support%20Request%20-%20Look%20for%20Helper" className="text-primary underline">
              help.lookforhelper@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default CancellationPolicy;
