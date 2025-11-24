# UI File Locations

## 📁 Project Structure

```
ouiimi-NEXT/
├── app/                    ← PAGES (Next.js App Router)
│   ├── page.tsx           ← Home Page (/)
│   ├── layout.tsx          ← Root Layout
│   ├── globals.css        ← Global Styles
│   ├── error.tsx          ← Error Page
│   ├── not-found.tsx      ← 404 Page
│   │
│   ├── signin/            ← Sign In Page
│   │   └── page.tsx       → /signin
│   │
│   ├── signup/            ← Sign Up Page
│   │   └── page.tsx       → /signup
│   │
│   ├── forgetpass/        ← Forgot Password
│   │   └── page.tsx       → /forgetpass
│   │
│   ├── reset-password/    ← Reset Password
│   │   └── page.tsx       → /reset-password
│   │
│   ├── about/             ← About Us
│   │   └── page.tsx       → /about
│   │
│   ├── privacy/           ← Privacy Policy
│   │   └── page.tsx       → /privacy
│   │
│   └── terms/             ← Terms & Conditions
│       └── page.tsx       → /terms
│
└── components/            ← REUSABLE COMPONENTS
    ├── layout/            ← Layout Components
    │   ├── Header.tsx    ← Site Header
    │   ├── Footer.tsx    ← Site Footer
    │   └── PageLayout.tsx ← Page Wrapper
    │
    └── ui/                ← UI Components (Shadcn)
        ├── button.tsx    ← Button Component
        ├── input.tsx     ← Input Component
        ├── label.tsx     ← Label Component
        ├── card.tsx      ← Card Component
        └── alert.tsx     ← Alert Component
```

---

## 📍 Current UI Pages

### ✅ **EXISTING PAGES** (8 pages)

| Route | File Location | Status |
|-------|--------------|--------|
| `/` | `app/page.tsx` | ✅ Complete |
| `/signin` | `app/signin/page.tsx` | ✅ Complete |
| `/signup` | `app/signup/page.tsx` | ✅ Complete |
| `/forgetpass` | `app/forgetpass/page.tsx` | ✅ Complete |
| `/reset-password` | `app/reset-password/page.tsx` | ✅ Complete |
| `/about` | `app/about/page.tsx` | ✅ Complete |
| `/privacy` | `app/privacy/page.tsx` | ✅ Complete |
| `/terms` | `app/terms/page.tsx` | ✅ Complete |

---

## 🎨 UI Components

### **Layout Components**
- `components/layout/Header.tsx` - Navigation header
- `components/layout/Footer.tsx` - Site footer
- `components/layout/PageLayout.tsx` - Wrapper for pages

### **UI Components (Shadcn)**
- `components/ui/button.tsx` - Button component
- `components/ui/input.tsx` - Input field component
- `components/ui/label.tsx` - Label component
- `components/ui/card.tsx` - Card container component
- `components/ui/alert.tsx` - Alert/notification component

---

## ❌ **MISSING UI PAGES** (Need to Create)

### Business Management Pages
```
app/business/
├── register/
│   └── page.tsx          → /business/register
├── dashboard/
│   └── page.tsx          → /business/dashboard
├── profile/
│   └── edit/
│       └── page.tsx      → /business/profile/edit
└── bank-details/
    └── page.tsx          → /business/bank-details
```

### Staff Management Pages
```
app/business/staff/
├── page.tsx              → /business/staff
├── add/
│   └── page.tsx          → /business/staff/add
└── [id]/
    └── edit/
        └── page.tsx      → /business/staff/[id]/edit
```

### Service Management Pages
```
app/business/services/
├── page.tsx              → /business/services
├── create/
│   └── page.tsx          → /business/services/create
└── [id]/
    ├── edit/
    │   └── page.tsx      → /business/services/[id]/edit
    └── time-slots/
        └── page.tsx      → /business/services/[id]/time-slots
```

### Shopper Pages
```
app/services/
├── page.tsx              → /services
└── [id]/
    └── page.tsx          → /services/[id]

app/businesses/
├── page.tsx              → /businesses
└── [id]/
    └── page.tsx          → /businesses/[id]
```

---

## 🚀 How to Access UI

### **Development Server**
```bash
cd /Users/mac/Developer/ouiimi-NEXT
npm run dev
```

Then open:
- Home: http://localhost:3000
- Sign In: http://localhost:3000/signin
- Sign Up: http://localhost:3000/signup
- About: http://localhost:3000/about
- Privacy: http://localhost:3000/privacy
- Terms: http://localhost:3000/terms

---

## 📝 Quick Navigation

**To edit existing pages:**
- Home page: `app/page.tsx`
- Sign in: `app/signin/page.tsx`
- Sign up: `app/signup/page.tsx`

**To add new pages:**
- Create folder in `app/` directory
- Add `page.tsx` file inside
- Route automatically created

**Example:**
```bash
# Create business dashboard
mkdir -p app/business/dashboard
touch app/business/dashboard/page.tsx
# Now accessible at /business/dashboard
```

---

## 🎯 Next Steps

1. ✅ **Existing UI** - 8 pages ready
2. ❌ **Business Pages** - Need 4 pages
3. ❌ **Staff Pages** - Need 3 pages
4. ❌ **Service Pages** - Need 4 pages
5. ❌ **Shopper Pages** - Need 4 pages

**Total: 15 pages to create**

