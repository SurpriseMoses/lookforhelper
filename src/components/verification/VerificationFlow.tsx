import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Camera,
  Upload,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileText,
  Globe,
} from "lucide-react";

const DOCUMENT_TYPES = [
  { value: "sa_id", label: "South African ID", subtitle: "Smart ID Card or Green Book" },
  { value: "passport", label: "Passport", subtitle: "Foreign National Passport" },
  { value: "work_permit", label: "Work Permit / Visa", subtitle: "Valid Work Permit or Visa" },
  { value: "asylum_permit", label: "Asylum Seeker Permit", subtitle: "Asylum Seeker or Refugee Permit" },
  { value: "other", label: "Other Legal Identification", subtitle: "Any other valid legal ID" },
];

const UPLOAD_LABELS: Record<string, string> = {
  sa_id: "Upload your South African ID",
  passport: "Upload your Passport",
  work_permit: "Upload your Work Permit or Visa",
  asylum_permit: "Upload your Asylum Seeker Permit",
  other: "Upload your Legal Identification",
};

interface VerificationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const VerificationFlow = ({ open, onOpenChange, onComplete }: VerificationFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);

  const isForeigner = documentType !== "sa_id" && documentType !== "";
  const totalSteps = isForeigner ? 5 : 4;

  const resetFlow = () => {
    setStep(1);
    setDocumentType("");
    setDocumentFile(null);
    setSelfieBlob(null);
    setSelfiePreview(null);
    setCountryOfOrigin("");
    setDocumentNumber("");
    setExpiryDate("");
    stopCamera();
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to take a selfie.",
        variant: "destructive",
      });
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        setSelfieBlob(blob);
        setSelfiePreview(URL.createObjectURL(blob));
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  };

  const retakeSelfie = () => {
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfieBlob(null);
    setSelfiePreview(null);
    startCamera();
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10 MB.", variant: "destructive" });
      return;
    }
    setDocumentFile(file);
  };

  const handleSubmit = async () => {
    if (!user || !documentFile || !selfieBlob) return;
    setSubmitting(true);

    try {
      // Upload document
      const docPath = `${user.id}/${Date.now()}-${documentFile.name}`;
      const { error: docErr } = await supabase.storage
        .from("identity-documents")
        .upload(docPath, documentFile);
      if (docErr) throw docErr;

      // Upload selfie
      const selfiePath = `${user.id}/${Date.now()}-selfie.jpg`;
      const { error: selfieErr } = await supabase.storage
        .from("verification-selfies")
        .upload(selfiePath, selfieBlob);
      if (selfieErr) throw selfieErr;

      // Insert verification request
      const { error: insertErr } = await supabase
        .from("verification_requests")
        .insert({
          user_id: user.id,
          document_url: docPath,
          selfie_url: selfiePath,
          document_type: documentType,
          status: "pending",
          country_of_origin: isForeigner ? (countryOfOrigin || null) : null,
          document_number: isForeigner ? (documentNumber || null) : null,
          expiry_date: isForeigner ? (expiryDate || null) : null,
        } as any);
      if (insertErr) throw insertErr;

      toast({
        title: "Verification submitted!",
        description: "Our team will review it within 1-2 business days. You'll only be charged R49 if approved.",
      });

      resetFlow();
      onOpenChange(false);
      onComplete();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!documentType;
      case 2: return !!documentFile;
      case 3: return !!selfieBlob;
      case 4:
        if (isForeigner) return !!countryOfOrigin;
        return true; // review step for SA
      default: return true;
    }
  };

  const getStepForReview = () => (isForeigner ? 5 : 4);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select the type of document you'll use to verify your identity:</p>
            <div className="space-y-2">
              {DOCUMENT_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => setDocumentType(dt.value)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    documentType === dt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-foreground text-sm">{dt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{dt.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {UPLOAD_LABELS[documentType] || "Upload your document"}
            </p>
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
              {documentFile ? (
                <div className="space-y-2">
                  <FileText className="mx-auto h-8 w-8 text-primary" />
                  <p className="text-sm font-medium text-foreground">{documentFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(documentFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  <Button variant="outline" size="sm" onClick={() => setDocumentFile(null)}>
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <div>
                    <Label htmlFor="doc-upload" className="cursor-pointer">
                      <Button asChild variant="outline">
                        <span><Upload className="h-4 w-4 mr-1" /> Choose File</span>
                      </Button>
                    </Label>
                    <input
                      id="doc-upload"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleDocumentUpload}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG, or PDF. Max 10 MB.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a live selfie for identity matching. This helps us verify you are the person on the document.
            </p>
            <canvas ref={canvasRef} className="hidden" />
            {selfiePreview ? (
              <div className="space-y-3 text-center">
                <div className="mx-auto w-64 h-48 overflow-hidden rounded-lg border">
                  <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                </div>
                <Button variant="outline" size="sm" onClick={retakeSelfie}>
                  <Camera className="h-4 w-4 mr-1" /> Retake Selfie
                </Button>
              </div>
            ) : cameraActive ? (
              <div className="space-y-3 text-center">
                <div className="mx-auto w-64 h-48 overflow-hidden rounded-lg border bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                </div>
                <Button onClick={captureSelfie}>
                  <Camera className="h-4 w-4 mr-1" /> Capture Selfie
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                <Button onClick={startCamera}>
                  <Camera className="h-4 w-4 mr-1" /> Open Camera
                </Button>
              </div>
            )}
          </div>
        );

      case 4:
        if (isForeigner) {
          return (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Since you're using a foreign document, please provide additional details:
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="country">Country of Origin *</Label>
                  <Input
                    id="country"
                    placeholder="e.g. Zimbabwe, Mozambique"
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="doc-number">Document Number</Label>
                  <Input
                    id="doc-number"
                    placeholder="Enter document number"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="expiry">Expiry Date (if applicable)</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        }
        // Fall through to review for SA
        return renderReview();

      case 5:
        return renderReview();

      default:
        return null;
    }
  };

  const renderReview = () => {
    const docType = DOCUMENT_TYPES.find((d) => d.value === documentType);
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Review your submission before sending:</p>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Document Type</span>
            <span className="font-medium text-foreground">{docType?.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Document File</span>
            <span className="font-medium text-foreground truncate max-w-[200px]">{documentFile?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Selfie</span>
            <span className="font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Captured
            </span>
          </div>
          {isForeigner && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Country</span>
                <span className="font-medium text-foreground">{countryOfOrigin || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Document Number</span>
                <span className="font-medium text-foreground">{documentNumber || "—"}</span>
              </div>
              {expiryDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expiry Date</span>
                  <span className="font-medium text-foreground">{expiryDate}</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Note:</span> Our team will review your submission within 1-2 business days. 
            You'll only be charged R49 once your documents are approved.
          </p>
        </div>
      </div>
    );
  };

  const stepTitles = [
    "Select Document Type",
    "Upload Document",
    "Capture Selfie",
    ...(isForeigner ? ["Additional Details", "Review & Submit"] : ["Review & Submit"]),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) { resetFlow(); stopCamera(); }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Step {step} of {totalSteps}: {stepTitles[step - 1]}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Identity verification step {step}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1 mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {renderStep()}

        <div className="flex justify-between mt-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => { if (step === 1) { onOpenChange(false); resetFlow(); } else setStep(step - 1); }}
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step === getStepForReview() ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Submitting...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-1" /> Submit Verification</>
              )}
            </Button>
          ) : (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationFlow;
