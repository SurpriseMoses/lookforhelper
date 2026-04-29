import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, MailMinus } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const json = await res.json();
        if (json.valid === true) setState("valid");
        else if (json.reason === "already_unsubscribed") setState("already");
        else { setState("invalid"); setErrorMsg(json.error || ""); }
      } catch (e) {
        setState("invalid");
        setErrorMsg(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (json.success) setState("success");
      else if (json.reason === "already_unsubscribed") setState("already");
      else { setState("error"); setErrorMsg(json.error || "Could not unsubscribe"); }
    } catch (e) {
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MailMinus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Unsubscribe</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state === "loading" && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking your link…
            </div>
          )}
          {state === "valid" && (
            <>
              <p className="text-sm text-muted-foreground">
                Click below to stop receiving emails from Look For Helper at this address.
              </p>
              <Button onClick={confirm} className="w-full">Confirm unsubscribe</Button>
            </>
          )}
          {state === "submitting" && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </div>
          )}
          {state === "success" && (
            <div className="space-y-3">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <p className="text-sm">You've been unsubscribed. We're sorry to see you go.</p>
              <Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
            </div>
          )}
          {state === "already" && (
            <div className="space-y-3">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm">This email is already unsubscribed.</p>
              <Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
            </div>
          )}
          {(state === "invalid" || state === "error") && (
            <div className="space-y-3">
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="text-sm">
                {state === "invalid" ? "This unsubscribe link is invalid or has expired." : "Something went wrong."}
              </p>
              {errorMsg && <p className="text-xs text-muted-foreground">{errorMsg}</p>}
              <Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
