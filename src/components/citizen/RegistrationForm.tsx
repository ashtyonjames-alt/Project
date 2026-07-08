"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const districts = [
  "Novagrad Central", "Novagrad East", "Novagrad West", "Ostmark",
  "Velikov", "Kradova", "Zarevka", "Mirova",
].map((d) => ({ value: d, label: d }));

const STEPS = ["Personal Information", "Address & District", "Review & Submit"];

function genConfirmationNumber() {
  return "REG-" + Math.random().toString(36).toUpperCase().slice(2, 10);
}

export default function RegistrationForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "", lastName: "", dateOfBirth: "", email: "",
    district: districts[0].value, address: "", city: "", postcode: "",
  });
  const [done, setDone] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit() {
    setConfirmation(genConfirmationNumber());
    setDone(true);
  }

  return (
    <div className="max-w-xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? "bg-su-blue text-white" : "bg-su-gray-100 text-su-gray-500"}`}>
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === step ? "text-su-navy font-medium" : "text-su-gray-500"}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-su-gray-200 w-6" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-su-navy text-lg">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
            <Input label="Last Name" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
          </div>
          <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} required />
          <Input label="Email Address" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          <Button onClick={() => setStep(1)} disabled={!form.firstName || !form.lastName || !form.dateOfBirth}>
            Continue →
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-su-navy text-lg">Address & District</h2>
          <Select label="District" options={districts} value={form.district} onChange={(e) => update("district", e.target.value)} />
          <Input label="Street Address" value={form.address} onChange={(e) => update("address", e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City / Town" value={form.city} onChange={(e) => update("city", e.target.value)} required />
            <Input label="Postcode" value={form.postcode} onChange={(e) => update("postcode", e.target.value)} required />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>← Back</Button>
            <Button onClick={() => setStep(2)} disabled={!form.address || !form.city}>
              Continue →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-su-navy text-lg">Review & Submit</h2>
          <div className="bg-su-gray-50 rounded-lg p-5 text-sm space-y-3 border border-su-gray-100">
            {[
              ["Full Name", `${form.firstName} ${form.lastName}`],
              ["Date of Birth", form.dateOfBirth],
              ["Email", form.email],
              ["District", form.district],
              ["Address", `${form.address}, ${form.city} ${form.postcode}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-su-gray-500">{label}</span>
                <span className="font-medium text-su-gray-900">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-su-gray-500">
            By submitting, you confirm that all information provided is accurate and complete.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={submit}>Submit Registration</Button>
          </div>
        </div>
      )}

      <Modal isOpen={done} onClose={() => setDone(false)} title="Registration Submitted">
        <div className="space-y-3">
          <p>Your registration has been received and is pending review by the Citizen Registry Office.</p>
          <div className="bg-su-blue-pale rounded p-3 text-center">
            <p className="text-xs text-su-gray-500 mb-1">Confirmation Number</p>
            <p className="font-mono font-bold text-su-blue text-lg">{confirmation}</p>
          </div>
          <p>Please retain this confirmation number for your records. You will receive a notification at your registered email address within 5–10 business days.</p>
        </div>
      </Modal>
    </div>
  );
}
