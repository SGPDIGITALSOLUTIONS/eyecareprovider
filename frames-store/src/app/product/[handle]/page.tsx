import { shopifyFetch } from '@/lib/shopify';
import { PRODUCT_BY_HANDLE_QUERY } from '@/lib/queries';
import ProductClient from '@/components/ProductClient';
import { notFound } from 'next/navigation';

interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  images: {
    nodes: Array<{
      url: string;
      altText?: string;
    }>;
  };
  variants: {
    nodes: Array<{
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
    }>;
  };
}

async function getProduct(handle: string): Promise<Product | null> {
  const response = await shopifyFetch<{
    product: Product | null;
  }>(PRODUCT_BY_HANDLE_QUERY, {
    handle,
  });

  if (response.errors || !response.data) {
    console.error('Error fetching product:', response.errors);
    return null;
  }

  return response.data.product;
}

export default async function ProductPage({
  params,
}: {
  params: { handle: string };
}) {
  const product = await getProduct(params.handle);

  if (!product) {
    notFound();
  }

  return <ProductClient product={product} />;
}

