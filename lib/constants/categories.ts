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

            // Colouring services - existing
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

            // NEW: Tint & Foils combo services
            { name: "Tint Re-Growth – Cut & Blow Wave", slug: "tint-regrowth-cut-blow" },
            { name: "Tint Re-Growth (6 Weeks+) – Cut & Blow Wave", slug: "tint-regrowth-6weeks-cut-blow" },
            { name: "1/4 Head Foils – Toner – Cut & Blow Wave", slug: "quarter-foils-toner-cut-blow" },
            { name: "1/2 Head Foils – Toner – Cut & Blow Wave", slug: "half-foils-toner-cut-blow" },
            { name: "3/4 Head Foils – Toner – Cut & Blow Wave", slug: "threequarter-foils-toner-cut-blow" },
            { name: "Full Head Foils – Toner – Cut & Blow Wave", slug: "full-foils-toner-cut-blow" },
            { name: "Full Head Foils (Back to Back) – Toner – Cut & Blow Wave", slug: "full-foils-b2b-toner-cut-blow" },
            { name: "1/4 Head Foils – Tint – Cut & Blow Wave", slug: "quarter-foils-tint-cut-blow" },
            { name: "1/2 Head Foils – Tint – Cut & Blow Wave", slug: "half-foils-tint-cut-blow" },
            { name: "Balayage – Toner – Cut & Blow Wave", slug: "balayage-toner-cut-blow" },
            { name: "All Over Colour – Cut & Blow Wave", slug: "all-over-colour-cut-blow" },

            // NEW: Foils to roots only
            { name: "1/4 Head Foils – To Roots", slug: "quarter-foils-roots" },
            { name: "1/2 Head Foils – To Roots", slug: "half-foils-roots" },
            { name: "3/4 Head Foils – To Roots", slug: "threequarter-foils-roots" },
            { name: "Full Head Foils – To Roots", slug: "full-foils-roots" },

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
            // NEW: Root Tint add-on
            "Root Tint with Foils",
        ],
    },

    MENS: {
        name: "Men's Haircut Services",
        slug: "mens-haircut-services",
        description: "Professional men's haircuts, fades, beard grooming, and styling",
        subcategories: [
            // Core cuts
            { name: "Men's Cut", slug: "mens-cut" },
            { name: "Men's Cut (Short)", slug: "mens-cut-short" },
            { name: "Men's Cut (Medium)", slug: "mens-cut-medium" },
            { name: "Men's Cut (Long)", slug: "mens-cut-long" },
            { name: "Restyle Cut", slug: "mens-restyle-cut" },
            { name: "Skin Fade", slug: "skin-fade" },
            { name: "Taper Fade", slug: "taper-fade" },
            { name: "Scissor Cut", slug: "scissor-cut" },
            { name: "Buzz Cut", slug: "buzz-cut" },
            { name: "Senior Men's Cut", slug: "senior-mens-cut" },
            { name: "Student / Youth Cut", slug: "student-youth-cut" },

            // Combo services
            { name: "Men's Cut & Beard Trim", slug: "mens-cut-beard-trim" },
            { name: "Skin Fade & Beard Shape", slug: "skin-fade-beard-shape" },
            { name: "Cut, Wash & Style", slug: "cut-wash-style" },
        ],
        addOns: [
            "Beard Trim",
            "Beard Shape & Line-Up",
            "Hot Towel Finish",
            "Neck & Hairline Clean-Up",
            "Hair Wash",
            "Styling & Finish",
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
            // Existing services
            { name: "Manicure – Classic", slug: "manicure-classic" },
            { name: "Manicure – Gel/Shellac", slug: "manicure-gel" },
            { name: "Manicure – Deluxe (spa, exfoliation, massage)", slug: "manicure-deluxe" },
            { name: "Pedicure – Classic", slug: "pedicure-classic" },
            { name: "Pedicure – Gel/Shellac", slug: "pedicure-gel" },
            { name: "Pedicure – Deluxe (spa, exfoliation, massage)", slug: "pedicure-deluxe" },
            { name: "Acrylic Extensions – Full Set", slug: "acrylic-full" },
            { name: "Acrylic Infill / Refill", slug: "acrylic-infill" },
            { name: "SNS / Dip Powder – Full Set", slug: "sns-full" },

            // NEW: Additional nail services
            { name: "Gel X", slug: "gel-x" },
            { name: "Acrylic", slug: "acrylic" },
            { name: "BIAB (Builder Gel in a Bottle)", slug: "biab" },
            { name: "Gel Manicure", slug: "gel-manicure" },
            { name: "Dry Pedicure", slug: "dry-pedicure" },
            { name: "Dry Pedicure & Nails Bundle", slug: "dry-pedicure-nails-bundle" },
            { name: "Soak Off & Reapply (Gel X)", slug: "soak-off-reapply-gel-x" },
            { name: "Acrylic Infill", slug: "acrylic-infill-new" },
            { name: "BIAB Infill", slug: "biab-infill" },
            { name: "Nail Repair (Per Nail)", slug: "nail-repair-per-nail" },
            { name: "Charm / Gem Repair (Per Nail)", slug: "charm-gem-repair-per-nail" },
        ],
        addOns: [
            // Existing add-ons
            "Nail Art",
            "French Tip",
            "Gel Polish Upgrade",
            "Paraffin Wax",
            "Cuticle Treatment",

            // NEW: Nail art tiers and extras
            "Tier 1 Nail Art",
            "Tier 2 Nail Art",
            "Tier 3 Nail Art",
            "French Tip Full Set",
            "Soak Off with Service",
            "Soak Off (My Work)",
            "After Hours / Weekend Fee",
        ],
    },

    BEAUTY: {
        name: "Beauty & Brows",
        slug: "beauty-brows",
        description: "Eyebrow shaping, lash treatments, waxing, and facial hair removal",
        subcategories: [
            // Existing services
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

            // NEW: Lash services
            { name: "Perm Point Lash", slug: "perm-point-lash" },
            { name: "Lush Lash Lift", slug: "lush-lash-lift" },
            { name: "Just The Tint Will Do", slug: "just-the-tint" },
            { name: "Intuitive Full Set", slug: "intuitive-full-set" },
            { name: "Wispy Speedy Full Set", slug: "wispy-speedy-full-set" },
            { name: "Wispy Deluxe Full Set", slug: "wispy-deluxe-full-set" },
            { name: "Lash Refill", slug: "lash-refill" },
            { name: "Lash Removal", slug: "lash-removal" },

            // NEW: Lash promos
            { name: "Perm Point Lash Promo", slug: "perm-point-lash-promo" },
            { name: "Lush + Gossamer Promo", slug: "lush-gossamer-promo" },
            { name: "Lush + Naked Promo", slug: "lush-naked-promo" },

            // NEW: Brow services
            { name: "Gossamer Brow Lamination", slug: "gossamer-brow-lamination" },
            { name: "Naked Brow Lamination", slug: "naked-brow-lamination" },
            { name: "HD Brow Sculpt & Wax (First Visit)", slug: "hd-brow-sculpt-first" },
            { name: "HD Brow Maintenance", slug: "hd-brow-maintenance" },
            { name: "Brow Maintenance Wax", slug: "brow-maintenance-wax" },
            { name: "Just The Dye Will Do", slug: "just-the-dye" },

            // NEW: Individual waxing services
            { name: "Lip Wax", slug: "lip-wax" },
            { name: "Chin Wax", slug: "chin-wax" },
            { name: "Sideburn Wax", slug: "sideburn-wax" },
            { name: "Nose Wax", slug: "nose-wax" },
            { name: "Full Face Wax", slug: "full-face-wax" },
            { name: "Underarm Wax", slug: "underarm-wax" },
            { name: "Half Arm Wax", slug: "half-arm-wax" },
            { name: "Full Arm Wax", slug: "full-arm-wax" },
            { name: "Half Leg Wax", slug: "half-leg-wax" },
            { name: "Full Leg Wax", slug: "full-leg-wax" },
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
            // Basic Wash by size
            { name: "Basic Wash — Small (up to 10kg)", slug: "basic-wash-small" },
            { name: "Basic Wash — Medium (10–25kg)", slug: "basic-wash-medium" },
            { name: "Basic Wash — Large (25–40kg)", slug: "basic-wash-large" },
            { name: "Basic Wash — X-Large (40kg+)", slug: "basic-wash-xlarge" },

            // Bath & Dry by size
            { name: "Bath & Dry — Small (up to 10kg)", slug: "bath-dry-small" },
            { name: "Bath & Dry — Medium (10–25kg)", slug: "bath-dry-medium" },
            { name: "Bath & Dry — Large (25–40kg)", slug: "bath-dry-large" },
            { name: "Bath & Dry — X-Large (40kg+)", slug: "bath-dry-xlarge" },

            // De-Shedding Bath by size
            { name: "De-Shedding Bath — Small (up to 10kg)", slug: "deshedding-bath-small" },
            { name: "De-Shedding Bath — Medium (10–25kg)", slug: "deshedding-bath-medium" },
            { name: "De-Shedding Bath — Large (25–40kg)", slug: "deshedding-bath-large" },
            { name: "De-Shedding Bath — X-Large (40kg+)", slug: "deshedding-bath-xlarge" },

            // Full Groom by size
            { name: "Full Groom — Small (up to 10kg)", slug: "full-groom-small" },
            { name: "Full Groom — Medium (10–25kg)", slug: "full-groom-medium" },
            { name: "Full Groom — Large (25–40kg)", slug: "full-groom-large" },
            { name: "Full Groom — X-Large (40kg+)", slug: "full-groom-xlarge" },
        ],
        addOns: [
            // Bath & Treatment Add-Ons
            "Flea & Tick Bath",
            "De-Shedding Treatment",
            "Coat Conditioning",
            "Medicated Bath",

            // Groom Types
            "Breed Groom",
            "Puppy Groom",
            "Partial Groom (Face, Feet, Sanitary)",

            // Nail & Paw Care
            "Nail Trim",
            "Nail Grind",
            "Paw Pad Trim",
            "Paw Balm",

            // Face & Mouth Care
            "Ear Cleaning",
            "Tear Stain Clean",
            "Teeth Brushing",

            // Extras
            "Anal Gland Expression",
            "Extra Time (Large / Double-Coated Dogs)",
            "Flea / Tick Treatment",
            "Bow or Bandana + Cologne Finish",
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
            { name: "Halloween Makeup", slug: "halloween-makeup" },
            { name: "Drag Makeup", slug: "drag-makeup" },
        ],
        addOns: [
            "Lashes (strip or individual)",
            "Airbrush finish",
            "Touch-up kit",
            "Early morning / travel fee",
        ],
    },

    TEETH_WHITENING: {
        name: "Teeth Whitening",
        slug: "teeth-whitening",
        description: "Professional teeth whitening and enhancement treatments",
        subcategories: [
            { name: "Express Teeth Whitening", slug: "express-teeth-whitening" },
            { name: "Full Teeth Whitening Session", slug: "full-teeth-whitening" },
            { name: "Deluxe Whitening Session (includes extra application)", slug: "deluxe-whitening" },
            { name: "Teeth Whitening Top-Up", slug: "teeth-whitening-top-up" },
        ],
        addOns: [
            "Extra Whitening Boost",
            "LED Light Enhancement",
            "Desensitising Treatment",
            "Enamel Protection Treatment",
            "Aftercare Kit (Whitening Pen / Gel)",
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
