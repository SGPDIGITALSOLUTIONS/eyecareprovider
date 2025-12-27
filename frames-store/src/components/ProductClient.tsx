'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LENS_TYPES,
  LENS_THICKNESS,
  LENS_COATINGS,
  calculateLensPrice,
  formatLensOptionsForAttributes,
  type SelectedLensOptions,
  type PrescriptionFields,
} from '@/lib/lenses';
import { addItemToCart } from '@/lib/cart';

interface Variant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: {
    amount: string;
    currencyCode: string;
  };
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  image?: {
    url: string;
    altText?: string;
  };
}

interface Product {
  id: string;
  title: string;
  descriptionHtml?: string;
  images: {
    nodes: Array<{
      url: string;
      altText?: string;
    }>;
  };
  variants: {
    nodes: Variant[];
  };
}

interface ProductClientProps {
  product: Product;
}

export default function ProductClient({ product }: ProductClientProps) {
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedColour, setSelectedColour] = useState<string>('');
  const [lensOptions, setLensOptions] = useState<SelectedLensOptions>({
    lensType: 'singleVision',
    thickness: 'standard',
    coatings: [],
    prescription: {},
  });
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState<string>('');

  // Initialize with first available variant
  useEffect(() => {
    const firstAvailable = product.variants.nodes.find((v) => v.availableForSale);
    if (firstAvailable) {
      setSelectedVariantId(firstAvailable.id);
      const colourOption = firstAvailable.selectedOptions.find(
        (opt) => opt.name === 'Colour'
      );
      if (colourOption) {
        setSelectedColour(colourOption.value);
      }
    }
  }, [product]);

  const selectedVariant = product.variants.nodes.find((v) => v.id === selectedVariantId);
  const basePrice = selectedVariant
    ? parseFloat(selectedVariant.price.amount)
    : 0;
  const lensPrice = calculateLensPrice(lensOptions);
  const totalPrice = basePrice + lensPrice;

  // Get available colours from variants
  const colours = Array.from(
    new Set(
      product.variants.nodes
        .filter((v) => v.availableForSale)
        .map((v) => {
          const colourOpt = v.selectedOptions.find((opt) => opt.name === 'Colour');
          return colourOpt?.value || '';
        })
        .filter(Boolean)
    )
  );

  const handleColourChange = (colour: string) => {
    const variant = product.variants.nodes.find(
      (v) =>
        v.availableForSale &&
        v.selectedOptions.find((opt) => opt.name === 'Colour' && opt.value === colour)
    );
    if (variant) {
      setSelectedVariantId(variant.id);
      setSelectedColour(colour);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariantId) {
      setError('Please select a colour');
      return;
    }

    setIsAddingToCart(true);
    setError('');

    try {
      const attributes = formatLensOptionsForAttributes(lensOptions);
      
      // Add colour to attributes if available
      if (selectedColour) {
        attributes.unshift({ key: 'Colour', value: selectedColour });
      }

      const result = await addItemToCart(selectedVariantId, 1, attributes);

      if (result.success && result.cart) {
        router.push('/cart');
      } else {
        setError(result.errors.join(', ') || 'Failed to add to cart');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Add to cart error:', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Get display image
  const displayImage =
    selectedVariant?.image?.url ||
    product.images.nodes[0]?.url ||
    '/placeholder-frame.jpg';

  return (
    <div className="product-client">
      <div className="product-layout">
        {/* Image Section */}
        <div className="product-images">
          <div className="main-image">
            <img src={displayImage} alt={product.title} />
          </div>
        </div>

        {/* Product Info */}
        <div className="product-details">
          <h1>{product.title}</h1>

          {/* Price Display */}
          <div className="price-section">
            <div className="base-price">
              Frame: £{basePrice.toFixed(2)}
            </div>
            {lensPrice > 0 && (
              <div className="lens-price">
                Lenses: +£{lensPrice.toFixed(2)}
              </div>
            )}
            <div className="total-price">
              Total: £{totalPrice.toFixed(2)}
            </div>
          </div>

          {/* Colour Selector */}
          <div className="selector-section">
            <label>Colour</label>
            <div className="colour-options">
              {colours.map((colour) => (
                <button
                  key={colour}
                  className={`colour-option ${selectedColour === colour ? 'active' : ''}`}
                  onClick={() => handleColourChange(colour)}
                  style={{
                    backgroundColor: colour.toLowerCase(),
                    border: selectedColour === colour ? '3px solid #4b8a8a' : '2px solid #d7dde1',
                  }}
                  title={colour}
                />
              ))}
            </div>
          </div>

          {/* Lens Type Selector */}
          <div className="selector-section">
            <label>Lens Type</label>
            <select
              value={lensOptions.lensType}
              onChange={(e) =>
                setLensOptions({ ...lensOptions, lensType: e.target.value })
              }
            >
              {LENS_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label} {type.priceDelta > 0 ? `(+£${type.priceDelta})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Lens Thickness */}
          <div className="selector-section">
            <label>Lens Thickness</label>
            <select
              value={lensOptions.thickness}
              onChange={(e) =>
                setLensOptions({ ...lensOptions, thickness: e.target.value })
              }
            >
              {LENS_THICKNESS.map((thickness) => (
                <option key={thickness.id} value={thickness.id}>
                  {thickness.label} {thickness.priceDelta > 0 ? `(+£${thickness.priceDelta})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Coatings */}
          <div className="selector-section">
            <label>Coatings</label>
            <div className="checkbox-group">
              {LENS_COATINGS.filter((c) => c.id !== 'none').map((coating) => (
                <label key={coating.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={lensOptions.coatings.includes(coating.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLensOptions({
                          ...lensOptions,
                          coatings: [...lensOptions.coatings, coating.id],
                        });
                      } else {
                        setLensOptions({
                          ...lensOptions,
                          coatings: lensOptions.coatings.filter((id) => id !== coating.id),
                        });
                      }
                    }}
                  />
                  <span>
                    {coating.label} {coating.priceDelta > 0 ? `(+£${coating.priceDelta})` : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Prescription Form */}
          <div className="prescription-section">
            <h3>Prescription Details</h3>
            <div className="prescription-grid">
              <div className="prescription-column">
                <h4>Right Eye (OD)</h4>
                <div className="prescription-field">
                  <label>SPH</label>
                  <input
                    type="text"
                    placeholder="e.g., -2.50"
                    value={lensOptions.prescription.rightSph || ''}
                    onChange={(e) =>
                      setLensOptions({
                        ...lensOptions,
                        prescription: {
                          ...lensOptions.prescription,
                          rightSph: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="prescription-field">
                  <label>CYL</label>
                  <input
                    type="text"
                    placeholder="e.g., -0.75"
                    value={lensOptions.prescription.rightCyl || ''}
                    onChange={(e) =>
                      setLensOptions({
                        ...lensOptions,
                        prescription: {
                          ...lensOptions.prescription,
                          rightCyl: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="prescription-field">
                  <label>AXIS</label>
                  <input
                    type="text"
                    placeholder="e.g., 180"
                    value={lensOptions.prescription.rightAxis || ''}
                    onChange={(e) =>
                      setLensOptions({
                        ...lensOptions,
                        prescription: {
                          ...lensOptions.prescription,
                          rightAxis: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="prescription-column">
                <h4>Left Eye (OS)</h4>
                <div className="prescription-field">
                  <label>SPH</label>
                  <input
                    type="text"
                    placeholder="e.g., -2.50"
                    value={lensOptions.prescription.leftSph || ''}
                    onChange={(e) =>
                      setLensOptions({
                        ...lensOptions,
                        prescription: {
                          ...lensOptions.prescription,
                          leftSph: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="prescription-field">
                  <label>CYL</label>
                  <input
                    type="text"
                    placeholder="e.g., -0.75"
                    value={lensOptions.prescription.leftCyl || ''}
                    onChange={(e) =>
                      setLensOptions({
                        ...lensOptions,
                        prescription: {
                          ...lensOptions.prescription,
                          leftCyl: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="prescription-field">
                  <label>AXIS</label>
                  <input
                    type="text"
                    placeholder="e.g., 180"
                    value={lensOptions.prescription.leftAxis || ''}
                    onChange={(e) =>
                      setLensOptions({
                        ...lensOptions,
                        prescription: {
                          ...lensOptions.prescription,
                          leftAxis: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="prescription-additional">
              <div className="prescription-field">
                <label>PD (Pupillary Distance)</label>
                <input
                  type="text"
                  placeholder="e.g., 62"
                  value={lensOptions.prescription.pd || ''}
                  onChange={(e) =>
                    setLensOptions({
                      ...lensOptions,
                      prescription: {
                        ...lensOptions.prescription,
                        pd: e.target.value,
                      },
                    })
                  }
                />
              </div>
              {(lensOptions.lensType === 'varifocal' || lensOptions.lensType === 'bifocal') && (
                <div className="prescription-field">
                  <label>ADD</label>
                  <input
                    type="text"
                    placeholder="e.g., +2.00"
                    value={lensOptions.prescription.add || ''}
                    onChange={(e) =>
                      setLensOptions({
                        ...lensOptions,
                        prescription: {
                          ...lensOptions.prescription,
                          add: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}
              <div className="prescription-field full-width">
                <label>Notes</label>
                <textarea
                  placeholder="Any additional prescription notes..."
                  value={lensOptions.prescription.notes || ''}
                  onChange={(e) =>
                    setLensOptions({
                      ...lensOptions,
                      prescription: {
                        ...lensOptions.prescription,
                        notes: e.target.value,
                      },
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Add to Cart Button */}
          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={isAddingToCart || !selectedVariantId}
          >
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .product-client {
          padding: 2rem 1rem;
          background: #f4f7f8;
          min-height: 100vh;
        }

        .product-layout {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }

        .product-images {
          position: sticky;
          top: 2rem;
          height: fit-content;
        }

        .main-image {
          width: 100%;
          aspect-ratio: 1;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-details {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .product-details h1 {
          font-size: 2rem;
          color: #5b6770;
          margin-bottom: 1.5rem;
        }

        .price-section {
          background: #f4f7f8;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .base-price,
        .lens-price {
          font-size: 0.9rem;
          color: #5b6770;
          margin-bottom: 0.5rem;
        }

        .total-price {
          font-size: 1.5rem;
          font-weight: 600;
          color: #4b8a8a;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 2px solid #d7dde1;
        }

        .selector-section {
          margin-bottom: 1.5rem;
        }

        .selector-section label {
          display: block;
          font-weight: 600;
          color: #5b6770;
          margin-bottom: 0.5rem;
        }

        .selector-section select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #d7dde1;
          border-radius: 8px;
          font-size: 1rem;
          background: white;
          color: #5b6770;
        }

        .colour-options {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .colour-option {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .colour-option:hover {
          transform: scale(1.1);
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: normal;
        }

        .checkbox-label input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .prescription-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #d7dde1;
        }

        .prescription-section h3 {
          color: #5b6770;
          margin-bottom: 1rem;
        }

        .prescription-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .prescription-column h4 {
          color: #4b8a8a;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .prescription-field {
          margin-bottom: 1rem;
        }

        .prescription-field label {
          display: block;
          font-size: 0.9rem;
          color: #5b6770;
          margin-bottom: 0.25rem;
        }

        .prescription-field input,
        .prescription-field textarea {
          width: 100%;
          padding: 0.5rem;
          border: 2px solid #d7dde1;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .prescription-field.full-width {
          grid-column: 1 / -1;
        }

        .prescription-additional {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .add-to-cart-btn {
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
          margin-top: 1rem;
        }

        .add-to-cart-btn:hover:not(:disabled) {
          background: #3a6f6f;
        }

        .add-to-cart-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 968px) {
          .product-layout {
            grid-template-columns: 1fr;
          }

          .product-images {
            position: static;
          }

          .prescription-grid,
          .prescription-additional {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

