"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

interface DetailsTabProps {
  business: any;
}

export function DetailsTab({ business }: DetailsTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    bsb: "",
    accountNumber: "",
    contactNumber: "",
  });

  useEffect(() => {
    if (business?.id || business?._id) {
      loadBankDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const loadBankDetails = async () => {
    if (!business?.id && !business?._id) return;

    try {
      const token = localStorage.getItem("token");
      const businessId = business.id || business._id;

      const response = await fetch(`/api/business/${businessId}/bank-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.bankDetails) {
          setBankDetails({
            accountName: data.bankDetails.accountName || "",
            bsb: data.bankDetails.bsb || "",
            accountNumber: data.bankDetails.accountNumber || "",
            contactNumber: data.bankDetails.contactNumber || "",
          });
        }
      }
    } catch (e) {
      console.error("Error loading bank details:", e);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!business?.id && !business?._id) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const businessId = business.id || business._id;

      const response = await fetch(`/api/business/${businessId}/bank-details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankDetails),
      });

      if (response.ok) {
        setSuccess("Bank details saved successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save bank details");
      }
    } catch (e) {
      console.error("Error saving bank details:", e);
      setError("Failed to save bank details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {error && (
        <Alert variant="destructive" className="md:col-span-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200 md:col-span-2">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Business Details */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Business Details</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/business/profile/edit")}
          >
            Edit
          </Button>
        </div>
        <div className="card-polished p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Name</label>
            <p className="font-medium">{business?.businessName || "-"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
            <p className="font-medium">{business?.email || "-"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Phone</label>
            <p className="font-medium">{business?.phone || "-"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Address</label>
            <p className="font-medium">{business?.address || "-"}</p>
          </div>
          {business?.story && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Story</label>
              <p className="font-medium">{business.story}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Bank Details</h2>
        <div className="card-polished p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Account Name</label>
            <Input
              placeholder="e.g. Business Name Pty Ltd"
              value={bankDetails.accountName}
              onChange={(e) =>
                setBankDetails({ ...bankDetails, accountName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">BSB</label>
            <Input
              placeholder="000-000"
              value={bankDetails.bsb}
              onChange={(e) => setBankDetails({ ...bankDetails, bsb: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Account Number</label>
            <Input
              placeholder="0000 0000"
              value={bankDetails.accountNumber}
              onChange={(e) =>
                setBankDetails({ ...bankDetails, accountNumber: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Number</label>
            <Input
              placeholder="Your contact number"
              value={bankDetails.contactNumber}
              onChange={(e) =>
                setBankDetails({ ...bankDetails, contactNumber: e.target.value })
              }
            />
          </div>
          <Button
            className="w-full mt-4 btn-polished-primary"
            onClick={handleSaveBankDetails}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Bank Details"}
          </Button>
        </div>
      </div>
    </div>
  );
}
