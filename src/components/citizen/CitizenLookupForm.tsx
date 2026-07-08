"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import { findCitizenById } from "@/data/citizens";
import { formatDate } from "@/lib/utils";
import type { Citizen } from "@/types";

export default function CitizenLookupForm() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Citizen | null | undefined>(undefined);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setResult(findCitizenById(query.trim()) ?? null);
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          label="Citizen ID"
          placeholder="e.g. SU-00045812"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          hint="Enter your Citizen ID in the format SU-XXXXXXXX"
          className="flex-1"
        />
        <Button type="submit" className="mt-6" disabled={!query.trim()}>
          Search
        </Button>
      </form>

      {result === null && (
        <Alert type="error" className="mt-4" title="Not found">
          No citizen record found for <strong>{query}</strong>. Please check the ID and try again.
        </Alert>
      )}

      {result && (
        <div className="mt-6 bg-white border border-su-gray-100 rounded-lg p-6 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-su-navy">
                {result.firstName} {result.lastName}
              </h3>
              <p className="text-sm font-mono text-su-gray-500 mt-0.5">{result.id}</p>
            </div>
            <Badge variant={result.status} className="capitalize">{result.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-su-gray-500">Date of Birth</p>
              <p className="font-medium text-su-gray-900">{formatDate(result.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-su-gray-500">District</p>
              <p className="font-medium text-su-gray-900">{result.district}</p>
            </div>
            <div>
              <p className="text-su-gray-500">Registration Date</p>
              <p className="font-medium text-su-gray-900">{formatDate(result.registrationDate)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
