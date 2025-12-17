/**
 * Service Categories & Subcategories
 * 2-Level Structure: Main Category → Subcategory (Service Name)
 * Add-ons are defined at the main category level
 * 
 * Format: "Prefix - Service Name" (e.g., "Haircut - Women's Cut – Short")
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
            { name: "Haircut - Women's Cut – Short (above shoulders)", slug: "haircut-womens-short" },
            { name: "Haircut - Women's Cut – Medium (shoulder to mid-back)", slug: "haircut-womens-medium" },
            { name: "Haircut - Women's Cut – Long (below mid-back / thick)", slug: "haircut-womens-long" },
            { name: "Haircut - Restyle Cut (major change)", slug: "haircut-restyle" },
            { name: "Haircut - Men's Cut", slug: "haircut-mens" },
            { name: "Haircut - Children's Cut", slug: "haircut-children" },
            { name: "Haircut - Fringe / Bang Trim", slug: "haircut-fringe" },
            { name: "Haircut - Clipper Cut / Fade", slug: "haircut-clipper" },

            // Styling services
            { name: "Styling - Blow-Dry – Short Hair", slug: "styling-blowdry-short" },
            { name: "Styling - Blow-Dry – Medium Hair", slug: "styling-blowdry-medium" },
            { name: "Styling - Blow-Dry – Long/Thick Hair", slug: "styling-blowdry-long" },
            { name: "Styling - Straighten / Flat Iron Finish", slug: "styling-straighten" },
            { name: "Styling - Curls / Waves", slug: "styling-curls" },
            { name: "Styling - Updo / Occasion Style", slug: "styling-updo" },
            { name: "Styling - Braids (Simple / Detailed)", slug: "styling-braids" },

            // Colouring services
            { name: "Colouring - Root Touch-Up / Regrowth Colour", slug: "colouring-root-touchup" },
            { name: "Colouring - All-Over Colour – Short", slug: "colouring-allover-short" },
            { name: "Colouring - All-Over Colour – Medium", slug: "colouring-allover-medium" },
            { name: "Colouring - All-Over Colour – Long/Thick", slug: "colouring-allover-long" },
            { name: "Colouring - Foils / Highlights – 1/4 Head", slug: "colouring-foils-quarter" },
            { name: "Colouring - Foils / Highlights – 1/2 Head", slug: "colouring-foils-half" },
            { name: "Colouring - Foils / Highlights – Full Head", slug: "colouring-foils-full" },
            { name: "Colouring - Balayage / Ombre", slug: "colouring-balayage" },
            { name: "Colouring - Toner / Gloss Refresh", slug: "colouring-toner" },
            { name: "Colour Correction (by consultation)", slug: "colour-correction" },
            { name: "Colouring - Scalp Bleach & Tone", slug: "colouring-scalp-bleach" },

            // Texture services
            { name: "Texture - Keratin / Brazilian Smoothing", slug: "texture-keratin" },
            { name: "Texture - Permanent Straightening / Relaxer", slug: "texture-straightening" },
            { name: "Texture - Perm (Short / Long Hair)", slug: "texture-perm" },
            { name: "Texture - Bond Treatment (Olaplex / K18 / Similar)", slug: "texture-bond" },

            // Extensions
            { name: "Extensions - Tape-In Extensions (Apply / Remove / Reapply)", slug: "extensions-tapein" },
            { name: "Extensions - Clip-In Extension Styling", slug: "extensions-clipin" },
            { name: "Extensions - Micro-Bead / Weft Application", slug: "extensions-microbead" },
            { name: "Extensions - Removal Only", slug: "extensions-removal" },

            // Treatments
            { name: "Treatments - Deep Conditioning Treatment", slug: "treatments-conditioning" },
            { name: "Treatments - Scalp Detox / Scalp Treatment", slug: "treatments-scalp" },
            { name: "Treatments - Moisture / Protein Mask", slug: "treatments-moisture" },
            { name: "Treatments - Bond Repair Treatment (stand-alone)", slug: "treatments-bond" },
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
            { name: "Relaxation / Swedish Massage (30 / 60 / 90 mins)", slug: "swedish-massage" },
            { name: "Remedial / Deep Tissue Massage (30 / 60 / 90 mins)", slug: "deep-tissue" },
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
            { name: "Express Facial (30 mins)", slug: "express-facial" },
            { name: "Classic / Deep Cleanse Facial (60 mins)", slug: "classic-facial" },
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
            // Bath & Clean
            { name: "Bath & Clean - Basic Wash", slug: "bath-basic" },
            { name: "Bath & Clean - Wash & Dry", slug: "bath-wash-dry" },
            { name: "Bath & Clean - Flea/Tick Wash", slug: "bath-flea" },
            { name: "Bath & Clean - De-shedding Wash", slug: "bath-deshed" },

            // Haircut
            { name: "Haircut - Full Groom", slug: "haircut-full" },
            { name: "Haircut - Breed-Specific Groom", slug: "haircut-breed" },
            { name: "Haircut - Puppy Groom", slug: "haircut-puppy" },
            { name: "Haircut - Partial Groom (Face, Feet, Sanitary Trim)", slug: "haircut-partial" },

            // Skin Care
            { name: "Skin Care - De-shedding Treatment", slug: "skincare-deshed" },
            { name: "Skin Care - Coat Conditioning", slug: "skincare-coat" },
            { name: "Skin Care - Medicated Bath", slug: "skincare-medicated" },

            // Nails
            { name: "Nails - Nail Trim", slug: "nails-trim" },
            { name: "Nails - Nail Grind", slug: "nails-grind" },
            { name: "Nails - Paw Pad Trim", slug: "nails-paw-pad" },
            { name: "Nails - Paw Balm Treatment", slug: "nails-balm" },

            // Other Services
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
