# Assets Directory

This folder contains all static assets for the I Care Services website.

## Directory Structure

```
assets/
├── images/
│   ├── carousel/           # Hero section rotating images
│   ├── gallery/           # Additional gallery images
│   └── profile/           # Profile and team photos
└── documents/             # PDFs, brochures, etc.
```

## Carousel Images (`/images/carousel/`)

The hero section carousel requires 4 high-quality images (recommended: 1200x800px, JPEG format):

### Required Images:

1. **`equipment.jpg`** - Professional eye examination equipment
   - Shows optometry equipment, autorefractor, tonometer
   - Caption: "Professional Equipment"

2. **`home-setting.jpg`** - Comfortable home appointment setting
   - Shows a home visit in progress, comfortable environment
   - Caption: "Comfortable Home Setting"

3. **`eye-health.jpg`** - Eye health assessment/examination
   - Shows close-up of eye examination or health assessment
   - Caption: "Comprehensive Eye Health"

4. **`personal-care.jpg`** - Personal attention and care
   - Shows one-on-one consultation, personal interaction
   - Caption: "Personal Attention"

## Image Guidelines

### Technical Requirements:
- **Resolution**: 1200x800px minimum (3:2 aspect ratio)
- **Format**: JPEG (.jpg) preferred for photos
- **File Size**: Under 500KB each (optimized for web)
- **Quality**: High resolution, professional photography

### Content Guidelines:
- Professional medical/optometry setting
- Clean, modern appearance
- Good lighting and clarity
- Represents home visit concept
- Shows equipment and personal care
- Diverse and inclusive imagery

## Usage

Images are automatically loaded in the hero carousel and rotate every 4 seconds. The file names correspond to the captions and alt text in the HTML.

## Optimization

Before adding images:
1. Resize to 1200x800px
2. Compress using tools like TinyPNG or ImageOptim
3. Ensure fast loading times
4. Test on mobile devices

## Backup Sources

If professional photography isn't available, consider:
- Stock photo sites (Unsplash, Pexels - commercial license)
- Medical equipment suppliers (with permission)
- Staged photos of actual equipment/settings

## Updates

When updating carousel images:
1. Replace files in `/assets/images/carousel/`
2. Keep same filenames to avoid HTML changes
3. Clear browser cache to see updates
4. Test on multiple devices/browsers 