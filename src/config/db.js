// src/config/db.js
const { PrismaClient } = require('@prisma/client');

// Create a single, shared instance of the PrismaClient
const prisma = new PrismaClient();

module.exports = prisma;
