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
    name: "",
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
            name: data.bankDetails.name || "",
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
        const errorMessage = data.details
          ? Object.values(data.details).map((e: any) => e.message).join(", ")
          : data.error || "Failed to save bank details";
        setError(errorMessage);
      }
    } catch (e) {
      console.error("Error saving bank details:", e);
      setError("Failed to save bank details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business Details */}
        <div className="space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-[#3A3A3A]">Business Details</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/business/profile/edit")}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            >
              Edit
            </Button>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="space-y-2 pb-4 border-b border-gray-100">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">NAME</label>
              <p className="text-lg font-bold text-[#3A3A3A]">{business?.businessName || "-"}</p>
            </div>
            <div className="space-y-2 pb-4 border-b border-gray-100">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">EMAIL</label>
              <p className="text-lg font-bold text-[#3A3A3A] break-words">{business?.email || "-"}</p>
            </div>
            <div className="space-y-2 pb-4 border-b border-gray-100">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PHONE</label>
              <p className="text-lg font-bold text-[#3A3A3A]">{business?.phone || "-"}</p>
            </div>
            <div className="space-y-2 pb-4 border-b border-gray-100">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ADDRESS</label>
              <p className="text-lg font-bold text-[#3A3A3A]">{business?.address || "-"}</p>
            </div>
            {business?.story && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">STORY</label>
                <p className="text-base font-medium text-[#3A3A3A] leading-relaxed">{business.story}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-[#3A3A3A] pb-3 border-b border-gray-200">Bank Details</h2>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#3A3A3A]">Account Name</label>
              <Input
                placeholder="e.g. Business Name Pty Ltd"
                value={bankDetails.name}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, name: e.target.value })
                }
                className="h-12 rounded-xl border-gray-300 bg-white focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#3A3A3A]">BSB</label>
                <Input
                  placeholder="000-000"
                  value={bankDetails.bsb}
                  onChange={(e) => setBankDetails({ ...bankDetails, bsb: e.target.value })}
                  className="h-12 rounded-xl border-gray-300 bg-white focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#3A3A3A]">Account Number</label>
                <Input
                  placeholder="0000 0000"
                  value={bankDetails.accountNumber}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                  }
                  className="h-12 rounded-xl border-gray-300 bg-white focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#3A3A3A]">Contact Number</label>
              <Input
                placeholder="Your contact number"
                value={bankDetails.contactNumber}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, contactNumber: e.target.value })
                }
                className="h-12 rounded-xl border-gray-300 bg-white focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all shadow-sm"
              />
            </div>
            <Button
              className="w-full h-12 rounded-xl bg-[#3A3A3A] text-white hover:bg-[#2a2a2a] font-semibold transition-all shadow-md hover:shadow-lg mt-2"
              onClick={handleSaveBankDetails}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                  Saving...
                </>
              ) : (
                "Save Bank Details"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
