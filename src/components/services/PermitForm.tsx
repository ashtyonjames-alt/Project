"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const permitTypes = [
  { value: "building", label: "Building Permit" },
  { value: "business", label: "Business Licence" },
  { value: "event", label: "Event Authorisation" },
  { value: "vehicle", label: "Oversized Vehicle Permit" },
  { value: "excavation", label: "Excavation Permit" },
];

export default function PermitForm() {
  const [form, setForm] = useState({ type: "building", description: "", address: "", name: "", contact: "" });
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setReference("PRMT-" + Math.random().toString(36).toUpperCase().slice(2, 10));
    setSubmitted(true);
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={submit} className="bg-white border border-su-gray-100 rounded-lg p-6 shadow-card space-y-4">
        <Select
          label="Permit Type"
          options={permitTypes}
          value={form.type}
          onChange={(e) => update("type", e.target.value)}
        />
        <Input
          label="Applicant Full Name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
        <Input
          label="Contact Email or Phone"
          value={form.contact}
          onChange={(e) => update("contact", e.target.value)}
          required
        />
        <Input
          label="Site / Premises Address"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-su-gray-700">Description of Works / Activity</label>
          <textarea
            className="border border-su-gray-200 rounded px-3 py-2 text-sm text-su-gray-900 bg-white w-full focus:outline-none focus:ring-2 focus:ring-su-blue focus:border-su-blue transition-colors min-h-[100px] resize-none"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={!form.name || !form.address || !form.contact || !form.description}>
          Submit Application
        </Button>
      </form>

      <Modal isOpen={submitted} onClose={() => setSubmitted(false)} title="Application Submitted">
        <div className="space-y-3">
          <p>Your permit application has been received and assigned to the relevant district authority for review.</p>
          <div className="bg-su-blue-pale rounded p-3 text-center">
            <p className="text-xs text-su-gray-500 mb-1">Application Reference</p>
            <p className="font-mono font-bold text-su-blue text-lg">{reference}</p>
          </div>
          <p>Processing time is typically 10–20 business days. You will be contacted at the details provided with a decision or request for further information.</p>
        </div>
      </Modal>
    </div>
  );
}
