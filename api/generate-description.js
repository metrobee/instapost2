// Mushroom description generator

// Mushroom descriptions database
const mushroomDescriptions = {
    // Boletus family
    'Boletus edulis': [
        "This prized edible mushroom, known as the king bolete, has a distinctive brown cap and thick stem with a fine white net-like pattern. It forms mycorrhizal relationships with various trees, especially pine and spruce.",
        "One of the most sought-after edible mushrooms, with a rich, nutty flavor and meaty texture. The cap can range from light tan to dark brown, and the pores underneath are white when young, turning yellow-green with age."
    ],
    'Boletus': [
        "Members of the Boletus genus are characterized by their spongy pore surface instead of gills. Many species are edible and prized for their culinary value.",
        "Boletes are fleshy mushrooms with tubes and pores instead of gills. They typically grow in mycorrhizal relationships with trees and are found in forest habitats."
    ],
    
    // Amanita family
    'Amanita muscaria': [
        "This iconic red mushroom with white spots contains psychoactive compounds and has been used in shamanic rituals. It forms mycorrhizal relationships primarily with birch and pine trees.",
        "The fly agaric is instantly recognizable with its bright red cap adorned with white warts. Despite its toxicity, it has cultural significance in many societies and is often depicted in fairy tales."
    ],
    'Amanita': [
        "The Amanita genus contains some of the most toxic mushrooms known, as well as some edible species. They typically have white gills, a ring on the stem, and a cup-like volva at the base.",
        "Amanitas are characterized by their universal veil, which often leaves remnants on the cap and forms a sack-like structure at the base of the stem. Many species contain deadly toxins."
    ],
    
    // Cantharellus family
    'Cantharellus cibarius': [
        "The golden chanterelle is a highly prized edible mushroom with a fruity aroma reminiscent of apricots. Its distinctive funnel shape and false gills make it easily identifiable.",
        "This bright yellow to orange mushroom has a trumpet-like shape with ridges instead of true gills. It grows in symbiotic relationships with various trees and is valued for its delicate flavor."
    ],
    'Cantharellus': [
        "Chanterelles are characterized by their funnel-shaped caps and false gills that appear as forked ridges running down the stem. Most species are edible and highly valued.",
        "Members of this genus typically have bright yellow to orange coloration and a fruity aroma. They form mycorrhizal relationships with forest trees and are found in woodland habitats."
    ],
    
    // Russula family
    'Russula': [
        "Russulas are characterized by their brittle flesh that breaks like chalk. They come in a variety of cap colors, from red to purple, green, and yellow.",
        "These mushrooms have distinctive fragile gills and stems that snap cleanly like chalk. Many species form mycorrhizal relationships with specific tree species."
    ],
    
    // Lactarius family
    'Lactarius': [
        "Lactarius species exude a milky latex when cut or broken, which can be white, colored, or change color upon exposure to air. They form mycorrhizal relationships with various trees.",
        "Known as milk-caps, these mushrooms produce a characteristic milky fluid when damaged. The color and taste of this 'milk' are important identification features."
    ],
    
    // Other common genera
    'Mycena': [
        "Mycenas are small, delicate mushrooms with conical caps and thin stems. Many species have a distinctive smell and some display bioluminescence in the dark.",
        "These small, often colorful mushrooms typically grow on wood or forest debris. Some species have bell-shaped caps and can be found in various colors including pink, purple, and blue."
    ],
    'Cortinarius': [
        "Cortinarius is the largest genus of mushrooms, known for their rusty brown spores and cortina (a cobweb-like partial veil). Many species contain toxins that can cause kidney damage.",
        "These mushrooms often have colorful caps and a characteristic web-like veil connecting the cap to the stem when young. They form mycorrhizal relationships with various trees."
    ],
    'Agaricus': [
        "The Agaricus genus includes the common button mushroom found in supermarkets. They have chocolate-brown spores and a ring on the stem but no volva at the base.",
        "These mushrooms typically have white to brown caps, free gills that start pink and turn chocolate-brown, and a prominent ring on the stem. Many species are edible."
    ],
    'Pleurotus': [
        "Oyster mushrooms grow in shelf-like clusters on dead or dying trees. They have decurrent gills and an eccentric to lateral stem or no stem at all.",
        "These wood-decomposing mushrooms have a distinctive fan or oyster-shaped cap and are prized for their culinary value and medicinal properties."
    ],
    'Morchella': [
        "Morels have a distinctive honeycomb-patterned cap and are highly prized edible mushrooms. They typically appear in spring, often after forest fires.",
        "These spring-fruiting mushrooms have a unique honeycomb structure on their caps. They must be cooked thoroughly before consumption as they contain toxins when raw."
    ],
    'Hericium': [
        "Lion's mane mushrooms have a distinctive appearance with long, cascading spines instead of gills or pores. They grow on hardwood trees and have medicinal properties.",
        "These unusual fungi resemble a waterfall of icicles or a lion's mane. They have been used in traditional medicine and are being studied for their potential cognitive benefits."
    ],
    'Ganoderma': [
        "Reishi mushrooms have a glossy, varnished appearance and woody texture. They have been used in traditional Asian medicine for centuries.",
        "These shelf-like polypores have a distinctive lacquered appearance and grow on dead or dying trees. They are valued for their potential immune-boosting properties."
    ],
    'Fomitopsis': [
        "These bracket fungi are important decomposers of dead wood. They have a tough, woody texture and can persist for many years, adding new growth layers annually.",
        "These perennial polypores play a crucial role in forest ecosystems by breaking down dead wood. Some species are indicators of old-growth forests with high conservation value."
    ],
    'Crustoderma': [
        "Crustoderma species form thin, crust-like fruiting bodies on dead wood. They play an important role in decomposition processes in forest ecosystems.",
        "These resupinate fungi form flat, crust-like structures on the underside of fallen logs. Some species are indicators of old-growth forests with high ecological value."
    ]
};

// Generic descriptions for when we don't have a specific match
const genericDescriptions = [
    "This fascinating fungus is an important part of the forest ecosystem, contributing to nutrient cycling and supporting biodiversity.",
    "Found in its natural woodland habitat, this mushroom species plays a vital role in the decomposition of organic matter.",
    "This interesting specimen showcases the incredible diversity of fungi in our forests. Each species has unique ecological relationships.",
    "A beautiful example of forest fungi, demonstrating the important role these organisms play in ecosystem health and biodiversity.",
    "This mushroom species is part of the complex web of life in forest ecosystems, forming relationships with plants and other organisms."
];

// Function to get a description for a mushroom species
function getMushroomDescription(latinName) {
    // Try to find an exact match
    if (mushroomDescriptions[latinName]) {
        const descriptions = mushroomDescriptions[latinName];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
    
    // Try to find a match for the genus
    const genus = latinName.split(' ')[0];
    if (mushroomDescriptions[genus]) {
        const descriptions = mushroomDescriptions[genus];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
    
    // Return a generic description
    return genericDescriptions[Math.floor(Math.random() * genericDescriptions.length)];
}

module.exports = {
    getMushroomDescription
};