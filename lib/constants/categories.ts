/**
 * Service Categories & Subcategories
 * Complete list of all service categories, subcategories, service types, and add-ons
 */

export interface ServiceType {
    name: string;
    description?: string;
}

export interface SubCategory {
    name: string;
    slug: string;
    services: string[];
    addOns?: string[];
}

export interface Category {
    name: string;
    slug: string;
    description?: string;
    subcategories: Record<string, SubCategory>;
}

export const SERVICE_CATEGORIES: Record<string, Category> = {
    HAIR: {
        name: "Hair Services",
        slug: "hair",
        description: "Professional hair cutting, styling, coloring, and treatments",
        subcategories: {
            HAIRCUTS: {
                name: "Haircuts & Restyles",
                slug: "haircuts",
                services: [
                    "Women's Cut – Short (above shoulders)",
                    "Women's Cut – Medium (shoulder to mid-back)",
                    "Women's Cut – Long (below mid-back / thick)",
                    "Restyle Cut (major change)",
                    "Men's Cut",
                    "Children's Cut",
                    "Fringe / Bang Trim",
                    "Clipper Cut / Fade",
                ],
                addOns: [
                    "Scalp Massage",
                    "Hydration/Repair Mask",
                    "Toner",
                    "Olaplex/Bonding Treatment",
                    "Extra Blow-Dry",
                ],
            },
            STYLING: {
                name: "Styling & Finishing",
                slug: "styling",
                services: [
                    "Blow-Dry – Short Hair",
                    "Blow-Dry – Medium Hair",
                    "Blow-Dry – Long/Thick Hair",
                    "Straighten / Flat Iron Finish",
                    "Curls / Waves",
                    "Updo / Occasion Style",
                    "Braids (Simple / Detailed)",
                ],
                addOns: [
                    "Hot Tool Styling",
                    "Braiding",
                    "Occasion Finish",
                ],
            },
            COLOUR: {
                name: "Colour & Highlights",
                slug: "colour",
                services: [
                    "Root Touch-Up / Regrowth Colour",
                    "All-Over Colour – Short",
                    "All-Over Colour – Medium",
                    "All-Over Colour – Long/Thick",
                    "Foils / Highlights – 1/4 Head",
                    "Foils / Highlights – 1/2 Head",
                    "Foils / Highlights – Full Head",
                    "Balayage / Ombre",
                    "Toner / Gloss Refresh",
                    "Colour Correction (by consultation)",
                    "Scalp Bleach & Tone",
                ],
                addOns: [
                    "Extra Colour Bowl",
                    "Root Shadow/Blend",
                    "Gloss Refresh",
                    "Colour Lock Treatment",
                ],
            },
            CHEMICAL: {
                name: "Chemical & Texture Services",
                slug: "chemical",
                services: [
                    "Keratin / Brazilian Smoothing",
                    "Permanent Straightening / Relaxer",
                    "Perm (Short Hair)",
                    "Perm (Long Hair)",
                    "Bond Treatment (Olaplex / K18 / Similar)",
                ],
            },
            EXTENSIONS: {
                name: "Extensions",
                slug: "extensions",
                services: [
                    "Tape-In Extensions (Apply)",
                    "Tape-In Extensions (Remove)",
                    "Tape-In Extensions (Reapply)",
                    "Clip-In Extension Styling",
                    "Micro-Bead / Weft Application",
                    "Extension Removal Only",
                ],
            },
            TREATMENTS: {
                name: "Treatments (In-Salon Care)",
                slug: "treatments",
                services: [
                    "Deep Conditioning Treatment",
                    "Scalp Detox / Scalp Treatment",
                    "Moisture / Protein Mask",
                    "Bond Repair Treatment (stand-alone)",
                ],
            },
            BRIDAL: {
                name: "Bridal & Event Packages",
                slug: "bridal",
                services: [
                    "Bridal Hair Trial",
                    "Bridal Hair (Wedding Day)",
                    "Bridesmaids / Bridal Party Hair",
                    "Event Glam Styling (formal, photoshoot, etc.)",
                    "On-Site Styling (Travel Fee applies)",
                ],
            },
        },
    },

    NAILS: {
        name: "Nails",
        slug: "nails",
        description: "Professional nail care, manicures, pedicures, and nail art",
        subcategories: {
            MANICURE: {
                name: "Manicure",
                slug: "manicure",
                services: [
                    "Manicure – Classic",
                    "Manicure – Gel/Shellac",
                    "Manicure – Deluxe (spa, exfoliation, massage)",
                ],
                addOns: [
                    "Nail Art",
                    "French Tip",
                    "Gel Polish Upgrade",
                    "Paraffin Wax",
                    "Cuticle Treatment",
                ],
            },
            PEDICURE: {
                name: "Pedicure",
                slug: "pedicure",
                services: [
                    "Pedicure – Classic",
                    "Pedicure – Gel/Shellac",
                    "Pedicure – Deluxe (spa, exfoliation, massage)",
                ],
                addOns: [
                    "Nail Art",
                    "French Tip",
                    "Gel Polish Upgrade",
                    "Paraffin Wax",
                    "Cuticle Treatment",
                ],
            },
            EXTENSIONS: {
                name: "Nail Extensions",
                slug: "extensions",
                services: [
                    "Acrylic Extensions – Full Set",
                    "Acrylic Infill / Refill",
                    "SNS / Dip Powder – Full Set",
                    "SNS / Dip Powder – Infill",
                ],
                addOns: [
                    "Nail Art",
                    "French Tip",
                ],
            },
        },
    },

    BEAUTY: {
        name: "Beauty & Brows",
        slug: "beauty",
        description: "Eyebrow shaping, lash treatments, waxing, and facial hair removal",
        subcategories: {
            BROWS: {
                name: "Brows & Lashes",
                slug: "brows",
                services: [
                    "Eyebrow Shape / Wax / Thread",
                    "Eyebrow Tint",
                    "Lash Tint",
                    "Lash Lift & Tint Combo",
                    "Brow Lamination",
                    "Brow Henna / Hybrid Tint",
                ],
                addOns: [
                    "Brow Tint",
                    "Lash Tint",
                ],
            },
            WAXING: {
                name: "Waxing",
                slug: "waxing",
                services: [
                    "Facial Waxing (lip, chin, sides)",
                    "Full Face Waxing",
                    "Underarm Wax",
                    "Arm Wax",
                    "Leg Wax – Half",
                    "Leg Wax – Full",
                    "Bikini Wax",
                    "Brazilian Wax",
                ],
                addOns: [
                    "Quick Facial",
                    "Lip/Chin wax",
                ],
            },
        },
    },

    MASSAGE: {
        name: "Massage & Wellness",
        slug: "massage",
        description: "Therapeutic massage, relaxation, and wellness treatments",
        subcategories: {
            MASSAGE: {
                name: "Massage Therapy",
                slug: "massage",
                services: [
                    "Relaxation / Swedish Massage (30 mins)",
                    "Relaxation / Swedish Massage (60 mins)",
                    "Relaxation / Swedish Massage (90 mins)",
                    "Remedial / Deep Tissue Massage (30 mins)",
                    "Remedial / Deep Tissue Massage (60 mins)",
                    "Remedial / Deep Tissue Massage (90 mins)",
                    "Hot Stone Massage",
                    "Aromatherapy Massage",
                    "Pregnancy Massage",
                    "Reflexology (Feet)",
                    "Indian Head / Scalp Massage",
                ],
                addOns: [
                    "Hot Stones",
                    "Aromatherapy Oils",
                    "Extra 15mins",
                    "Cupping",
                ],
            },
        },
    },

    SKIN: {
        name: "Skin & Facial",
        slug: "skin",
        description: "Professional facials, skin treatments, and anti-aging therapies",
        subcategories: {
            FACIALS: {
                name: "Facials",
                slug: "facials",
                services: [
                    "Express Facial (30 mins)",
                    "Classic / Deep Cleanse Facial (60 mins)",
                    "Hydrating Facial",
                    "Anti-Ageing Facial",
                    "Acne / Problem Skin Facial",
                    "Microdermabrasion",
                    "LED Light Therapy",
                    "Chemical Peel",
                ],
                addOns: [
                    "Collagen / Firming Mask",
                    "Extraction",
                ],
            },
        },
    },

    DOG_GROOMING: {
        name: "Dog Grooming",
        slug: "dog-grooming",
        description: "Professional dog grooming, bathing, styling, and pet care",
        subcategories: {
            BATHING: {
                name: "Bathing & Cleaning",
                slug: "bathing",
                services: [
                    "Basic Wash",
                    "Wash & Dry",
                    "Flea/Tick Wash",
                    "De-shedding Wash",
                ],
            },
            HAIRCUTS: {
                name: "Haircuts & Styling",
                slug: "haircuts",
                services: [
                    "Full Groom",
                    "Breed-Specific Groom",
                    "Puppy Groom",
                    "Partial Groom (Face, Feet, Sanitary Trim)",
                ],
            },
            COAT: {
                name: "Coat & Skin Care",
                slug: "coat",
                services: [
                    "De-shedding Treatment",
                    "Coat Conditioning",
                    "Medicated Bath",
                ],
            },
            NAILS: {
                name: "Nails & Paws",
                slug: "nails",
                services: [
                    "Nail Trim",
                    "Nail Grind",
                    "Paw Pad Trim",
                    "Paw Balm Treatment",
                ],
            },
            HYGIENE: {
                name: "Ears, Eyes & Teeth",
                slug: "hygiene",
                services: [
                    "Ear Cleaning",
                    "Tear Stain Clean",
                    "Teeth Brushing",
                ],
            },
            ADDONS: {
                name: "Add-Ons",
                slug: "addons",
                services: [],
                addOns: [
                    "Anal Gland Expression",
                    "Extra Time for Large/Double-Coated Dogs",
                    "Flea/Tick Treatment",
                    "Bow/Bandana + Cologne Finish",
                ],
            },
        },
    },

    MAKEUP: {
        name: "Makeup Services",
        slug: "makeup",
        description: "Professional makeup application for events, bridal, and everyday looks",
        subcategories: {
            MAKEUP: {
                name: "Makeup Application",
                slug: "makeup",
                services: [
                    "Full Makeup Application",
                    "Natural/Everyday Makeup",
                    "Glam/Event Makeup",
                    "Bridal Makeup",
                    "Bridesmaid Makeup",
                    "Photoshoot Makeup",
                    "Makeup Trial",
                    "Teen/School Formal Makeup",
                    "Men's Grooming Makeup",
                    "Makeup Lesson / Tutorial",
                ],
                addOns: [
                    "Lashes (strip or individual)",
                    "Airbrush finish",
                    "Touch-up kit",
                    "Early morning / travel fee",
                ],
            },
        },
    },
};

// Helper functions for easy access
export const getAllCategories = () => {
    return Object.values(SERVICE_CATEGORIES);
};

export const getCategoryBySlug = (slug: string) => {
    return Object.values(SERVICE_CATEGORIES).find((cat) => cat.slug === slug);
};

export const getSubcategoriesByCategory = (categorySlug: string) => {
    const category = getCategoryBySlug(categorySlug);
    return category ? Object.values(category.subcategories) : [];
};

export const getServicesBySubcategory = (
    categorySlug: string,
    subcategorySlug: string
) => {
    const category = getCategoryBySlug(categorySlug);
    if (!category) return [];

    const subcategory = Object.values(category.subcategories).find(
        (sub) => sub.slug === subcategorySlug
    );
    return subcategory?.services || [];
};

// Get category name from slug (for display)
export const getCategoryName = (slug: string): string => {
    const category = getCategoryBySlug(slug);
    return category?.name || slug;
};

// Flatten all categories for dropdown
export const getCategoryOptions = () => {
    return getAllCategories().map((cat) => ({
        value: cat.slug,
        label: cat.name,
    }));
};

// Get subcategory options for a given category
export const getSubcategoryOptions = (categorySlug: string) => {
    const subcategories = getSubcategoriesByCategory(categorySlug);
    return subcategories.map((sub) => ({
        value: sub.slug,
        label: sub.name,
    }));
};
