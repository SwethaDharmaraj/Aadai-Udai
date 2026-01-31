const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aadaiudai';

const categories = {
  "MEN'S COLLECTION": ['Shirt', 'Pants', 'Vesti', 'Trousers', 'Lungi', 'Innerwear', 'Thundu', 'Coat', 'Salvar'],
  "WOMEN'S COLLECTION": ['Saree', 'Chudi', 'Western Tops', 'Jeans', 'Frocks', 'Lehengas', 'Half Saree', 'Butta Saree', 'Fancy Saree', 'Ethnic Wear'],
  "KIDS COLLECTION": ['Frocks', 'Western Dress', 'Night Dress', 'Kids Gloves', 'Kids Caps', 'Kids Carry Bag', 'Kids Gift Box', 'Kids Urine Mat', 'Kids Bed Sheet'],
  "GENERAL ITEMS": ['Bed Sheet', 'Kerchief', 'Eeral Thundu', 'Scarf', 'Sweater', 'Raincoat', 'Belt'],
  "ACCESSORIES": ['Chain', 'Necklace', 'Clips', 'Bands', 'Comb', 'Money Bag'],
  "GOD ITEMS": ['Dollar', 'Malai', 'Samy Thundu', 'Samy Saree']
};

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const products = [];

// Generate products for EACH category
for (const [cat, subCats] of Object.entries(categories)) {
  // We want at least 10 items per main category.
  // There are subCats.length subcategories. 
  // We'll generate at least 2 items per subcategory to ensure coverage.
  const itemsPerSub = 10; // As requested: nearly 10 products each item

  for (const sub of subCats) {
    for (let i = 1; i <= itemsPerSub; i++) {
      products.push({
        name: `${sub} ${i === 1 ? 'Premium Edition' : 'Collection ' + i}`,
        description: `Experience the elegance of our ${sub}. Crafted from high-quality materials, this ${sub} is perfect for daily wear or special occasions. Part of our exclusive ${cat} signature line.`,
        category: cat,
        subCategory: sub,
        price: Math.floor(Math.random() * 2000) + 500,
        sizes: sizes,
        stock: Math.floor(Math.random() * 50) + 10,
        images: Array.from({ length: 10 }, (_, j) => `https://placehold.co/600x800/8b1538/e8d48b?text=${sub.replace(' ', '+')}+${i}.${j + 1}`),
        featured: Math.random() > 0.9
      });
    }
  }
}

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await Product.deleteMany({});
    console.log('Existing products cleared');

    await Product.insertMany(products);
    console.log(`${products.length} products seeded successfully!`);

    process.exit();
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
