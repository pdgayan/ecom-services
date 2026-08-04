const express = require("express");
const cors = require("cors");
//
const app = express();
app.use(cors());
app.use(express.json());

const imageUrls = {
  tacticalRadio: "https://www.bittium.com/wp-content/uploads/2024/09/bittium-tough-sdr-handheld-radio-1-img-750x750.jpg",
  tacticalUav: "https://nextgendefense.com/wp-content/uploads/2026/04/stud.jpg",
  armoredVehicle: "https://picsum.photos/seed/armored-vehicle/1200/800",
  electronicWarfare: "https://picsum.photos/seed/electronic-warfare/1200/800",
  bodyArmor: "https://picsum.photos/seed/body-armor/1200/800",
  commandCenter: "https://picsum.photos/seed/command-center/1200/800",
};

const products = [
  {
    id: "prod-001",
    name: "AN/PRC-163 Multi-Channel Tactical Radio",
    manufacturer: "Northwind Defense Systems",
    category: "Communications",
    categoryId: "communications",
    image_url: imageUrls.tacticalRadio,
    availability: "In Stock",
    certification: ["NATO STANAG 4204", "MIL-STD-810H", "FIPS 140-3"],
    country: "United States",
    stock: 340,
    leadTime: "4-6 weeks",
    price: 18500,
    priceUnit: "USD/unit",
    description:
      "Wideband multi-channel tactical radio system supporting voice, data, and video transmissions across multiple waveforms including SINCGARS, HaveQuick II, and SATURN.",
    specifications: {
      "Frequency Range": "30 MHz – 2.5 GHz",
      Waveforms: "SINCGARS, HaveQuick II, SATURN, Link-16",
      "Power Output": "10W RF",
      Weight: "1.8 kg",
      "Battery Life": "14 hours",
      Encryption: "AES-256, Type 1 NSA",
      "Operating Temp": "-40°C to +70°C",
      "IP Rating": "IP67",
    },
    documents: [
      {
        id: "doc-001",
        name: "Technical Manual TM-11-5820-890",
        type: "PDF",
        size: "4.2 MB",
      },
      {
        id: "doc-002",
        name: "NATO STANAG Compliance Certificate",
        type: "PDF",
        size: "1.1 MB",
      },
    ],
    supplierId: "sup-001",
    condition: "New",
    natoStockNumber: "5820-01-583-9876",
    exportControl: "ITAR Category XI",
  },
  {
    id: "prod-002",
    name: "Predator MKII Tactical UAV System",
    manufacturer: "Atlas Secure Technologies",
    category: "Unmanned Systems",
    categoryId: "unmanned-systems",
    image_url: imageUrls.tacticalUav,
    availability: "Limited",
    certification: ["DO-178C", "MIL-STD-461G", "NATO STANAG 4670"],
    country: "Israel",
    stock: 12,
    leadTime: "12-16 weeks",
    price: 2800000,
    priceUnit: "USD/system",
    description:
      "Medium-altitude long-endurance tactical UAV designed for persistent ISR missions.",
    specifications: {
      Wingspan: "14.8 m",
      "Max Endurance": "36 hours",
      "Service Ceiling": "25,000 ft",
      "Payload Capacity": "340 kg",
      "Max Speed": "220 km/h",
      "Data Link Range": "200 km",
      "Sensor Suite": "EO/IR, SAR, SIGINT",
      "GCS Crew": "2 operators",
    },
    documents: [
      {
        id: "doc-003",
        name: "System Specifications Datasheet",
        type: "PDF",
        size: "8.7 MB",
      },
      {
        id: "doc-004",
        name: "Export Compliance Certificate",
        type: "PDF",
        size: "2.3 MB",
      },
    ],
    supplierId: "sup-005",
    condition: "New",
    natoStockNumber: "1550-IL-447-2291",
    exportControl: "EAR99 / ECCN 9A012",
  },
  {
    id: "prod-003",
    name: "Leopard APC Mk.III Armored Personnel Carrier",
    manufacturer: "Titan Dynamics",
    category: "Ground Vehicles",
    categoryId: "ground-vehicles",
    image_url: imageUrls.armoredVehicle,
    availability: "On Order",
    certification: ["NATO STANAG 4569", "AEP-55", "MIL-STD-1686"],
    country: "Germany",
    stock: 0,
    leadTime: "18-24 months",
    price: 4200000,
    priceUnit: "USD/unit",
    description:
      "8x8 wheeled armored personnel carrier with Level 4 ballistic protection.",
    specifications: {
      "Crew + Troops": "3 + 12",
      "Combat Weight": "30 tonnes",
      Engine: "700 hp MTU diesel",
      "Max Road Speed": "105 km/h",
      Range: "800 km",
      "Armor Level": "STANAG 4569 Level 4",
      Amphibious: "Yes",
      "NBC Protection": "Collective",
    },
    documents: [
      {
        id: "doc-005",
        name: "Vehicle Technical Specification",
        type: "PDF",
        size: "12.4 MB",
      },
      {
        id: "doc-006",
        name: "STANAG 4569 Compliance Report",
        type: "PDF",
        size: "3.8 MB",
      },
    ],
    supplierId: "sup-003",
    condition: "New",
    natoStockNumber: "2350-DE-112-8834",
    exportControl: "EU Dual Use Regulation",
  },
  {
    id: "prod-004",
    name: "THOR-X Electronic Warfare Suite",
    manufacturer: "Aegis Aerospace",
    category: "Cyber Defense",
    categoryId: "cyber-defense",
    image_url: imageUrls.electronicWarfare,
    availability: "In Stock",
    certification: ["MIL-STD-461G", "DEF STAN 59-411", "NATO AWFC"],
    country: "United Kingdom",
    stock: 28,
    leadTime: "8-10 weeks",
    price: 6800000,
    priceUnit: "USD/system",
    description: "Broadband electronic warfare system.",
    specifications: {
      "Frequency Coverage": "20 MHz – 18 GHz",
      "Instantaneous BW": "500 MHz",
      "Direction Finding": "360° / ±2° accuracy",
      "Output Power": "2 kW peak",
      Processing: "Real-time AI-enhanced",
      Interfaces: "MIL-STD-1553B, Ethernet",
      MTBF: ">1,200 hours",
      Weight: "68 kg (base unit)",
    },
    documents: [
      {
        id: "doc-007",
        name: "System Overview Document",
        type: "PDF",
        size: "6.1 MB",
      },
      {
        id: "doc-008",
        name: "DEF STAN Compliance Certificate",
        type: "PDF",
        size: "1.9 MB",
      },
    ],
    supplierId: "sup-002",
    condition: "New",
    natoStockNumber: "5895-GB-889-3317",
    exportControl: "UK ML 11(a)",
  },
  {
    id: "prod-005",
    name: "Sentinels-9 Body Armor System",
    manufacturer: "Orion Tactical Solutions",
    category: "Personal Protection",
    categoryId: "personal-protection",
    image_url: imageUrls.bodyArmor,
    availability: "In Stock",
    certification: ["NIJ 0101.07 Level IV", "STANAG 4569", "DGA Approved"],
    country: "France",
    stock: 1840,
    leadTime: "2-3 weeks",
    price: 4200,
    priceUnit: "USD/set",
    description: "Next-generation modular body armor.",
    specifications: {
      "Protections Level": "NIJ 0101.07 Level IV",
      "Plate Material": "Multi-Curve SiC/Polyethylene",
      "Coverage Area": "0.38 m² front + rear",
      "Weight (Full)": "8.2 kg",
      "Threat Resistance": "7.62x51 AP at 800 m/s",
      "Side Panels": "Level IIIA integrated",
      Carrier: "CORDURA 500D PALS/MOLLE",
      Sizes: "XS through 3XL",
    },
    documents: [
      {
        id: "doc-009",
        name: "NIJ Ballistic Test Report",
        type: "PDF",
        size: "5.3 MB",
      },
    ],
    supplierId: "sup-004",
    condition: "New",
    natoStockNumber: "8470-FR-224-9901",
    exportControl: "EAR99",
  },
  {
    id: "prod-006",
    name: "Horizon C2 Battle Management System",
    manufacturer: "Northwind Defense Systems",
    category: "Command & Control",
    categoryId: "command-control",
    image_url: imageUrls.commandCenter,
    availability: "In Stock",
    certification: ["DO-278A", "MIL-STD-2525D", "NATO ADatP-3"],
    country: "United States",
    stock: 7,
    leadTime: "6-8 weeks",
    price: 12500000,
    priceUnit: "USD/system",
    description: "Integrated battalion-level battle management system.",
    specifications: {
      "Users Supported": "Up to 5,000 concurrent",
      "Data Standards": "NFFI, MIP, Link-16, VMF",
      Mapping: "DTED Level 2, VMAP",
      "Update Rate": "<500ms latency",
      Redundancy: "Dual hot-standby servers",
      Encryption: "NSA Type 1 Suite B",
      Platform: "Linux Red Hat Enterprise",
      Licensing: "Perpetual + 5yr support",
    },
    documents: [
      {
        id: "doc-010",
        name: "System Architecture Document",
        type: "PDF",
        size: "18.2 MB",
      },
      {
        id: "doc-011",
        name: "NATO Interoperability Certificate",
        type: "PDF",
        size: "4.2 MB",
      },
    ],
    supplierId: "sup-001",
    condition: "New",
    natoStockNumber: "7010-US-338-1124",
    exportControl: "ITAR Category XI(c)",
  },
];

// GET /catalog/products
app.get("/catalog/products", (req, res) => {
  res.json(products);
});

// GET /products/:id
app.get("/catalog/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

const PORT = 4002;
app.listen(PORT, () =>
  console.log(`catalog-service running on http://localhost:${PORT}`),
);
