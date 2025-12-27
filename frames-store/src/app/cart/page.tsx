'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCartId, getCart, updateCartLines, removeCartLines, type Cart } from '@/lib/cart';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const cartId = getCartId();
    if (!cartId) {
      setLoading(false);
      return;
    }

    const result = await getCart(cartId);
    if (result.errors.length > 0) {
      setError(result.errors.join(', '));
      setLoading(false);
      return;
    }

    setCart(result.cart);
    setLoading(false);
  };

  const handleQuantityChange = async (lineId: string, newQuantity: number) => {
    if (!cart) return;

    if (newQuantity <= 0) {
      await handleRemoveLine(lineId);
      return;
    }

    const result = await updateCartLines(cart.id, [{ id: lineId, quantity: newQuantity }]);
    if (result.errors.length === 0 && result.cart) {
      setCart(result.cart);
    } else {
      setError(result.errors.join(', '));
    }
  };

  const handleRemoveLine = async (lineId: string) => {
    if (!cart) return;

    const result = await removeCartLines(cart.id, [lineId]);
    if (result.errors.length === 0 && result.cart) {
      setCart(result.cart);
    } else {
      setError(result.errors.join(', '));
    }
  };

  const handleCheckout = () => {
    if (cart?.checkoutUrl) {
      window.location.href = cart.checkoutUrl;
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="container">
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.lines.edges.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <h1>Your Cart</h1>
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <button onClick={() => router.push('/shop')} className="btn-primary">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Your Cart</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="cart-items">
          {cart.lines.edges.map(({ node: line }) => {
            const variant = line.merchandise;
            const price = parseFloat(variant.price.amount);
            const lineTotal = price * line.quantity;

            return (
              <div key={line.id} className="cart-item">
                {variant.image && (
                  <div className="item-image">
                    <img src={variant.image.url} alt={variant.image.altText || variant.product.title} />
                  </div>
                )}
                <div className="item-details">
                  <h3>{variant.product.title}</h3>
                  <p className="variant-title">{variant.title}</p>
                  
                  {/* Display attributes */}
                  {line.attributes.length > 0 && (
                    <div className="item-attributes">
                      {line.attributes.map((attr, idx) => (
                        <div key={idx} className="attribute">
                          <strong>{attr.key}:</strong> {attr.value}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="item-price">£{price.toFixed(2)}</div>
                </div>
                <div className="item-controls">
                  <div className="quantity-controls">
                    <button
                      onClick={() => handleQuantityChange(line.id, line.quantity - 1)}
                      className="qty-btn"
                    >
                      -
                    </button>
                    <span className="quantity">{line.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(line.id, line.quantity + 1)}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>
                  <div className="line-total">£{lineTotal.toFixed(2)}</div>
                  <button
                    onClick={() => handleRemoveLine(line.id)}
                    className="remove-btn"
                    aria-label="Remove item"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>£{parseFloat(cart.cost.totalAmount.amount).toFixed(2)}</span>
          </div>
          <div className="summary-note">
            <p>Shipping and taxes calculated at checkout</p>
          </div>
          <button onClick={handleCheckout} className="checkout-btn">
            Proceed to Checkout
          </button>
          <button onClick={() => router.push('/shop')} className="continue-shopping">
            Continue Shopping
          </button>
        </div>
      </div>

      <style jsx>{`
        .cart-page {
          min-height: 100vh;
          padding: 2rem 1rem;
          background: #f4f7f8;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .cart-page h1 {
          font-size: 2.5rem;
          color: #5b6770;
          margin-bottom: 2rem;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .empty-cart {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
        }

        .empty-cart p {
          font-size: 1.2rem;
          color: #5b6770;
          margin-bottom: 1.5rem;
        }

        .cart-items {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .cart-item {
          display: grid;
          grid-template-columns: 120px 1fr auto;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-bottom: 1px solid #d7dde1;
        }

        .cart-item:last-child {
          border-bottom: none;
        }

        .item-image {
          width: 120px;
          height: 120px;
          background: #f4f7f8;
          border-radius: 8px;
          overflow: hidden;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details h3 {
          font-size: 1.2rem;
          color: #5b6770;
          margin-bottom: 0.5rem;
        }

        .variant-title {
          color: #5b6770;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .item-attributes {
          margin: 0.75rem 0;
          font-size: 0.85rem;
          color: #5b6770;
        }

        .attribute {
          margin-bottom: 0.25rem;
        }

        .item-price {
          font-size: 1.1rem;
          font-weight: 600;
          color: #4b8a8a;
          margin-top: 0.5rem;
        }

        .item-controls {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1rem;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 2px solid #d7dde1;
          border-radius: 8px;
          padding: 0.25rem;
        }

        .qty-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f4f7f8;
          color: #5b6770;
          font-size: 1.2rem;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .qty-btn:hover {
          background: #d7dde1;
        }

        .quantity {
          min-width: 30px;
          text-align: center;
          font-weight: 600;
          color: #5b6770;
        }

        .line-total {
          font-size: 1.2rem;
          font-weight: 600;
          color: #4b8a8a;
        }

        .remove-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          color: #c33;
          border: 1px solid #c33;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: #c33;
          color: white;
        }

        .cart-summary {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 1.2rem;
          font-weight: 600;
          color: #5b6770;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #d7dde1;
        }

        .summary-note {
          margin-bottom: 1.5rem;
        }

        .summary-note p {
          font-size: 0.9rem;
          color: #5b6770;
        }

        .checkout-btn,
        .btn-primary {
          width: 100%;
          padding: 1rem 2rem;
          background: #4b8a8a;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
          margin-bottom: 1rem;
        }

        .checkout-btn:hover,
        .btn-primary:hover {
          background: #3a6f6f;
        }

        .continue-shopping {
          width: 100%;
          padding: 0.75rem 2rem;
          background: transparent;
          color: #4b8a8a;
          border: 2px solid #4b8a8a;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .continue-shopping:hover {
          background: #4b8a8a;
          color: white;
        }

        @media (max-width: 768px) {
          .cart-item {
            grid-template-columns: 100px 1fr;
            gap: 1rem;
          }

          .item-controls {
            grid-column: 1 / -1;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}

