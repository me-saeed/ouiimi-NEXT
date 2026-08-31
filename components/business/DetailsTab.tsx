"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { renderAddress } from "@/lib/utils";

interface DetailsTabProps {
  business: any;
  onBusinessUpdated?: () => void;
}

export function DetailsTab({ business, onBusinessUpdated }: DetailsTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const [bankDetails, setBankDetails] = useState({
    name: "",
    bsb: "",
    accountNumber: "",
    contactNumber: "",
  });

  const [editData, setEditData] = useState({
    businessName: "",
    email: "",
    phone: "",
    address: "",
    story: "",
  });

  useEffect(() => {
    if (business?.id || business?._id) {
      loadBankDetails();
      setEditData({
        businessName: business.businessName || "",
        email: business.email || "",
        phone: business.phone || "",
        address: typeof business.address === 'string' ? business.address : business.address?.street || "",
        story: business.story || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const loadBankDetails = async () => {
    if (!business?.id && !business?._id) return;

    try {
      const businessId = business.id || business._id;

      const response = await fetch(`/api/business/${businessId}/bank-details`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
      const businessId = business.id || business._id;

      const response = await fetch(`/api/business/${businessId}/bank-details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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

  const handleSaveBusinessDetails = async () => {
    if (!business?.id && !business?._id) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const businessId = business.id || business._id;

      const response = await fetch(`/api/business/${businessId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          businessName: editData.businessName,
          email: editData.email,
          phone: editData.phone,
          address: editData.address,
          story: editData.story,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to update business details");
        return;
      }

      setSuccess("Business details updated successfully");
      setIsEditing(false);

      if (onBusinessUpdated) {
        onBusinessUpdated();
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      console.error("Error updating business details:", e);
      setError("Failed to update business details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      businessName: business.businessName || "",
      email: business.email || "",
      phone: business.phone || "",
      address: typeof business.address === 'string' ? business.address : business.address?.street || "",
      story: business.story || "",
    });
    setIsEditing(false);
    setError("");
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
        <div className="space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] mx-auto text-center">Details</h2>

          <div className="border border-gray-200 rounded-[24px] p-8 shadow-sm bg-white max-w-lg mx-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-6">
              <h3 className="text-base md:text-lg font-medium text-[#3A3A3A]">Business</h3>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-gray-600 hover:text-gray-900 border-gray-300 rounded-lg px-4"
                >
                  Edit
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-[80px_1fr] items-baseline gap-4">
                <span className="text-sm text-gray-500 text-right">Name:</span>
                {isEditing ? (
                  <Input
                    value={editData.businessName}
                    onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                    className="h-9 rounded-lg text-sm"
                  />
                ) : (
                  <span className="text-sm text-[#3A3A3A]">{business?.businessName || "-"}</span>
                )}
              </div>

              <div className="grid grid-cols-[80px_1fr] items-baseline gap-4">
                <span className="text-sm text-gray-500 text-right">Email:</span>
                {isEditing ? (
                  <Input
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    type="email"
                    className="h-9 rounded-lg text-sm"
                  />
                ) : (
                  <span className="text-sm text-[#3A3A3A] break-all">{business?.email || "-"}</span>
                )}
              </div>

              <div className="grid grid-cols-[80px_1fr] items-baseline gap-4">
                <span className="text-sm text-gray-500 text-right">Number:</span>
                {isEditing ? (
                  <Input
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    type="tel"
                    className="h-9 rounded-lg text-sm"
                  />
                ) : (
                  <span className="text-sm text-[#3A3A3A]">{business?.phone || "-"}</span>
                )}
              </div>

              <div className="grid grid-cols-[80px_1fr] items-baseline gap-4">
                <span className="text-sm text-gray-500 text-right">Address:</span>
                {isEditing ? (
                  <Input
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="h-9 rounded-lg text-sm"
                  />
                ) : (
                  <span className="text-sm text-[#3A3A3A]">{renderAddress(business?.address) || "-"}</span>
                )}
              </div>

              <div className="grid grid-cols-[80px_1fr] items-start gap-4">
                <span className="text-sm text-gray-500 text-right">Story:</span>
                {isEditing ? (
                  <textarea
                    value={editData.story}
                    onChange={(e) => setEditData({ ...editData, story: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] resize-none"
                  />
                ) : (
                  <span className="text-sm text-[#3A3A3A]">{business?.story || "-"}</span>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleSaveBusinessDetails}
                  disabled={isLoading}
                  className="flex-1 bg-[#3A3A3A] text-white hover:bg-[#2a2a2a] rounded-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="flex-1 border-gray-300 rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-5">
          <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] pb-3 border-b border-gray-200">Bank Details</h2>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#3A3A3A]">Account Name</label>
              <Input
                placeholder="e.g. Business Name Pty Ltd"
                value={bankDetails.name}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, name: e.target.value })
                }
                className="h-10 md:h-12 rounded-xl border-gray-300 bg-white focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all shadow-sm text-sm md:text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#3A3A3A]">BSB</label>
                <Input
                  placeholder="000-000"
                  value={bankDetails.bsb}
                  onChange={(e) => setBankDetails({ ...bankDetails, bsb: e.target.value })}
                  className="h-10 md:h-12 rounded-xl border-gray-300 bg-white focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all shadow-sm text-sm md:text-base"
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
                  className="h-10 md:h-12 rounded-xl border-gray-300 bg-white focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all shadow-sm text-sm md:text-base"
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
                className="h-10 md:h-12 rounded-xl border-gray-300 bg-white focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all shadow-sm text-sm md:text-base"
              />
            </div>
            <Button
              className="w-full h-10 md:h-12 rounded-xl bg-[#3A3A3A] text-white hover:bg-[#2a2a2a] text-sm md:text-base font-semibold transition-all shadow-md hover:shadow-lg mt-2"
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
