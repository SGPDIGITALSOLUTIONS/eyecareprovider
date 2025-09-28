// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            const expanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !expanded);
            navLinks.classList.toggle('mobile-active');
            
            // Animate hamburger menu
            const spans = navToggle.querySelectorAll('span');
            if (navLinks.classList.contains('mobile-active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close menu when a link is clicked (mobile UX)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-active');
                navToggle.setAttribute('aria-expanded', 'false');
                
                // Reset hamburger animation
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }
});

// Testimonial Carousel
document.addEventListener('DOMContentLoaded', function() {
    const testimonials = document.querySelectorAll('.testimonial');
    const prevButton = document.querySelector('.testimonial-prev');
    const nextButton = document.querySelector('.testimonial-next');
    const dots = document.querySelectorAll('.dot');
    let currentTestimonial = 0;

    if (testimonials.length > 0) {
        function showTestimonial(index) {
            testimonials.forEach(testimonial => testimonial.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            testimonials[index].classList.add('active');
            if (dots[index]) {
                dots[index].classList.add('active');
            }
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                currentTestimonial = (currentTestimonial + 1) % testimonials.length;
                showTestimonial(currentTestimonial);
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
                showTestimonial(currentTestimonial);
            });
        }

        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentTestimonial = index;
                showTestimonial(currentTestimonial);
            });
        });

        // Auto-advance testimonials every 5 seconds
        setInterval(() => {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            showTestimonial(currentTestimonial);
        }, 5000);
    }
});

// Contact Form Handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (validateContactForm()) {
                // Show loading state
                const submitButton = contactForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Sending Message...';
                submitButton.disabled = true;
                
                // Simulate form submission (replace with actual API call)
                setTimeout(() => {
                    showSuccessMessage();
                    contactForm.reset();
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }, 2000);
            }
        });
    }
    
    function validateContactForm() {
        const requiredFields = contactForm.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                clearFieldError(field);
            }
        });
        
        // Validate email format
        const emailField = contactForm.querySelector('input[type="email"]');
        if (emailField && emailField.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailField.value)) {
                showFieldError(emailField, 'Please enter a valid email address');
                isValid = false;
            }
        }
        
        // Validate phone format (basic UK phone validation)
        const phoneField = contactForm.querySelector('input[type="tel"]');
        if (phoneField && phoneField.value) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(phoneField.value)) {
                showFieldError(phoneField, 'Please enter a valid phone number');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    function showFieldError(field, message) {
        clearFieldError(field);
        field.style.borderColor = '#dc2626';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#dc2626';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }
    
    function clearFieldError(field) {
        field.style.borderColor = '';
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
    
    function showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #059669;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        successDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>✓</span>
                <span>Message sent successfully! We'll get back to you soon.</span>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Animate in
        setTimeout(() => {
            successDiv.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            successDiv.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.remove();
                }
            }, 300);
        }, 5000);
    }
});

// Navbar Background on Scroll
window.addEventListener('scroll', function() {
    const nav = document.querySelector('.main-nav');
    if (window.scrollY > 50) {
        nav.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        nav.style.backdropFilter = 'blur(10px)';
    } else {
        nav.style.backgroundColor = '#ffffff';
        nav.style.backdropFilter = 'none';
    }
});

// Intersection Observer for Animation Triggers
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for scroll animations
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.service-card, .benefit-card, .value-card');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Service Card Interaction
document.addEventListener('DOMContentLoaded', function() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Keyboard Navigation Enhancement
document.addEventListener('keydown', function(e) {
    // Escape key closes mobile menu
    if (e.key === 'Escape') {
        const navLinks = document.querySelector('.nav-links');
        const navToggle = document.querySelector('.mobile-nav-toggle');
        if (navLinks && navLinks.classList.contains('mobile-active')) {
            navLinks.classList.remove('mobile-active');
            navToggle.setAttribute('aria-expanded', 'false');
            
            // Reset hamburger animation
            const spans = navToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    }
});

// Add scroll-to-top functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create scroll-to-top button
    const scrollToTopButton = document.createElement('button');
    scrollToTopButton.innerHTML = '↑';
    scrollToTopButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border: none;
        border-radius: 50%;
        background: #4B8A8A;
        color: white;
        font-size: 20px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    `;
    scrollToTopButton.setAttribute('aria-label', 'Scroll to top');
    
    document.body.appendChild(scrollToTopButton);
    
    // Show/hide scroll-to-top button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTopButton.style.opacity = '1';
            scrollToTopButton.style.visibility = 'visible';
        } else {
            scrollToTopButton.style.opacity = '0';
            scrollToTopButton.style.visibility = 'hidden';
        }
    });
    
    // Scroll to top when button is clicked
    scrollToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// Hero Image Rotation
document.addEventListener('DOMContentLoaded', function() {
    // Image fallback URLs
    const fallbackImages = {
        'equipment.jpg': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'home-setting.jpg': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'eye-health.jpg': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'personal-care.jpg': 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    };

    // Check for broken images and use fallbacks
    document.querySelectorAll('.image-slide img').forEach(img => {
        img.addEventListener('error', function() {
            const filename = this.src.split('/').pop();
            if (fallbackImages[filename]) {
                console.log(`Loading fallback image for ${filename}`);
                this.src = fallbackImages[filename];
            }
        });
    });

    const slides = document.querySelectorAll('.image-slide');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;
    let slideInterval;

    if (slides.length > 0) {
        function showSlide(index) {
            // Remove active class from all slides and indicators
            slides.forEach(slide => slide.classList.remove('active'));
            indicators.forEach(indicator => indicator.classList.remove('active'));
            
            // Add active class to current slide and indicator
            slides[index].classList.add('active');
            indicators[index].classList.add('active');
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }

        function startSlideshow() {
            slideInterval = setInterval(nextSlide, 4000); // Change image every 4 seconds
        }

        function stopSlideshow() {
            clearInterval(slideInterval);
        }

        // Add click handlers to indicators
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
                stopSlideshow();
                startSlideshow(); // Restart the interval
            });
        });

        // Pause slideshow on hover
        const heroImageSection = document.querySelector('.hero-image-section');
        if (heroImageSection) {
            heroImageSection.addEventListener('mouseenter', stopSlideshow);
            heroImageSection.addEventListener('mouseleave', startSlideshow);
        }

        // Start the slideshow
        startSlideshow();
    }
});

// Area Coverage Checker
function checkCoverage() {
    const postcodeInput = document.getElementById('postcodeSearch');
    const resultDiv = document.getElementById('coverageResult');
    const postcode = postcodeInput.value.trim().toUpperCase();
    
    // Clear previous results
    resultDiv.className = 'coverage-result';
    resultDiv.innerHTML = '';
    
    if (!postcode) {
        showResult('Please enter a postcode to check coverage.', 'warning');
        return;
    }
    
    // Basic UK postcode validation
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode)) {
        showResult('Please enter a valid UK postcode (e.g. BD1 2AB).', 'warning');
        return;
    }
    
    // Simulate API call with loading state
    resultDiv.innerHTML = '<div style="text-align: center; color: var(--text-light);">🔍 Checking coverage...</div>';
    resultDiv.classList.add('show');
    
    setTimeout(() => {
        // Simulate coverage check based on postcode area
        const fullPostcode = postcode.replace(/\s/g, ''); // Remove spaces for easier matching
        
        // Extract the letter part of the postcode (1 or 2 letters at the start)
        const areaMatch = fullPostcode.match(/^([A-Z]{1,2})/);
        if (!areaMatch) {
            showResult('Invalid postcode format.', 'warning');
            return;
        }
        const area = areaMatch[1];
        
        // Primary coverage areas - full service available
        const primaryAreas = ['BD', 'LS', 'HX', 'HD', 'WF', 'HG', 'YO', 'DN', 'HU', 'BB', 'BL', 'FY', 'LA', 'M', 'PR', 'WN', 'CA', 'NE', 'DH', 'DL', 'TS'];
        
        // Check for Sheffield specific postcodes (S1-S36, S60-S66, S70-S75, S80, S81)
        const isSheffieldCovered = () => {
            if (area !== 'S') return false;
            
            // Extract the number part after 'S' (only the district number, not the full postcode)
            const numberMatch = fullPostcode.match(/^S(\d{1,2})/);
            if (!numberMatch) return false;
            
            const number = parseInt(numberMatch[1]);
            
            // Check if it falls within our coverage ranges
            return (number >= 1 && number <= 36) ||
                   (number >= 60 && number <= 66) ||
                   (number >= 70 && number <= 75) ||
                   number === 80 ||
                   number === 81;
        };
        
        if (primaryAreas.includes(area) || isSheffieldCovered()) {
            showResult(
                `✅ Great news! We provide home visits to ${postcode}.<br>
                <strong>📞 Call us now:</strong> 07737886713<br>
                <strong>💷 NHS & Private appointments available</strong>`, 
                'success'
            );
        } else if (extendedAreas.includes(area)) {
            showResult(
                `ℹ️ We may cover ${postcode} depending on exact location.<br>
                <strong>Please call us to confirm:</strong> 07737886713<br>
                We're expanding our service areas regularly!`, 
                'info'
            );
        } else {
            showResult(
                `📍 We don't currently cover ${postcode}, but we're expanding!<br>
                <strong>Contact us:</strong> info@eyecareprovider.co.uk<br>
                We'll notify you when we reach your area.`, 
                'warning'
            );
        }
    }, 1500);
}

function showResult(message, type) {
    const resultDiv = document.getElementById('coverageResult');
    resultDiv.innerHTML = message;
    resultDiv.className = `coverage-result show ${type}`;
}

// Add enter key support for postcode search
document.addEventListener('DOMContentLoaded', function() {
    const postcodeInput = document.getElementById('postcodeSearch');
    if (postcodeInput) {
        postcodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkCoverage();
            }
        });
        
        // Format postcode as user types
        postcodeInput.addEventListener('input', function(e) {
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (value.length > 3) {
                value = value.substring(0, value.length - 3) + ' ' + value.substring(value.length - 3);
            }
            e.target.value = value;
        });
    }
});

// Console log for development
console.log('I Care Services website loaded successfully! 🏥👁️');
console.log('Professional eye health experts - Better service, better prices, convenient care.'); 