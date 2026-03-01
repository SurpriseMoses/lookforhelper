import { ShieldCheck } from "lucide-react";

const SafetyTipsBox = () => {
  return (
    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-5 w-5 text-amber-700" />
        <h3 className="text-sm font-semibold text-amber-900">Safety Tips</h3>
      </div>
      <ul className="space-y-1.5 text-xs text-amber-800">
        <li>• Meet in a safe location first</li>
        <li>• Verify identity before hiring</li>
        <li>• Agree on duties and payment clearly</li>
        <li>• Report suspicious activity</li>
      </ul>
    </div>
  );
};

export default SafetyTipsBox;
