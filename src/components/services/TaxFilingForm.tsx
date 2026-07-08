"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Modal from "@/components/ui/Modal";

const filingStatuses = [
  { value: "single", label: "Single" },
  { value: "married-joint", label: "Married — Filing Jointly" },
  { value: "married-separate", label: "Married — Filing Separately" },
  { value: "head-of-household", label: "Head of Household" },
];

function calcTax(income: number, deductions: number, status: string): number {
  const taxable = Math.max(0, income - deductions - (status === "married-joint" ? 4800 : 2400));
  if (taxable <= 24000) return taxable * 0.12;
  if (taxable <= 55000) return 24000 * 0.12 + (taxable - 24000) * 0.22;
  if (taxable <= 110000) return 24000 * 0.12 + 31000 * 0.22 + (taxable - 55000) * 0.32;
  return 24000 * 0.12 + 31000 * 0.22 + 55000 * 0.32 + (taxable - 110000) * 0.42;
}

export default function TaxFilingForm() {
  const [income, setIncome] = useState("");
  const [deductions, setDeductions] = useState("0");
  const [status, setStatus] = useState("single");
  const [result, setResult] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");

  function calculate() {
    setResult(calcTax(Number(income), Number(deductions), status));
  }

  function submit() {
    setReference("TAX-" + new Date().getFullYear() + "-" + Math.random().toString(36).toUpperCase().slice(2, 8));
    setSubmitted(true);
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="bg-white border border-su-gray-100 rounded-lg p-6 shadow-card space-y-4">
        <h2 className="font-semibold text-su-navy">Tax Year 2025</h2>
        <Input
          label="Annual Gross Income (€)"
          type="number"
          value={income}
          onChange={(e) => { setIncome(e.target.value); setResult(null); }}
          placeholder="e.g. 48000"
        />
        <Input
          label="Total Allowable Deductions (€)"
          type="number"
          value={deductions}
          onChange={(e) => { setDeductions(e.target.value); setResult(null); }}
          placeholder="e.g. 3200"
          hint="Include pension contributions, charitable donations, and approved expenses."
        />
        <Select
          label="Filing Status"
          options={filingStatuses}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setResult(null); }}
        />
        <Button onClick={calculate} disabled={!income} variant="outline">
          Calculate Estimated Tax
        </Button>
      </div>

      {result !== null && (
        <Alert type="info" title="Estimated Tax Liability">
          <div className="mt-2 space-y-1">
            <div className="flex justify-between"><span>Gross income:</span><strong>€{Number(income).toLocaleString()}</strong></div>
            <div className="flex justify-between"><span>Deductions:</span><strong>€{Number(deductions).toLocaleString()}</strong></div>
            <div className="flex justify-between text-lg font-bold border-t border-su-blue/20 pt-2 mt-2">
              <span>Estimated tax due:</span><span>€{result.toFixed(2)}</span>
            </div>
          </div>
          <Button className="mt-4" onClick={submit}>Submit Tax Filing</Button>
        </Alert>
      )}

      <Modal isOpen={submitted} onClose={() => setSubmitted(false)} title="Tax Filing Submitted">
        <div className="space-y-3">
          <p>Your 2025 tax return has been successfully submitted to the Ministry of Finance.</p>
          <div className="bg-su-blue-pale rounded p-3 text-center">
            <p className="text-xs text-su-gray-500 mb-1">Reference Number</p>
            <p className="font-mono font-bold text-su-blue text-lg">{reference}</p>
          </div>
          <p>You will receive a formal assessment notice within 30 days. If tax is owed, payment is due by 31 October 2026.</p>
        </div>
      </Modal>
    </div>
  );
}
