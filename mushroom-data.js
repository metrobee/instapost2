// Common mushroom species data for autocomplete
const mushroomSpecies = [
    // Boletus family
    "Boletus edulis",
    "Boletus reticulatus",
    "Boletus pinophilus",
    "Boletus aereus",
    "Boletus appendiculatus",
    "Boletus calopus",
    "Boletus erythropus",
    "Boletus luridus",
    "Boletus regius",
    "Boletus satanas",
    
    // Amanita family
    "Amanita muscaria",
    "Amanita phalloides",
    "Amanita caesarea",
    "Amanita rubescens",
    "Amanita pantherina",
    "Amanita citrina",
    "Amanita vaginata",
    
    // Cantharellus family
    "Cantharellus cibarius",
    "Cantharellus tubaeformis",
    "Cantharellus lutescens",
    
    // Russula family
    "Russula virescens",
    "Russula cyanoxantha",
    "Russula emetica",
    "Russula xerampelina",
    
    // Lactarius family
    "Lactarius deliciosus",
    "Lactarius deterrimus",
    "Lactarius rufus",
    "Lactarius torminosus",
    
    // Other common species
    "Macrolepiota procera",
    "Coprinus comatus",
    "Agaricus campestris",
    "Agaricus bisporus",
    "Pleurotus ostreatus",
    "Morchella esculenta",
    "Craterellus cornucopioides",
    "Hydnum repandum",
    "Suillus luteus",
    "Suillus grevillei",
    "Leccinum scabrum",
    "Leccinum aurantiacum",
    "Gyromitra esculenta",
    "Tricholoma matsutake",
    "Tricholoma terreum",
    "Armillaria mellea",
    "Hygrophorus russula",
    "Clitocybe nebularis",
    "Lepista nuda",
    "Calocybe gambosa",
    "Marasmius oreades",
    "Flammulina velutipes",
    "Hypholoma fasciculare",
    "Ganoderma lucidum",
    "Fistulina hepatica",
    "Laetiporus sulphureus",
    "Sparassis crispa",
    "Hericium erinaceus",
    "Auricularia auricula-judae",
    "Tremella mesenterica",
    "Lycoperdon perlatum",
    "Calvatia gigantea",
    "Phallus impudicus",
    "Tuber melanosporum",
    "Tuber magnatum",
    "Crustoderma dryinum"
];

// Make available in browser and Node.js
if (typeof window !== 'undefined') {
    window.mushroomSpecies = mushroomSpecies;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mushroomSpecies };
}