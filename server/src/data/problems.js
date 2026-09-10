module.exports = [
  {
    id: 'parking-lot',
    title: 'Parking Lot',
    difficulty: 'Medium',
    description:
      'Design a parking system supporting multiple floors, vehicle types, and spot types.',
    statement:
      'Create a parking lot that accepts vehicles, allocates compatible spots, issues tickets, and calculates fees when vehicles exit.',
    requirements: [
      'Multiple parking floors',
      'Cars, bikes, and trucks',
      'Different parking spot types',
      'Vehicle entry and exit',
      'Ticket generation',
      'Fee calculation',
    ],
    constraints: [
      'A spot holds one vehicle at a time.',
      'Pricing rules may change.',
      'Assume payment succeeds after calculation.',
    ],
    consider: [
      'Ownership of floors and spots',
      'Allocation and pricing boundaries',
      'Ticket lifecycle and failure states',
    ],
  },
  {
    id: 'elevator-system',
    title: 'Elevator System',
    difficulty: 'Hard',
    description:
      'Design an elevator controller that coordinates multiple cars and passenger requests.',
    statement:
      'Build an elevator system for a multi-floor building. It accepts hall and car requests, assigns cars, and handles movement safely.',
    requirements: [
      'Multiple elevator cars',
      'Hall and in-car requests',
      'Direction-aware scheduling',
      'Door and movement states',
      'Capacity handling',
    ],
    constraints: [
      'Assume a single building.',
      'Safety checks precede movement.',
      'Prioritization may evolve.',
    ],
    consider: [
      'Car state modelling',
      'Dispatching policy',
      'Requests, queues, and testability',
    ],
  },
  {
    id: 'vending-machine',
    title: 'Vending Machine',
    difficulty: 'Medium',
    description:
      'Design a vending machine with inventory, payment, dispensing, and change.',
    statement:
      'Build a vending machine that shows products, accepts payment, dispenses stock, returns change, and handles failure cases.',
    requirements: [
      'Product selection',
      'Inventory tracking',
      'Payment acceptance',
      'Change calculation',
      'Dispensing and cancellation',
    ],
    constraints: [
      'Use supported denominations only.',
      'Inventory may run out.',
      'Hardware integration is simulated.',
    ],
    consider: [
      'State transitions',
      'Payment and inventory consistency',
      'Extensible payment methods',
    ],
  },
];
