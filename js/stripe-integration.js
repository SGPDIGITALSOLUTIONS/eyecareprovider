// Stripe Integration for Advanced Eye Care Plan
// This file handles the Stripe checkout process for subscription payments

class StripeIntegration {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Main CTA button
        const mainCheckoutBtn = document.getElementById('stripe-checkout-btn');
        if (mainCheckoutBtn) {
            mainCheckoutBtn.addEventListener('click', (e) => this.handleCheckout(e));
        }

        // Secondary CTA button
        const secondaryCheckoutBtn = document.querySelector('.stripe-checkout-secondary');
        if (secondaryCheckoutBtn) {
            secondaryCheckoutBtn.addEventListener('click', (e) => this.handleCheckout(e));
        }
    }

    async handleCheckout(event) {
        event.preventDefault();
        
        const button = event.target;
        const productName = button.dataset.productName;
        const amount = button.dataset.amount;
        const currency = button.dataset.currency;
        const interval = button.dataset.interval;

        // Disable button during processing
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Processing...';

        try {
            // Create checkout session
            const response = await fetch('http://localhost:4242/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_name: productName,
                    amount: amount,
                    currency: currency,
                    interval: interval,
                    customer_email: this.getCustomerEmail()
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            // Redirect to Stripe Checkout
            window.location.href = data.checkout_url;

        } catch (error) {
            console.error('Stripe checkout error:', error);
            
            // Show user-friendly error message
            const errorMessage = error.message || 'There was an error processing your request. Please try again or contact support.';
            
            // You could replace this with a more elegant modal/notification
            alert(`Payment Error: ${errorMessage}`);
            
        } finally {
            // Re-enable button
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    getCustomerEmail() {
        // Try to get email from contact form if available
        const emailInput = document.querySelector('input[type="email"]');
        return emailInput ? emailInput.value : '';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StripeIntegration();
});

// Export for use in other files if needed
window.StripeIntegration = StripeIntegration;
