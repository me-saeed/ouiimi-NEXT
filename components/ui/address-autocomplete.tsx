"use client";

import { Controller, Control, FieldValues, Path, UseFormSetValue } from "react-hook-form";
import GooglePlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "react-google-places-autocomplete";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onSelect?: (address: string, coordinates?: { lat: number; lng: number }) => void;
  // For service forms that need object format with coordinates
  returnObject?: boolean; // If true, returns { street, location: { type: "Point", coordinates: [lng, lat] } }
  setValue?: UseFormSetValue<T>; // Required if returnObject is true
}

export function AddressAutocomplete<T extends FieldValues>({
  control,
  name,
  placeholder = "Enter address",
  className,
  error,
  disabled = false,
  required = false,
  onSelect,
  returnObject = false,
  setValue,
}: AddressAutocompleteProps<T>) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("Google Maps API key not found. Address autocomplete will not work.");
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value, onBlur } }) => {
        // Determine current display value
        const displayValue = returnObject 
          ? (value?.street ? { label: value.street, value: value.street } : null)
          : (typeof value === 'string' && value ? { label: value, value: value } : null);
        
        return (
          <div className="w-full">
            {apiKey ? (
              <GooglePlacesAutocomplete
                apiKey={apiKey}
                selectProps={{
                  value: displayValue,
                  onChange: async (place: any) => {
                    if (place) {
                      const address = place.label || place.description || place.formatted_address;
                      
                      // Get coordinates
                      try {
                        const results = await geocodeByAddress(address);
                        const coordinates = await getLatLng(results[0]);
                        
                        // Set address value - either string or object with street and location
                        if (returnObject && setValue) {
                          // For service forms, set as object with coordinates
                          const addressObject = {
                            street: address,
                            location: {
                              type: "Point" as const,
                              coordinates: [coordinates.lng, coordinates.lat] as [number, number], // [longitude, latitude]
                            },
                          };
                          onChange(addressObject);
                          setValue(name, addressObject as any);
                        } else {
                          // For other forms, set as string
                          onChange(address);
                        }
                        
                        // Call onSelect callback if provided
                        if (onSelect) {
                          onSelect(address, coordinates);
                        }
                      } catch (err) {
                        console.error("Error getting coordinates:", err);
                        // Still set address even if geocoding fails
                        if (returnObject && setValue) {
                          const addressObject = {
                            street: address,
                            location: {
                              type: "Point" as const,
                              coordinates: [0, 0] as [number, number], // Default fallback
                            },
                          };
                          onChange(addressObject);
                          setValue(name, addressObject as any);
                        } else {
                          onChange(address);
                        }
                      }
                    } else {
                      if (returnObject && setValue) {
                        const emptyAddress = { street: "", location: { type: "Point" as const, coordinates: [0, 0] as [number, number] } };
                        onChange(emptyAddress);
                        setValue(name, emptyAddress as any);
                      } else {
                        onChange("");
                      }
                    }
                  },
                onBlur,
                placeholder,
                isDisabled: disabled,
                isClearable: true,
                isSearchable: true,
                filterOption: null, // Allow any input
                onInputChange: (inputValue: string) => {
                  // Allow manual typing - update value as user types
                  if (returnObject && setValue && inputValue) {
                    const addressObject = {
                      street: inputValue,
                      location: {
                        type: "Point" as const,
                        coordinates: [0, 0] as [number, number],
                      },
                    };
                    onChange(addressObject);
                    setValue(name, addressObject as any);
                  } else if (!returnObject && inputValue) {
                    onChange(inputValue);
                  }
                },
                styles: {
                  control: (provided, state) => ({
                    ...provided,
                    minHeight: "48px",
                    borderColor: error
                      ? "#ef4444"
                      : state.isFocused
                      ? "#EECFD1"
                      : "#E5E5E5",
                    boxShadow: state.isFocused
                      ? error
                        ? "0 0 0 2px rgba(239, 68, 68, 0.2)"
                        : "0 0 0 2px rgba(238, 207, 209, 0.2)"
                      : "none",
                    "&:hover": {
                      borderColor: error ? "#ef4444" : "#EECFD1",
                    },
                  }),
                  input: (provided) => ({
                    ...provided,
                    padding: "8px 12px",
                    fontSize: "14px",
                    color: "#3A3A3A",
                  }),
                  placeholder: (provided) => ({
                    ...provided,
                    color: "#888888",
                  }),
                  menu: (provided) => ({
                    ...provided,
                    borderRadius: "8px",
                    border: "1px solid #E5E5E5",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    zIndex: 9999,
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isSelected
                      ? "#EECFD1"
                      : state.isFocused
                      ? "#F5F5F5"
                      : "white",
                    color: state.isSelected ? "#3A3A3A" : "#3A3A3A",
                    padding: "12px",
                    cursor: "pointer",
                    "&:active": {
                      backgroundColor: "#EECFD1",
                    },
                  }),
                },
                className: cn(
                  "w-full",
                  className
                ),
              }}
            />
          ) : (
            <input
              type="text"
              value={returnObject ? (value?.street || "") : (typeof value === 'string' ? value : "")}
              onChange={(e) => {
                if (returnObject && setValue) {
                  const addressObject = {
                    street: e.target.value,
                    location: {
                      type: "Point" as const,
                      coordinates: [0, 0] as [number, number],
                    },
                  };
                  onChange(addressObject);
                  setValue(name, addressObject as any);
                } else {
                  onChange(e.target.value);
                }
              }}
              onBlur={onBlur}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              className={cn(
                "flex h-12 w-full rounded-lg border px-4 py-2 text-sm",
                "bg-background ring-offset-background",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "transition-all duration-200 hover:border-primary/20",
                error
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-input focus-visible:border-[#EECFD1]",
                className
              )}
            />
          )}
          {error && (
            <p className="text-red-500 text-sm mt-1.5">{error}</p>
          )}
        </div>
      );
      }}
    />
  );
}
