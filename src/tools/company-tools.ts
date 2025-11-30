// src/tools/company-tools.ts
import { tool } from "@openai/agents";
import { z } from "zod";
import { companies, Company } from "../data/store.js";

export const createCompany = tool({
  name: "create_company",
  description: "Create a new company",
  parameters: z.object({
    name: z.string().describe("Company name"),
    address: z.string().describe("Address"),
    taxId: z.string().describe("Tax ID"),
  }),
  execute: async ({ name, address, taxId }) => {
    console.log('[create_company] Executing with params:', { name, address, taxId });
    const id = `COM-${Date.now()}`;
    const company: Company = { id, name, address, taxId };
    companies.set(id, company);
    return JSON.stringify(company, null, 2);
  },
});

export const getCompany = tool({
  name: "get_company",
  description: "Get company by ID",
  parameters: z.object({
    id: z.string().describe("Company ID"),
  }),
  execute: async ({ id }) => {
    console.log('[get_company] Executing with params:', { id });
    const company = companies.get(id);
    return company ? JSON.stringify(company, null, 2) : JSON.stringify({ error: "Company not found" });
  },
});

export const listCompanies = tool({
  name: "list_companies",
  description: "List companies or search by name",
  parameters: z.object({
    query: z.string().nullable().describe("Search query"),
  }),
  execute: async ({ query }) => {
    console.log('[list_companies] Executing with params:', { query });
    let allCompanies = Array.from(companies.values());
    if (query) {
      const lower = query.toLowerCase();
      allCompanies = allCompanies.filter(c => c.name.toLowerCase().includes(lower));
    }
    return JSON.stringify(allCompanies, null, 2);
  },
});

export const updateCompany = tool({
  name: "update_company",
  description: "Update company details",
  parameters: z.object({
    id: z.string().describe("Company ID"),
    name: z.string().nullable(),
    address: z.string().nullable(),
    taxId: z.string().nullable(),
  }),
  execute: async ({ id, name, address, taxId }) => {
    console.log('[update_company] Executing with params:', { id, name, address, taxId });
    const company = companies.get(id);
    if (!company) return JSON.stringify({ error: "Company not found" });
    if (name) company.name = name;
    if (address) company.address = address;
    if (taxId) company.taxId = taxId;
    companies.set(id, company);
    return JSON.stringify(company, null, 2);
  },
});

export const deleteCompany = tool({
  name: "delete_company",
  description: "Delete a company",
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    console.log('[delete_company] Executing with params:', { id });
    const deleted = companies.delete(id);
    return JSON.stringify({ success: deleted }, null, 2);
  },
});
