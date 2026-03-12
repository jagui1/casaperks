const residents = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'nate.craddock',
    passwordHash:
      '$2b$10$ZbVla9dWxH1F2jM1AxUU4OZGMh51.zU.wP0eG0uDN1t5J5Pz4638K', // bcrypt hash of 'resident16'
    role: 'resident',
    fullName: 'Nate Craddock',
    unit: '4B',
    pointsBalance: 1450
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'jeremy.aguillon',
    passwordHash:
      '$2b$10$9hM3EJX7QyH8XJ5hZ3MZJOU3bO2iTzA8E5/1h6fLpI7F8aM4R2C9K', // bcrypt hash of 'resident17'
    role: 'resident',
    fullName: 'Jeremy Aguillon',
    unit: '17A',
    pointsBalance: 320
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    username: 'admin',
    passwordHash:
      '$2b$10$ynWKVyyvgLkVDjxZZgdX8uE5d9smpUALHG8APt9Pd6R6n/BYQOjBW', // bcrypt hash of 'admin@casa1'
    role: 'admin',
    fullName: 'CasaPerks Admin',
    unit: null,
    pointsBalance: 0
  }
];

const transactions = [
  // Nate Craddock transactions
  {
    id: '44444444-4444-4444-4444-444444444441',
    residentId: '11111111-1111-1111-1111-111111111111',
    type: 'credit',
    description: 'On-time rent — December',
    points: 200,
    createdAt: '2025-12-01T00:00:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444442',
    residentId: '11111111-1111-1111-1111-111111111111',
    type: 'redemption',
    description: 'Redeemed: Amazon Gift Card',
    points: -500,
    createdAt: '2025-12-20T00:00:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444443',
    residentId: '11111111-1111-1111-1111-111111111111',
    type: 'credit',
    description: 'On-time rent — January',
    points: 200,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    residentId: '11111111-1111-1111-1111-111111111111',
    type: 'credit',
    description: 'Referral bonus',
    points: 500,
    createdAt: '2026-01-15T00:00:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444445',
    residentId: '11111111-1111-1111-1111-111111111111',
    type: 'credit',
    description: 'On-time rent — February',
    points: 200,
    createdAt: '2026-02-01T00:00:00Z'
  },

  // Jeremy Aguillon transactions
  {
    id: '55555555-5555-5555-5555-555555555551',
    residentId: '22222222-2222-2222-2222-222222222222',
    type: 'credit',
    description: 'On-time rent — January',
    points: 200,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: '55555555-5555-5555-5555-555555555552',
    residentId: '22222222-2222-2222-2222-222222222222',
    type: 'credit',
    description: 'On-time rent — February',
    points: 200,
    createdAt: '2026-02-01T00:00:00Z'
  },
  {
    id: '55555555-5555-5555-5555-555555555553',
    residentId: '22222222-2222-2222-2222-222222222222',
    type: 'redemption',
    description: 'Redeemed: Target Gift Card',
    points: -80,
    createdAt: '2026-02-10T00:00:00Z'
  }
];

const giftCards = [
  {
    id: '66666666-6666-6666-6666-666666666661',
    brand: 'Amazon',
    pointCost: 500,
    imageUrl: null
  },
  {
    id: '66666666-6666-6666-6666-666666666662',
    brand: 'Target',
    pointCost: 300,
    imageUrl: null
  },
  {
    id: '66666666-6666-6666-6666-666666666663',
    brand: 'Starbucks',
    pointCost: 200,
    imageUrl: null
  },
  {
    id: '66666666-6666-6666-6666-666666666664',
    brand: 'Visa',
    pointCost: 1000,
    imageUrl: null
  },
  {
    id: '66666666-6666-6666-6666-666666666665',
    brand: 'iTunes',
    pointCost: 150,
    imageUrl: null
  }
];

module.exports = {
  residents,
  transactions,
  giftCards
};

