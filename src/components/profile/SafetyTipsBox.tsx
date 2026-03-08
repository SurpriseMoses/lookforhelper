import { ShieldCheck } from "lucide-react";

const SafetyTipsBox = () => {
  return (
    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-5 w-5 text-amber-700" />
        <h3 className="text-sm font-semibold text-amber-900">Before hiring a helper, we recommend:</h3>
      </div>
      <ul className="space-y-1.5 text-xs text-amber-800">
        <li>• Conducting a phone or video interview</li>
        <li>• Meeting in person in a safe place</li>
        <li>• Verifying identity documents</li>
        <li>• Agreeing on duties and payment clearly</li>
        <li>• Reporting suspicious activity</li>
      </ul>
    </div>
  );
};

export default SafetyTipsBox;
