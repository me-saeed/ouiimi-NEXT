/**
 * Service Categories & Subcategories
 * 2-Level Structure: Main Category → Subcategory (Service Name)
 * Add-ons are defined at the main category level
 * 
 * Verified List - December 2025
 */

export interface SubCategory {
    name: string;
    slug: string;
}

export interface Category {
    name: string;
    slug: string;
    description?: string;
    subcategories: SubCategory[];
    addOns?: string[];
}

export const SERVICE_CATEGORIES: Record<string, Category> = {
    HAIR: {
        name: "Hair Services",
        slug: "hair-services",
        description: "Professional hair cutting, styling, coloring, and treatments",
        subcategories: [
            // Haircut services
            { name: "Women's Cut – Short", slug: "womens-cut-short" },
            { name: "Women's Cut – Medium", slug: "womens-cut-medium" },
            { name: "Women's Cut – Long", slug: "womens-cut-long" },
            { name: "Restyle Cut", slug: "restyle-cut" },
            { name: "Men's Cut", slug: "mens-cut" },
            { name: "Kids' Cut", slug: "kids-cut" },
            { name: "Fringe Trim", slug: "fringe-trim" },
            { name: "Clipper Cut / Fade", slug: "clipper-cut-fade" },

            // Styling services
            { name: "Blow-Dry – Short", slug: "blow-dry-short" },
            { name: "Blow-Dry – Medium", slug: "blow-dry-medium" },
            { name: "Blow-Dry – Long", slug: "blow-dry-long" },
            { name: "Straight Finish", slug: "straight-finish" },
            { name: "Curls / Waves", slug: "curls-waves" },
            { name: "Upstyle", slug: "upstyle" },
            { name: "Braids", slug: "braids" },

            // Colouring services
            { name: "Regrowth Colour", slug: "regrowth-colour" },
            { name: "All-Over Colour – Short", slug: "all-over-colour-short" },
            { name: "All-Over Colour – Medium", slug: "all-over-colour-medium" },
            { name: "All-Over Colour – Long", slug: "all-over-colour-long" },
            { name: "Highlights – ¼ Head", slug: "highlights-quarter-head" },
            { name: "Highlights – ½ Head", slug: "highlights-half-head" },
            { name: "Highlights – Full", slug: "highlights-full" },
            { name: "Balayage / Ombre", slug: "balayage-ombre" },
            { name: "Toner / Gloss", slug: "toner-gloss" },
            { name: "Colour Correction", slug: "colour-correction" },
            { name: "Scalp Bleach + Tone", slug: "scalp-bleach-tone" },

            // Texture services
            { name: "Keratin Smoothing", slug: "keratin-smoothing" },
            { name: "Permanent Straightening", slug: "permanent-straightening" },
            { name: "Perm", slug: "perm" },
            { name: "Bond Treatment", slug: "bond-treatment" },

            // Extensions
            { name: "Tape-In Extensions", slug: "tape-in-extensions" },
            { name: "Clip-In Styling", slug: "clip-in-styling" },
            { name: "Micro-Bead / Weft", slug: "micro-bead-weft" },
            { name: "Extension Removal", slug: "extension-removal" },

            // Treatments
            { name: "Deep Conditioning", slug: "deep-conditioning" },
            { name: "Scalp Treatment", slug: "scalp-treatment" },
            { name: "Moisture / Protein Mask", slug: "moisture-protein-mask" },
            { name: "Bond Repair", slug: "bond-repair" },
        ],
        addOns: [
            "Scalp Massage",
            "Hydration/Repair Mask",
            "Toner",
            "Olaplex/Bonding Treatment",
            "Extra Blow-Dry",
            "Hot Tool Styling",
            "Braiding",
            "Occasion Finish",
            "Extra Colour Bowl",
            "Root Shadow/Blend",
            "Gloss Refresh",
            "Colour Lock Treatment",
        ],
    },

    BRIDAL_EVENT: {
        name: "Bridal & Event Packages",
        slug: "bridal-event-packages",
        description: "Complete bridal and event packages for hair, makeup, and styling",
        subcategories: [
            { name: "Bridal Hair Trial", slug: "bridal-hair-trial" },
            { name: "Bridal Hair (Wedding Day)", slug: "bridal-hair-wedding" },
            { name: "Bridesmaids / Bridal Party Hair", slug: "bridesmaids-hair" },
            { name: "Bridal - Event Glam Styling (formal, photoshoot, etc.)", slug: "event-glam" },
            { name: "Bridal - On-Site Styling (Travel Fee applies)", slug: "onsite-styling" },
        ],
    },

    NAILS: {
        name: "Nails",
        slug: "nails",
        description: "Professional nail care, manicures, pedicures, and nail art",
        subcategories: [
            { name: "Manicure – Classic", slug: "manicure-classic" },
            { name: "Manicure – Gel/Shellac", slug: "manicure-gel" },
            { name: "Manicure – Deluxe (spa, exfoliation, massage)", slug: "manicure-deluxe" },
            { name: "Pedicure – Classic", slug: "pedicure-classic" },
            { name: "Pedicure – Gel/Shellac", slug: "pedicure-gel" },
            { name: "Pedicure – Deluxe (spa, exfoliation, massage)", slug: "pedicure-deluxe" },
            { name: "Acrylic Extensions – Full Set", slug: "acrylic-full" },
            { name: "Acrylic Infill / Refill", slug: "acrylic-infill" },
            { name: "SNS / Dip Powder – Full Set", slug: "sns-full" },
        ],
        addOns: [
            "Nail Art",
            "French Tip",
            "Gel Polish Upgrade",
            "Paraffin Wax",
            "Cuticle Treatment",
        ],
    },

    BEAUTY: {
        name: "Beauty & Brows",
        slug: "beauty-brows",
        description: "Eyebrow shaping, lash treatments, waxing, and facial hair removal",
        subcategories: [
            { name: "Eyebrow Shape / Wax / Thread", slug: "eyebrow-shape" },
            { name: "Eyebrow Tint", slug: "eyebrow-tint" },
            { name: "Lash Tint", slug: "lash-tint" },
            { name: "Lash Lift & Tint Combo", slug: "lash-lift-tint" },
            { name: "Brow Lamination", slug: "brow-lamination" },
            { name: "Brow Henna / Hybrid Tint", slug: "brow-henna" },
            { name: "Facial Waxing (lip, chin, sides)", slug: "facial-waxing" },
            { name: "Full Face Waxing", slug: "full-face-waxing" },
            { name: "Underarm / Arm Wax", slug: "underarm-arm-wax" },
            { name: "Leg Wax – Half / Full", slug: "leg-wax" },
            { name: "Bikini / Brazilian Wax", slug: "bikini-brazilian" },
        ],
        addOns: [
            "Brow Tint",
            "Lash Tint",
            "Quick Facial",
            "Lip/Chin wax",
        ],
    },

    MASSAGE: {
        name: "Massage & Wellness",
        slug: "massage-wellness",
        description: "Therapeutic massage, relaxation, and wellness treatments",
        subcategories: [
            { name: "Relaxation / Swedish Massage", slug: "swedish-massage" },
            { name: "Remedial / Deep Tissue Massage", slug: "deep-tissue" },
            { name: "Hot Stone Massage", slug: "hot-stone" },
            { name: "Aromatherapy Massage", slug: "aromatherapy" },
            { name: "Pregnancy Massage", slug: "pregnancy" },
            { name: "Reflexology (Feet)", slug: "reflexology" },
            { name: "Indian Head / Scalp Massage", slug: "indian-head" },
        ],
        addOns: [
            "Hot Stones",
            "Aromatherapy Oils",
            "Extra 15mins",
            "Cupping",
        ],
    },

    SKIN: {
        name: "Skin & Facial",
        slug: "skin-facial",
        description: "Professional facials, skin treatments, and anti-aging therapies",
        subcategories: [
            { name: "Express Facial", slug: "express-facial" },
            { name: "Classic / Deep Cleanse Facial", slug: "classic-facial" },
            { name: "Hydrating Facial", slug: "hydrating-facial" },
            { name: "Anti-Ageing Facial", slug: "anti-ageing" },
            { name: "Acne / Problem Skin Facial", slug: "acne-facial" },
            { name: "Microdermabrasion", slug: "microdermabrasion" },
            { name: "LED Light Therapy", slug: "led-therapy" },
            { name: "Chemical Peel", slug: "chemical-peel" },
        ],
        addOns: [
            "Collagen / Firming Mask",
            "Extraction",
        ],
    },

    DOG_GROOMING: {
        name: "Dog Grooming",
        slug: "dog-grooming",
        description: "Professional dog grooming, bathing, styling, and pet care",
        subcategories: [
            { name: "Basic Bath", slug: "basic-bath" },
            { name: "Wash & Dry", slug: "wash-dry" },
            { name: "Flea & Tick Bath", slug: "flea-tick-bath" },
            { name: "De-Shedding Bath", slug: "deshedding-bath" },
            { name: "Full Groom", slug: "full-groom" },
            { name: "Breed Groom", slug: "breed-groom" },
            { name: "Puppy Groom", slug: "puppy-groom" },
            { name: "Partial Groom", slug: "partial-groom" },
            { name: "De-Shedding Treatment", slug: "deshedding-treatment" },
            { name: "Coat Conditioning", slug: "coat-conditioning" },
            { name: "Medicated Bath", slug: "medicated-bath" },
            { name: "Nail Trim", slug: "nail-trim" },
            { name: "Nail Grind", slug: "nail-grind" },
            { name: "Paw Pad Trim", slug: "paw-pad-trim" },
            { name: "Paw Balm", slug: "paw-balm" },
            { name: "Ear Cleaning", slug: "ear-cleaning" },
            { name: "Tear Stain Clean", slug: "tear-stain" },
            { name: "Teeth Brushing", slug: "teeth-brushing" },
        ],
        addOns: [
            "Anal Gland Expression",
            "Extra Time for Large/Double-Coated Dogs",
            "Flea/Tick Treatment",
            "Bow/Bandana + Cologne Finish",
        ],
    },

    MAKEUP: {
        name: "Makeup Services",
        slug: "makeup-services",
        description: "Professional makeup application for events, bridal, and everyday looks",
        subcategories: [
            { name: "Full Makeup Application", slug: "full-makeup" },
            { name: "Natural/Everyday Makeup", slug: "everyday-makeup" },
            { name: "Glam/Event Makeup", slug: "glam-event" },
            { name: "Bridal Makeup", slug: "bridal-makeup" },
            { name: "Bridesmaid Makeup", slug: "bridesmaid-makeup" },
            { name: "Photoshoot Makeup", slug: "photoshoot-makeup" },
            { name: "Makeup Trial", slug: "makeup-trial" },
            { name: "Teen/School Formal Makeup", slug: "teen-formal" },
            { name: "Men's Grooming Makeup", slug: "mens-grooming" },
            { name: "Makeup Lesson / Tutorial", slug: "makeup-lesson" },
        ],
        addOns: [
            "Lashes (strip or individual)",
            "Airbrush finish",
            "Touch-up kit",
            "Early morning / travel fee",
        ],
    },
};

// Helper functions
export const getAllCategories = () => {
    return Object.values(SERVICE_CATEGORIES);
};

export const getCategoryBySlug = (slug: string) => {
    return Object.values(SERVICE_CATEGORIES).find((cat) => cat.slug === slug);
};

export const getCategoryByName = (name: string) => {
    return Object.values(SERVICE_CATEGORIES).find((cat) => cat.name === name);
};

export const getSubcategoriesByCategory = (categoryNameOrSlug: string) => {
    const category = getCategoryBySlug(categoryNameOrSlug) || getCategoryByName(categoryNameOrSlug);
    return category ? category.subcategories : [];
};

export const getAddOnsByCategory = (categoryNameOrSlug: string) => {
    const category = getCategoryBySlug(categoryNameOrSlug) || getCategoryByName(categoryNameOrSlug);
    return category?.addOns || [];
};

// Get category name from slug (for display)
export const getCategoryName = (slug: string): string => {
    const category = getCategoryBySlug(slug);
    return category?.name || slug;
};

// Flatten all categories for dropdown
export const getCategoryOptions = () => {
    return getAllCategories().map((cat) => ({
        value: cat.name,
        label: cat.name,
    }));
};

// Get subcategory options for a given category
export const getSubcategoryOptions = (categoryNameOrSlug: string) => {
    const subcategories = getSubcategoriesByCategory(categoryNameOrSlug);
    return subcategories.map((sub) => ({
        value: sub.name,
        label: sub.name,
    }));
};
