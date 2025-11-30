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
  description: "List products or search by name/category",
  parameters: z.object({
    query: z.string().nullable().describe("Search query"),
  }),
  execute: async ({ query }) => {
    console.log('[list_products] Executing with params:', { query });
    let allProducts = Array.from(products.values());
    if (query) {
      const lower = query.toLowerCase();
      allProducts = allProducts.filter(p => p.name.toLowerCase().includes(lower) || p.category.toLowerCase().includes(lower));
    }
    return JSON.stringify(allProducts, null, 2);
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
