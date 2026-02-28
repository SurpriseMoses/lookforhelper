const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy — Look for Helper</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
          <p className="text-muted-foreground mb-2">We may collect the following information when you use the platform:</p>

          <h3 className="font-medium text-foreground mt-4 mb-1">Account Information</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Full name</li><li>Email address</li><li>Phone number (if provided)</li><li>Profile photo</li>
          </ul>

          <h3 className="font-medium text-foreground mt-4 mb-1">Helper Information</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Skills and services</li><li>Location (city/area)</li><li>Availability</li><li>Work experience</li>
          </ul>

          <h3 className="font-medium text-foreground mt-4 mb-1">Verification Information</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Identity documents (for verification purposes only)</li>
            <li>Background check information (if applicable)</li>
          </ul>

          <h3 className="font-medium text-foreground mt-4 mb-1">Payment Information</h3>
          <p className="text-muted-foreground ml-2">Payments are processed securely by a third-party payment provider. We do not store card or bank details.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
          <p className="text-muted-foreground mb-2">Your information is used to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Create and manage your account</li>
            <li>Display helper profiles publicly for service discovery</li>
            <li>Process payments and subscriptions</li>
            <li>Verify identity and build trust on the platform</li>
            <li>Enable communication between seekers and helpers</li>
            <li>Improve platform functionality and security</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Public Information</h2>
          <p className="text-muted-foreground mb-2">If you register as a Helper, the following may be publicly visible:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Name</li><li>Profile photo</li><li>Skills/services</li><li>Location (city only)</li>
            <li>Ratings and reviews</li><li>Trust badges (e.g., Verified, Background Checked)</li>
          </ul>
          <p className="text-muted-foreground mt-4 mb-2">We do not publicly display:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Email address</li>
            <li>Phone number (unless contact is unlocked through payment)</li>
            <li>Identity documents</li>
            <li>Payment information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Security</h2>
          <p className="text-muted-foreground mb-2">We take reasonable steps to protect your information, including:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Secure authentication systems</li>
            <li>Encrypted data transmission (HTTPS)</li>
            <li>Restricted access to sensitive documents</li>
            <li>Private storage for identity verification files</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Third-Party Services</h2>
          <p className="text-muted-foreground mb-2">We use trusted third-party providers, including:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Payment processing services</li>
            <li>Secure cloud hosting providers</li>
            <li>Authentication and database services</li>
          </ul>
          <p className="text-muted-foreground mt-2 ml-2">These providers process data only as necessary to operate the platform.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights</h2>
          <p className="text-muted-foreground mb-2">You may:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
            <li>Update your profile information at any time</li>
            <li>Request account deletion</li>
            <li>Contact us regarding your data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact Us</h2>
          <p className="text-muted-foreground">If you have any questions about this Privacy Policy, contact:</p>
          <p className="text-muted-foreground mt-1">Email: <a href="mailto:lookforhelper777.co.za" className="text-primary underline">lookforhelper777.co.za</a></p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
