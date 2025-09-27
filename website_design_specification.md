# Eye Care Provider Website - Design Specification

## Color Scheme

### Primary Color Palette
We selected a **Soft Professional Gray with Teal Accent** theme for a calming, healthcare-focused appearance:

- **Background**: `#F4F7F8` (Light gray-blue)
  - Used for: Main background, section backgrounds
  - Creates a clean, professional foundation

- **Headers**: `#5B6770` (Dark gray-blue)
  - Used for: Main headings, important text
  - Provides strong contrast and readability

- **Navigation**: `#D7DDE1` (Light gray)
  - Used for: Navigation bars, secondary backgrounds
  - Creates subtle separation and structure

- **CTA/Buttons**: `#4B8A8A` (Professional teal)
  - Used for: Call-to-action buttons, links, interactive elements
  - Provides distinctive accent while maintaining healthcare professionalism

- **Secondary Accent**: `#A3B8C2` (Light blue-gray)
  - Used for: Subtle highlights, borders, secondary elements
  - Complements the main palette with softer contrast

### Text Colors
- **Primary Text**: `#5B6770` (Dark gray-blue) - Main content, headers
- **Light Text**: `#7A8B94` (Medium gray) - Subtitles, secondary content
- **Link Text**: `#4B8A8A` (Teal) - Interactive text elements

### Gradients
- **Navigation Gradient**: `linear-gradient(120deg, #D7DDE1, #A3B8C2)`
- **Hero Background**: `linear-gradient(135deg, #F4F7F8, #E8EEF0)`
- **CTA Gradient**: `linear-gradient(45deg, #4B8A8A, #5B9A9A)`

### Shadows
- **Soft Shadow**: `0 4px 6px rgba(91, 103, 112, 0.08)` - Cards, navigation
- **Strong Shadow**: `0 10px 20px rgba(91, 103, 112, 0.15)` - Hover effects
- **Subtle Inner Shadow**: `inset 0 1px 2px rgba(91, 103, 112, 0.05)` - Form inputs

## Typography
- **Primary Font**: 'Inter', sans-serif
- **Weight Range**: 300, 400, 500, 600, 700
- **Purpose**: Modern, highly legible sans-serif perfect for healthcare

---

## Website Structure & Sections

### 1. Homepage (`index.html`)
**Purpose**: First impression, overview, lead generation

#### Sections:
1. **Navigation Bar**
   - Logo: "I Care"
   - Links: About us, Services, Products, Contact
   - Mobile hamburger menu
   - Search icon

2. **Hero Banner**
   - Headline: "Professional Eye Care at Your Doorstep"
   - Subtitle: Service description
   - **Postcode Checker**: Interactive coverage verification
   - CTA Button: "Check Coverage"

3. **Services Overview**
   - Title: "Our Services"
   - 3 Service Cards:
     - Eye Examinations
     - Glasses & Prescriptions  
     - Contact Lenses
   - Icons and descriptions

4. **Why Choose Us**
   - Title: "Why Choose Home Visit Eye Care?"
   - 3 Value Cards:
     - Convenience (Home icon)
     - Professional Excellence (Check icon)
     - Personalized Care (User icon)

5. **How It Works**
   - 4 Process Steps:
     1. Check Coverage
     2. Book Online
     3. We Come to You
     4. Complete Care
   - Numbered circles with descriptions

6. **Call-to-Action Section**
   - Final conversion push
   - "Ready to Book Your Home Eye Test?"
   - Button: "Contact Us Today"

### 2. About Page (`about.html`)
**Purpose**: Build trust, showcase credentials

#### Sections:
1. **Navigation** (consistent across all pages)

2. **About Hero**
   - Page title: "Meet Your Optometrist"

3. **Profile Section**
   - **Profile Image**: Professional photo (Petru Pavalasc)
   - **Personal Story**: Journey in eye care
   - **Quote Blocks**: Professional philosophy
   - **Qualifications List**: Education and certifications
   - **Achievements Grid**: 
     - 10+ Years in Eye Care
     - 2 Professional Degrees  
     - 100% Patient Focused

4. **Values Section**
   - 3 Value Cards:
     - Patient-First Approach
     - Professional Excellence
     - Accessibility

5. **Testimonials**
   - Carousel with 3 testimonials
   - Navigation dots
   - Auto-advance functionality

### 3. Services Page (`services.html`)
**Purpose**: Detailed service information

#### Sections:
1. **Services Hero**
   - Title: "Our Services"
   - Subtitle: Service overview

2. **Services Grid**
   - 4 Detailed Service Cards:
     - **Comprehensive Eye Examination**
       - Visual acuity testing
       - Eye pressure measurement
       - Retinal photography
       - Color vision testing
       - Peripheral vision assessment
     - **Prescription & Glasses Fitting**
       - Frame selection consultation
       - Lens recommendation
       - Prescription verification
       - Fitting and adjustment
       - Follow-up care
     - **Contact Lens Services**
       - Initial fitting consultation
       - Lens type recommendation
       - Training and guidance
       - Regular follow-ups
     - **Specialized Care**
       - Geriatric eye care
       - Mobility-assisted examinations
       - Family group appointments
       - Care home visits
       - Emergency consultations

3. **Process Section**
   - "How It Works" (expanded version)
   - 4 steps with detailed descriptions

### 4. Products Page (`products.html`)
**Purpose**: Showcase eyewear and products

#### Sections:
1. **Products Hero**
   - Title: "Our Eyewear Collection"
   - Subtitle: Quality promise

2. **Frame Collections**
   - 3 Categories:
     - **Designer Frames** (£150+): Ray-Ban, Oakley, Tom Ford, Gucci, Prada
     - **Premium Collection** (£95+): Calvin Klein, Ted Baker, Police, Superdry
     - **Essential Range** (£45+): In-house collection, basics

3. **Lens Technology**
   - 3 Types:
     - **Single Vision**: Standard to ultra-thin options
     - **Varifocal**: Essential to Elite options
     - **Specialist**: Bifocal, office, sports, safety

4. **Lens Enhancements**
   - 4 Coating Options:
     - **Anti-Reflection** (£40+): Reduces glare
     - **Blue Light Protection** (£50+): Digital screen protection
     - **Scratch Resistant** (£30+): Durability protection
     - **Transitions®** (£75+): Automatic tinting

5. **Eye Health Products**
   - 3 Categories:
     - Contact Lens Care
     - Eye Comfort products
     - Accessories

6. **Products CTA**
   - "Find Your Perfect Eyewear"
   - Link to consultation booking

### 5. Contact Page (`contact.html`)
**Purpose**: Generate leads and provide information

#### Sections:
1. **Contact Hero**
   - Title: "Get in Touch"
   - Subtitle: Booking encouragement

2. **Contact Grid** (2-column layout)
   - **Contact Information**:
     - Phone: 07123 456789
     - Email: info@homevisitoptometrist.co.uk
     - Hours: Mon-Fri 9-6, Sat 9-4, Sun by appointment
     - Service Area: Bradford and surrounding areas
   
   - **Contact Form**:
     - Name (required)
     - Email (required) 
     - Phone (optional)
     - Service Required (dropdown)
     - Message (required)
     - Floating label animation

3. **FAQ Section**
   - Accordion-style questions:
     - What areas do you cover?
     - How do I request an appointment?
     - What should I prepare for the visit?
     - Do you accept NHS patients?

---

## Interactive Features

### JavaScript Functionality
1. **Postcode Checker** (`postcode-checker.js`)
   - Real-time validation
   - Coverage area verification
   - Success/error messaging
   - Loading states

2. **Interactive Features** (`interactive-features.js`)
   - Testimonial carousel
   - FAQ accordion
   - Form label animations
   - Smooth scrolling
   - Hover effects

3. **Mobile Navigation**
   - Responsive hamburger menu
   - Touch-friendly interactions

4. **Scroll Animations**
   - Intersection Observer API
   - Staggered reveal animations
   - Smooth fade-in effects

### Responsive Design
- **Desktop**: Full grid layouts, hover effects
- **Tablet**: Responsive grids, touch-friendly
- **Mobile**: Single column, simplified navigation

---

## Technical Implementation

### CSS Architecture
- **CSS Variables**: Consistent color management
- **Grid Layouts**: Modern responsive design
- **Flexbox**: Component-level alignment
- **Animations**: CSS transitions and transforms
- **Mobile-First**: Progressive enhancement

### File Structure
```
/css/modern-theme.css          # Main stylesheet
/js/postcode-checker.js        # Homepage functionality
/js/interactive-features.js    # Site-wide interactions
/js/contact.js                 # Contact form handling
/images/petru-profile.jpg      # Profile photo
```

### Performance Considerations
- **Font Loading**: Preconnect to Google Fonts
- **Image Optimization**: Optimized profile images
- **CSS**: Single stylesheet for consistency
- **JavaScript**: Deferred loading for performance

---

## Design Principles

### Accessibility
- **Color Contrast**: WCAG AA compliant
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML structure
- **Focus States**: Clear visual indicators

### User Experience
- **Clear Navigation**: Consistent across all pages
- **Fast Loading**: Optimized assets
- **Mobile-First**: Touch-friendly interface
- **Progressive Enhancement**: Works without JavaScript

### Brand Identity
- **Professional**: Healthcare-appropriate design
- **Trustworthy**: Clean, modern aesthetic
- **Accessible**: Easy-to-use interface
- **Personal**: Warm, approachable tone 