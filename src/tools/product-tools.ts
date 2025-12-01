// src/tools/product-tools.ts
import { tool } from "@openai/agents";
import { z } from "zod";
import { products, Product } from "../data/store.js";

export const createProduct = tool({
  name: "create_product",
  description: "Create a new product",
  parameters: z.object({
    name: z.string().describe("Product name"),
    price: z.number().describe("Price"),
    category: z.string().describe("Category"),
  }),
  execute: async ({ name, price, category }) => {
    console.log('[create_product] Executing with params:', { name, price, category });
    const id = `PROD-${Date.now()}`;
    const product: Product = { id, name, price, category };
    products.set(id, product);
    return JSON.stringify(product, null, 2);
  },
});

export const getProduct = tool({
  name: "get_product",
  description: "Get product by ID",
  parameters: z.object({
    id: z.string().describe("Product ID"),
  }),
  execute: async ({ id }) => {
    console.log('[get_product] Executing with params:', { id });
    const product = products.get(id);
    return product ? JSON.stringify(product, null, 2) : JSON.stringify({ error: "Product not found" });
  },
});

export const listProducts = tool({
  name: "list_products",
  description: "Search for products by name or category. REQUIRED: Must provide a non-empty search query. Returns max 20 matching products.",
  parameters: z.object({
    query: z.string().describe("Search query for product name or category (required, cannot be empty). Use this to find specific products."),
  }),
  execute: async ({ query }) => {
    console.log('[list_products] Executing with params:', { query });

    // Validate query is not empty
    if (!query || query.trim() === '') {
      return JSON.stringify({ error: "Query parameter is required and cannot be empty. Please provide a search term." }, null, 2);
    }

    const startTime = Date.now();
    const lower = query.toLowerCase();
    let results = Array.from(products.values()).filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower)
    );

    // Limit to max 20 results
    const totalFound = results.length;
    results = results.slice(0, 20);

    const elapsed = Date.now() - startTime;
    console.log(`[list_products] Found ${totalFound} results (returning ${results.length}) in ${elapsed}ms`);
    return JSON.stringify(results, null, 2);
  },
});

export const updateProduct = tool({
  name: "update_product",
  description: "Update product details",
  parameters: z.object({
    id: z.string().describe("Product ID"),
    name: z.string().nullable(),
    price: z.number().nullable(),
    category: z.string().nullable(),
  }),
  execute: async ({ id, name, price, category }) => {
    console.log('[update_product] Executing with params:', { id, name, price, category });
    const product = products.get(id);
    if (!product) return JSON.stringify({ error: "Product not found" });
    if (name) product.name = name;
    if (price) product.price = price;
    if (category) product.category = category;
    products.set(id, product);
    return JSON.stringify(product, null, 2);
  },
});

export const deleteProduct = tool({
  name: "delete_product",
  description: "Delete a product",
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    console.log('[delete_product] Executing with params:', { id });
    const deleted = products.delete(id);
    return JSON.stringify({ success: deleted }, null, 2);
  },
});
