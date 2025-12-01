// scripts/generate-mock-data.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper functions for generating realistic data
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Shirley', 'Eric', 'Angela', 'Jonathan', 'Helen', 'Stephen', 'Anna',
  'Larry', 'Brenda', 'Justin', 'Pamela', 'Scott', 'Nicole', 'Brandon', 'Emma',
  'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra',
  'Frank', 'Rachel', 'Alexander', 'Catherine', 'Patrick', 'Carolyn', 'Raymond', 'Janet',
  'Jack', 'Ruth', 'Dennis', 'Maria', 'Jerry', 'Heather', 'Tyler', 'Diane'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson'
];

const companyTypes = ['Corp', 'Inc', 'LLC', 'Ltd', 'Group', 'Solutions', 'Technologies', 'Services', 'Enterprises', 'Industries'];
const companyPrefixes = ['Tech', 'Global', 'Digital', 'Smart', 'Innovative', 'Advanced', 'Premier', 'Elite', 'Dynamic', 'Strategic', 'Quantum', 'Alpha', 'Beta', 'Omega'];
const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Park Ave', 'Washington Blvd', 'Lake Dr', 'Hill St'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];

const productCategories = ['Software', 'Hardware', 'Service', 'Consulting', 'Training', 'Support', 'Licensing', 'Subscription'];
const productPrefixes = ['Premium', 'Professional', 'Enterprise', 'Standard', 'Basic', 'Advanced', 'Ultimate', 'Deluxe'];
const productTypes = ['Package', 'Suite', 'Plan', 'Bundle', 'License', 'Subscription', 'Service', 'Solution'];

const roles = ['admin', 'manager', 'accountant', 'sales', 'support', 'developer'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function generateEmail(firstName: string, lastName: string, domain?: string): string {
  const domains = domain ? [domain] : ['example.com', 'email.com', 'mail.com', 'test.com', 'demo.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(domains)}`;
}

function generatePhone(): string {
  return `555-${String(randomInt(1000, 9999))}`;
}

function generateDate(startYear: number, endYear: number): string {
  const year = randomInt(startYear, endYear);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return new Date(year, month - 1, day).toISOString();
}

// Generate customers
function generateCustomers(count: number) {
  const customers = [];
  for (let i = 1; i <= count; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    customers.push({
      id: `CUST-${i}`,
      name: `${firstName} ${lastName}`,
      email: generateEmail(firstName, lastName),
      phone: generatePhone(),
      createdAt: generateDate(2020, 2024)
    });
  }
  return customers;
}

// Generate products
function generateProducts(count: number) {
  const products = [];
  for (let i = 1; i <= count; i++) {
    const prefix = randomElement(productPrefixes);
    const type = randomElement(productTypes);
    const category = randomElement(productCategories);
    products.push({
      id: `PROD-${i}`,
      name: `${prefix} ${category} ${type}`,
      price: randomInt(10, 1000),
      category: category
    });
  }
  return products;
}

// Generate companies
function generateCompanies(count: number) {
  const companies = [];
  for (let i = 1; i <= count; i++) {
    const prefix = randomElement(companyPrefixes);
    const type = randomElement(companyTypes);
    const streetNum = randomInt(100, 9999);
    const street = randomElement(streets);
    const city = randomElement(cities);
    companies.push({
      id: `COM-${i}`,
      name: `${prefix} ${type}`,
      address: `${streetNum} ${street}, ${city}`,
      taxId: `TAX-${String(randomInt(100000, 999999))}`
    });
  }
  return companies;
}

// Generate users
function generateUsers(count: number) {
  const users = [];
  for (let i = 1; i <= count; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    users.push({
      id: `USR-${i}`,
      name: `${firstName} ${lastName}`,
      email: generateEmail(firstName, lastName, 'company.com'),
      role: randomElement(roles)
    });
  }
  return users;
}

// Generate invoices
function generateInvoices(count: number, customers: any[], products: any[]) {
  const invoices = [];
  const statuses = ['draft', 'sent', 'paid'];

  for (let i = 1; i <= count; i++) {
    const customer = randomElement(customers);
    const numItems = randomInt(1, 5);
    const items = [];

    for (let j = 0; j < numItems; j++) {
      const product = randomElement(products);
      const quantity = randomInt(1, 10);
      const price = product.price;
      items.push({
        description: product.name,
        quantity,
        price,
        total: quantity * price
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    invoices.push({
      id: `INV-${i}`,
      customerId: customer.id,
      customerName: customer.name,
      items,
      subtotal,
      tax,
      total,
      createdAt: generateDate(2023, 2024),
      status: randomElement(statuses)
    });
  }

  return invoices;
}

// Main generation
console.log('🔄 Generating mock data...');

const customers = generateCustomers(1000);
const products = generateProducts(500);
const companies = generateCompanies(100);
const users = generateUsers(50);
const invoices = generateInvoices(2000, customers, products);

const mockData = {
  users,
  companies,
  customers,
  products,
  invoices
};

// Write to file
const outputPath = path.join(__dirname, '../src/data/mock-data.json');
fs.writeFileSync(outputPath, JSON.stringify(mockData, null, 2));

console.log('✅ Mock data generated successfully!');
console.log(`   - ${users.length} users`);
console.log(`   - ${companies.length} companies`);
console.log(`   - ${customers.length} customers`);
console.log(`   - ${products.length} products`);
console.log(`   - ${invoices.length} invoices`);
console.log(`   📁 Saved to: ${outputPath}`);
