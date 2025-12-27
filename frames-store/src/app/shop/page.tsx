import Link from 'next/link';
import { shopifyFetch } from '@/lib/shopify';
import { PRODUCTS_QUERY } from '@/lib/queries';

interface Product {
  id: string;
  title: string;
  handle: string;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  tags: string[];
}

async function getProducts(tag?: string): Promise<Product[]> {
  const query = tag ? `tag:${tag}` : undefined;
  
  const response = await shopifyFetch<{
    products: {
      edges: Array<{
        node: Product;
      }>;
    };
  }>(PRODUCTS_QUERY, {
    first: 50,
    query,
  });

  if (response.errors || !response.data) {
    console.error('Error fetching products:', response.errors);
    return [];
  }

  return response.data.products.edges.map((edge) => edge.node);
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { tag?: string };
}) {
  const products = await getProducts(searchParams.tag);

  return (
    <div className="shop-page">
      <div className="container">
        <header className="shop-header">
          <h1>Frame Collections</h1>
          <p>Browse our premium eyewear selection</p>
        </header>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <Link
            href="/shop"
            className={!searchParams.tag ? 'active' : ''}
          >
            All Frames
          </Link>
          <Link
            href="/shop?tag=men"
            className={searchParams.tag === 'men' ? 'active' : ''}
          >
            Men
          </Link>
          <Link
            href="/shop?tag=women"
            className={searchParams.tag === 'women' ? 'active' : ''}
          >
            Women
          </Link>
          <Link
            href="/shop?tag=unisex"
            className={searchParams.tag === 'unisex' ? 'active' : ''}
          >
            Unisex
          </Link>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="no-products">
            <p>No products found. Please check your Shopify configuration.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.handle}`}
                className="product-card"
              >
                {product.featuredImage && (
                  <div className="product-image">
                    <img
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                    />
                  </div>
                )}
                <div className="product-info">
                  <h3>{product.title}</h3>
                  <p className="product-price">
                    From £{parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .shop-page {
          min-height: 100vh;
          padding: 2rem 1rem;
          background: #f4f7f8;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .shop-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .shop-header h1 {
          font-size: 2.5rem;
          color: #5b6770;
          margin-bottom: 0.5rem;
        }

        .shop-header p {
          color: #5b6770;
          font-size: 1.1rem;
        }

        .filter-tabs {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .filter-tabs a {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 2px solid #d7dde1;
          border-radius: 8px;
          text-decoration: none;
          color: #5b6770;
          font-weight: 500;
          transition: all 0.3s;
        }

        .filter-tabs a:hover,
        .filter-tabs a.active {
          background: #4b8a8a;
          color: white;
          border-color: #4b8a8a;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }

        .product-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .product-image {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: #f4f7f8;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-info {
          padding: 1.5rem;
        }

        .product-info h3 {
          font-size: 1.25rem;
          color: #5b6770;
          margin-bottom: 0.5rem;
        }

        .product-price {
          font-size: 1.1rem;
          font-weight: 600;
          color: #4b8a8a;
        }

        .no-products {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
        }

        .no-products p {
          color: #5b6770;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1.5rem;
          }

          .shop-header h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}

