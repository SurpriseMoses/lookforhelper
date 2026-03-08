const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service — Look for Helper</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

        <p className="text-muted-foreground mb-8">By using Look for Helper, you agree to the following terms.</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Platform Role</h2>
          <p className="text-muted-foreground mb-2">Look for Helper is a marketplace that connects:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li><strong>Seekers</strong> — individuals looking for help or services</li>
            <li><strong>Helpers</strong> — individuals offering services</li>
          </ul>
          <p className="text-muted-foreground mt-3">We are not an employer, agency, or party to any agreement between users.</p>
          <p className="text-muted-foreground mt-1">All service arrangements are made directly between Seekers and Helpers.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">2. User Responsibility</h2>
          <p className="text-muted-foreground mb-2">
            Look For Helper operates as a marketplace that connects households and independent helpers. Look For Helper does not employ helpers and does not guarantee identity, references, or work authorization. Users are responsible for conducting their own checks and making informed hiring decisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">3. User Conduct</h2>
          <p className="text-muted-foreground mb-2">Users agree to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Provide accurate information</li>
            <li>Use the platform lawfully</li>
            <li>Treat other users respectfully</li>
            <li>Not misuse contact information or platform features</li>
          </ul>
          <p className="text-muted-foreground mt-3">Helpers are responsible for the accuracy of their profiles and qualifications.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Payments</h2>

          <h3 className="font-medium text-foreground mt-4 mb-1">Seeker Payments</h3>
          <p className="text-muted-foreground ml-2">Seekers may pay a fee (e.g., R25) to unlock contact or chat access with helpers. Access is valid for a limited period.</p>

          <h3 className="font-medium text-foreground mt-4 mb-1">Helper Payments</h3>
          <p className="text-muted-foreground mb-2 ml-2">Helpers may pay for optional features, including:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
            <li>Profile visibility subscription</li>
            <li>Featured profile boosts</li>
            <li>Identity verification</li>
            <li>Background checks</li>
          </ul>
          <p className="text-muted-foreground mt-3 ml-2">All payments are processed securely via a third-party payment provider.</p>
          <p className="text-muted-foreground mt-1 ml-2">Payments are non-refundable, except where required by law.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Verification & Trust Badges</h2>
          <p className="text-muted-foreground mb-2">Trust badges (such as Verified Identity or Background Checked) indicate that certain checks have been completed.</p>
          <p className="text-muted-foreground">These badges do not guarantee performance, reliability, or suitability.</p>
          <p className="text-muted-foreground mt-1">Seekers are responsible for their own hiring decisions.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">6. Background Checks</h2>
          <p className="text-muted-foreground">Where available, background checks are conducted through third-party sources. Results are provided for informational purposes only and may not be exhaustive.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">7. Reviews & Ratings</h2>
          <p className="text-muted-foreground">Users may leave honest reviews based on actual experiences. We reserve the right to remove inappropriate or fraudulent content.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
          <p className="text-muted-foreground mb-2">Look for Helper is not responsible for:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>The conduct of users</li>
            <li>Service quality or outcomes</li>
            <li>Any agreements made between Seekers and Helpers</li>
            <li>Loss, damage, or disputes arising from services</li>
          </ul>
          <p className="text-muted-foreground mt-3">Users engage with each other at their own risk.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">9. Account Suspension</h2>
          <p className="text-muted-foreground mb-2">We may suspend or remove accounts that:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Violate these terms</li>
            <li>Provide false information</li>
            <li>Engage in fraudulent or abusive activity</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to the Platform</h2>
          <p className="text-muted-foreground">We may update features, pricing, or policies at any time. Continued use of the platform means you accept the updated terms.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact</h2>
          <p className="text-muted-foreground">For support or legal inquiries:</p>
          <p className="text-muted-foreground mt-1">Email: <a href="mailto:help.lookforhelper@gmail.com?subject=Support%20Request%20-%20Look%20for%20Helper" className="text-primary underline">help.lookforhelper@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
