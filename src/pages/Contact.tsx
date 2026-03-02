import { Mail, Clock } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
        <p className="text-muted-foreground mb-8">
          Have a question, concern, or need support? We're here to help.
        </p>

        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-lg border bg-card p-6">
            <Mail className="h-6 w-6 text-primary mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Email</h2>
              <a
                href="mailto:help.lookforhelper@gmail.com"
                className="text-primary underline"
              >
                help.lookforhelper@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-lg border bg-card p-6">
            <Clock className="h-6 w-6 text-primary mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Response Time</h2>
              <p className="text-muted-foreground">
                We aim to respond to all inquiries within <strong>24–48 hours</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
