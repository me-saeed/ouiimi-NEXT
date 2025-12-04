"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CartItem {
  serviceId: string;
  businessId: string;
  serviceName: string;
  businessName: string;
  logo?: string;
  date: string;
  time: string;
  staffId?: string;
  staffName?: string;
  baseCost: number;
  addOns: Array<{ name: string; cost: number }>;
  totalCost: number;
  address: string;
  description?: string;
}

export default function CartPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);


  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing cart:", e);
      }
    }
    setIsLoading(false);
  }, []);

  const calculateTotals = () => {
    const totalCost = cartItems.reduce((sum, item) => sum + item.totalCost, 0);
    const deposit = Math.round(totalCost * 0.1 * 100) / 100;
    const ouiimiFee = 1.99;
    const totalToday = deposit + ouiimiFee;
    const remainingAmount = totalCost - deposit;

    return {
      totalCost,
      deposit,
      ouiimiFee,
      totalToday,
      remainingAmount,
    };
  };

  const handleRemoveItem = (index: number) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleBookNow = async () => {
    if (!user) {
      router.push("/signin");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const userId = user.id || user._id;

      // Group items by business (can only checkout from one business at a time)
      const businessGroups: Record<string, CartItem[]> = {};
      cartItems.forEach((item) => {
        if (!businessGroups[item.businessId]) {
          businessGroups[item.businessId] = [];
        }
        businessGroups[item.businessId].push(item);
      });

      const businessIds = Object.keys(businessGroups);
      if (businessIds.length > 1) {
        setError("You can only checkout services from one business at a time. Please remove items from other businesses.");
        setIsProcessing(false);
        return;
      }

      // Create bookings for all items

      const bookings = await Promise.all(
        cartItems.map(async (item, index) => {


          // Parse time - format is "HH:MM - HH:MM" or "HH:MM-HH:MM"
          const timeRange = item.time.trim();
          const [startTime, endTime] = timeRange.includes(" - ")
            ? timeRange.split(" - ")
            : timeRange.split("-");

          const bookingPayload = {
            userId: userId,
            businessId: item.businessId,
            serviceId: item.serviceId,
            staffId: item.staffId || undefined,
            timeSlot: {
              date: item.date,
              startTime: startTime.trim(),
              endTime: endTime.trim(),
            },
            addOns: item.addOns || [],
            totalCost: item.totalCost,
            customerNotes: item.description || undefined,
          };



          const response = await fetch("/api/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(bookingPayload),
          });

          const responseData = await response.json();

          if (!response.ok) {
            console.error(`Failed to create booking ${index + 1}:`, responseData);
            throw new Error(responseData.error || responseData.details || "Failed to create booking");
          }

          return responseData;
        })
      );



      // Clear cart
      localStorage.removeItem("cart");
      setCartItems([]);

      // Redirect to first booking confirmation page
      if (bookings.length > 0 && bookings[0].booking?.id) {
        router.push(`/bookings/${bookings[0].booking.id}/confirm`);
      } else {
        router.push("/profile?success=true");
      }
    } catch (err: any) {
      console.error("Error creating bookings:", err);
      setError(err.message || "Failed to complete booking. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const totals = calculateTotals();

  if (isLoading) {
    return (
      <PageLayout user={user}>
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user}>
      <div className="bg-background min-h-screen py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Cart</h1>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {cartItems.length === 0 ? (
            <div className="card-polished p-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
              <Button onClick={() => router.push("/")} className="btn-polished-primary">
                Browse Services
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="card-polished p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {item.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.logo}
                            alt={item.businessName}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xl font-bold text-primary">
                              {item.businessName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.businessName}</h3>
                          <p className="text-sm text-muted-foreground">{item.serviceName}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 text-xl font-bold"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{item.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span>{item.time}</span>
                      </div>
                      {item.staffName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Staff:</span>
                          <span>{item.staffName}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Address:</span>
                        <span className="text-right">{item.address}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Cost:</span>
                        <span>${item.baseCost.toFixed(2)}</span>
                      </div>
                      {item.addOns && item.addOns.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Add-Ons:</p>
                          {item.addOns.map((addon, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{addon.name}</span>
                              <span>${addon.cost.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Service Total:</span>
                        <span>${item.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Payment Breakdown */}
                <div className="card-polished p-6">
                  <h2 className="text-xl font-semibold mb-4">Payment Breakdown</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span>${totals.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>10% Deposit:</span>
                      <span>${totals.deposit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ouiimi Fee:</span>
                      <span>${totals.ouiimiFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2 text-lg">
                      <span>Total Today:</span>
                      <span>${totals.totalToday.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      10% Deposit + $1.99 ouiimi fee paid today, 90% paid directly to Business
                    </p>
                  </div>
                </div>

              </div>

              {/* Book Now Button */}
              <div className="lg:col-span-1">
                <div className="card-polished p-6 space-y-4 sticky top-4">
                  <h2 className="text-xl font-semibold mb-4">Complete Booking</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    For now, bookings can be made without payment. Payment integration will be added in production.
                  </p>
                  <Button
                    onClick={handleBookNow}
                    disabled={isProcessing}
                    className="w-full btn-polished-primary h-12 text-lg font-semibold"
                  >
                    {isProcessing ? "Processing..." : "Book Now"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

