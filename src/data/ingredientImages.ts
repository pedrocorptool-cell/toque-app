import type { ImageSourcePropType } from 'react-native';

import type { Ingredient } from '@/data/recipes';

/**
 * Images d'ingrédients : Fluent Emoji 3D de Microsoft (licence MIT), livrées dans l'app en 96 px.
 * Trois niveaux, du plus juste au plus sûr : l'image de l'ingrédient, celle de sa famille, puis l'icône générique
 * (Figma 986:2). Mieux vaut l'icône générique qu'une image fausse.
 *
 * Les clés et les familles sont aussi listées dans supabase/functions/import-recipe : l'IA en choisit une à l'import.
 */
export const INGREDIENT_IMAGES = {
  apple: require('@/assets/images/ingredients/red_apple.png'),
  avocado: require('@/assets/images/ingredients/avocado.png'),
  bacon: require('@/assets/images/ingredients/bacon.png'),
  baguette: require('@/assets/images/ingredients/baguette_bread.png'),
  banana: require('@/assets/images/ingredients/banana.png'),
  bean: require('@/assets/images/ingredients/beans.png'),
  beef: require('@/assets/images/ingredients/cut_of_meat.png'),
  beer: require('@/assets/images/ingredients/beer_mug.png'),
  bell_pepper: require('@/assets/images/ingredients/bell_pepper.png'),
  blueberry: require('@/assets/images/ingredients/blueberries.png'),
  bread: require('@/assets/images/ingredients/bread.png'),
  broccoli: require('@/assets/images/ingredients/broccoli.png'),
  butter: require('@/assets/images/ingredients/butter.png'),
  canned: require('@/assets/images/ingredients/canned_food.png'),
  carrot: require('@/assets/images/ingredients/carrot.png'),
  champagne: require('@/assets/images/ingredients/bottle_with_popping_cork.png'),
  cheese: require('@/assets/images/ingredients/cheese_wedge.png'),
  cherry: require('@/assets/images/ingredients/cherries.png'),
  chestnut: require('@/assets/images/ingredients/chestnut.png'),
  chicken: require('@/assets/images/ingredients/poultry_leg.png'),
  chili: require('@/assets/images/ingredients/hot_pepper.png'),
  chocolate: require('@/assets/images/ingredients/chocolate_bar.png'),
  coconut: require('@/assets/images/ingredients/coconut.png'),
  coffee: require('@/assets/images/ingredients/hot_beverage.png'),
  corn: require('@/assets/images/ingredients/ear_of_corn.png'),
  crab: require('@/assets/images/ingredients/crab.png'),
  cucumber: require('@/assets/images/ingredients/cucumber.png'),
  egg: require('@/assets/images/ingredients/egg.png'),
  eggplant: require('@/assets/images/ingredients/eggplant.png'),
  fish: require('@/assets/images/ingredients/fish.png'),
  flatbread: require('@/assets/images/ingredients/flatbread.png'),
  garlic: require('@/assets/images/ingredients/garlic.png'),
  ginger: require('@/assets/images/ingredients/ginger_root.png'),
  grape: require('@/assets/images/ingredients/grapes.png'),
  herb: require('@/assets/images/ingredients/herb.png'),
  honey: require('@/assets/images/ingredients/honey_pot.png'),
  ice: require('@/assets/images/ingredients/ice.png'),
  kiwi: require('@/assets/images/ingredients/kiwi_fruit.png'),
  lemon: require('@/assets/images/ingredients/lemon.png'),
  lime: require('@/assets/images/ingredients/lime.png'),
  lobster: require('@/assets/images/ingredients/lobster.png'),
  mango: require('@/assets/images/ingredients/mango.png'),
  meat_on_bone: require('@/assets/images/ingredients/meat_on_bone.png'),
  melon: require('@/assets/images/ingredients/melon.png'),
  milk: require('@/assets/images/ingredients/glass_of_milk.png'),
  mushroom: require('@/assets/images/ingredients/mushroom.png'),
  noodle: require('@/assets/images/ingredients/steaming_bowl.png'),
  octopus: require('@/assets/images/ingredients/octopus.png'),
  olive: require('@/assets/images/ingredients/olive.png'),
  onion: require('@/assets/images/ingredients/onion.png'),
  orange: require('@/assets/images/ingredients/tangerine.png'),
  oyster: require('@/assets/images/ingredients/oyster.png'),
  pasta: require('@/assets/images/ingredients/spaghetti.png'),
  pea: require('@/assets/images/ingredients/pea_pod.png'),
  peach: require('@/assets/images/ingredients/peach.png'),
  peanut: require('@/assets/images/ingredients/peanuts.png'),
  pear: require('@/assets/images/ingredients/pear.png'),
  pineapple: require('@/assets/images/ingredients/pineapple.png'),
  potato: require('@/assets/images/ingredients/potato.png'),
  rice: require('@/assets/images/ingredients/cooked_rice.png'),
  sake: require('@/assets/images/ingredients/sake.png'),
  salad: require('@/assets/images/ingredients/leafy_green.png'),
  salt: require('@/assets/images/ingredients/salt.png'),
  shrimp: require('@/assets/images/ingredients/shrimp.png'),
  squid: require('@/assets/images/ingredients/squid.png'),
  stock: require('@/assets/images/ingredients/pot_of_food.png'),
  strawberry: require('@/assets/images/ingredients/strawberry.png'),
  sweet_potato: require('@/assets/images/ingredients/roasted_sweet_potato.png'),
  tea: require('@/assets/images/ingredients/teacup_without_handle.png'),
  tomato: require('@/assets/images/ingredients/tomato.png'),
  water: require('@/assets/images/ingredients/droplet.png'),
  watermelon: require('@/assets/images/ingredients/watermelon.png'),
  wine: require('@/assets/images/ingredients/wine_glass.png'),
} satisfies Record<string, ImageSourcePropType>;

export type IngredientImage = keyof typeof INGREDIENT_IMAGES;

/** Familles : l'image qui reste juste quand l'ingrédient exact n'a pas la sienne (un panais montre un légume). */
export const FAMILY_IMAGES = {
  vegetable: require('@/assets/images/ingredients/broccoli.png'),
  fruit: require('@/assets/images/ingredients/red_apple.png'),
  meat: require('@/assets/images/ingredients/cut_of_meat.png'),
  seafood: require('@/assets/images/ingredients/fish.png'),
  dairy: require('@/assets/images/ingredients/glass_of_milk.png'),
  starch: require('@/assets/images/ingredients/sheaf_of_rice.png'),
  herb: require('@/assets/images/ingredients/herb.png'),
  spice: require('@/assets/images/ingredients/salt.png'),
  nut: require('@/assets/images/ingredients/peanuts.png'),
  sauce: require('@/assets/images/ingredients/jar.png'),
  sweet: require('@/assets/images/ingredients/candy.png'),
  drink: require('@/assets/images/ingredients/teacup_without_handle.png'),
} satisfies Record<string, ImageSourcePropType>;

export type IngredientFamily = keyof typeof FAMILY_IMAGES;

type Rule = [RegExp, { image: IngredientImage } | { family: IngredientFamily }];
const img = (image: IngredientImage) => ({ image });
const fam = (family: IngredientFamily) => ({ family });

/**
 * Reconnaissance par le nom, pour les recettes d'avant la clé de l'IA et les lignes écrites à la main. Le mot qui
 * vient en premier dans la ligne l'emporte (« gigot d'agneau de lait » est un gigot), et à égalité le plus long
 * (« pâte brisée » n'est pas des pâtes). Les noms sont comparés sans accents ni apostrophes.
 */
const RULES: Rule[] = [
  // Bouillons, fonds et sauces composées : avant leurs ingrédients.
  [/\b(bouillon|fond (de|brun|blanc)|fumet)/, img('stock')],
  [/\b(sauce piquante|piment|tabasco|sriracha|harissa|jalapeno)/, img('chili')],
  [/\bhuile d olive|\bolives?\b/, img('olive')],
  [/\blait de coco|\bnoix de coco|\bcoco\b/, img('coconut')],
  [/\b(huiles?|vinaigre|sauce|moutarde|ketchup|mayonnaise|soja|nuoc mam|pesto|tahini?|coulis)\b/, fam('sauce')],
  [/\b(en boite|en conserve)\b/, img('canned')],
  // Légumes.
  [/\bpommes? de terre|\bpatates?\b/, img('potato')],
  [/\bpatates? douces?/, img('sweet_potato')],
  [/\b(tomates?|concentre de tomates?|passata)\b/, img('tomato')],
  [/\bpoivrons?\b/, img('bell_pepper')],
  [/\bcarottes?\b/, img('carrot')],
  [/\bail\b/, img('garlic')],
  [/\b(oignons?|echalotes?|ciboules?)\b/, img('onion')],
  [/\baubergines?\b/, img('eggplant')],
  [/\b(concombres?|cornichons?|courgettes?)\b/, img('cucumber')],
  [/\bmais\b/, img('corn')],
  [/\bbrocolis?\b/, img('broccoli')],
  [/\b(salades?|laitues?|epinards?|roquette|mache|choux?|blettes?|kale)\b/, img('salad')],
  [/\bchoux? fleurs?|\bchoux? de bruxelles/, fam('vegetable')],
  [/\b(champignons?|cepes?|girolles?|shiitakes?|morilles?|pleurotes?)\b/, img('mushroom')],
  [/\bavocats?\b/, img('avocado')],
  [/\bharicots? verts?/, fam('vegetable')],
  [/\b(haricots?|pois chiches?|lentilles?|feves?|edamame)\b/, img('bean')],
  [/\bpetits? pois\b/, img('pea')],
  [/\bgingembre\b/, img('ginger')],
  [
    /\b(celeri|poireaux?|navets?|radis|betteraves?|fenouil|asperges?|artichauts?|potirons?|courges?|butternut|potimarron|panais|legumes?)\b/,
    fam('vegetable'),
  ],
  // Herbes et épices.
  [
    /\b(persil|basilic|romarin|thym|coriandre|menthe|laurier|ciboulette|aneth|estragon|sauge|cerfeuil|origan|herbes?|bouquet garni)\b/,
    img('herb'),
  ],
  [/\b(sel|fleur de sel)\b/, img('salt')],
  [
    /\b(poivre|cumin|paprika|curry|curcuma|cannelle|muscade|epices?|ras el hanout|safran|cardamome|clous? de girofle|badiane|anis)\b/,
    fam('spice'),
  ],
  // Fruits.
  [/\bcitrons? verts?|\bcitron vert|\blimes?\b/, img('lime')],
  [/\bcitrons?\b/, img('lemon')],
  [/\b(oranges?|clementines?|mandarines?)\b/, img('orange')],
  [/\bpommes?\b/, img('apple')],
  [/\bpoires?\b/, img('pear')],
  [/\b(peches?|nectarines?)\b/, img('peach')],
  [/\bbananes?\b/, img('banana')],
  [/\bananas\b/, img('pineapple')],
  [/\bmangues?\b/, img('mango')],
  [/\bfraises?\b/, img('strawberry')],
  [/\bcerises?\b/, img('cherry')],
  [/\bmyrtilles?\b/, img('blueberry')],
  [/\braisins?\b/, img('grape')],
  [/\bpasteques?\b/, img('watermelon')],
  [/\bmelons?\b/, img('melon')],
  [/\bkiwis?\b/, img('kiwi')],
  [
    /\b(abricots?|prunes?|pruneaux?|figues?|framboises?|mures?|groseilles?|cassis|rhubarbe|grenades?|fruits?)\b/,
    fam('fruit'),
  ],
  // Fruits secs.
  [/\b(chataignes?|marrons?)\b/, img('chestnut')],
  [/\b(cacahuetes?|arachides?)\b/, img('peanut')],
  [/\b(amandes?|noisettes?|noix|pistaches?|pignons?|noix de cajou|graines?|sesame)\b/, fam('nut')],
  // Œufs et produits laitiers.
  [/\boeufs?\b/, img('egg')],
  [
    /\b(fromages?|parmesan|parmigiano|pecorino|mozzarella|comte|emmental|gruyere|feta|chevre|ricotta|mascarpone|burrata|cheddar|roquefort|camembert|reblochon|gorgonzola|raclette)\b/,
    img('cheese'),
  ],
  [/\bbeurre\b/, img('butter')],
  [/\blait\b/, img('milk')],
  [/\b(creme|yaourts?|fromage blanc|faisselle|lait ribot)\b/, fam('dairy')],
  // Viandes.
  [
    /\b(gigot|jarret|os a moelle|souris d agneau|carre d agneau|cotes? d agneau|cotes? de boeuf)\b/,
    img('meat_on_bone'),
  ],
  [/\b(poulet|volailles?|dinde|canard|cuisses?|pintade|magret|chapon)\b/, img('chicken')],
  [/\b(lardons?|bacon|pancetta|guanciale|poitrine fumee)\b/, img('bacon')],
  [
    /\b(boeuf|steaks?|veau|agneau|porc|viandes?|entrecotes?|filet mignon|paleron|bavette|hache|rumsteck)\b/,
    img('beef'),
  ],
  [/\b(jambon|saucisses?|saucisson|chorizo|merguez|foie gras|rillettes|boudin|andouillette|lapin)\b/, fam('meat')],
  // Poissons et fruits de mer.
  [/\b(crevettes?|gambas|scampi)\b/, img('shrimp')],
  [/\b(crabes?|tourteaux?)\b/, img('crab')],
  [/\b(homards?|langoustes?|langoustines?)\b/, img('lobster')],
  [/\b(calamars?|encornets?|seiches?)\b/, img('squid')],
  [/\b(poulpes?|pieuvres?)\b/, img('octopus')],
  [/\bhuitres?\b/, img('oyster')],
  [
    /\b(saumon|thon|cabillaud|poissons?|colin|merlu|dorade|bar|sardines?|maquereaux?|truites?|lieu|anchois|haddock|sole|lotte)\b/,
    img('fish'),
  ],
  [/\b(moules?|saint jacques|coques?|palourdes?|fruits de mer|crustaces?)\b/, fam('seafood')],
  // Féculents.
  [/\bbaguettes?\b/, img('baguette')],
  [/\b(pain|brioche|mie de pain|chapelure|croutons?)\b/, img('bread')],
  [/\b(tortillas?|pitas?|wraps?|naans?|galettes?)\b/, img('flatbread')],
  [/\b(riz|risotto|arborio)\b/, img('rice')],
  [
    /\b(pates?|spaghettis?|tagliatelles?|pennes?|fusillis?|linguines?|rigatonis?|macaronis?|lasagnes?|farfalles?|orecchiettes?|conchiglies?|coquillettes?)\b/,
    img('pasta'),
  ],
  [/\bpates? (brisee|feuilletee|sablee|a pizza|a tarte)|\bfond de tarte/, fam('starch')],
  [/\b(nouilles?|udons?|ramen|sobas?|vermicelles?)\b/, img('noodle')],
  [
    /\b(farine|semoule|boulgour|quinoa|polenta|maizena|fecule|flocons d avoine|avoine|ble|gnocchis?|levure)\b/,
    fam('starch'),
  ],
  // Sucré.
  [/\bmiel\b/, img('honey')],
  [/\b(chocolat|cacao|pralin)/, img('chocolate')],
  [/\b(sucre|cassonade|vergeoise|vanille|sirop|confiture|nutella|caramel)/, fam('sweet')],
  // Boissons.
  [/\b(vin|porto|madere|marsala|cognac|calvados|rhum|armagnac|whisky|vodka|liqueur)\b/, img('wine')],
  [/\bbieres?\b/, img('beer')],
  [/\b(champagne|prosecco|cremant|cidre)\b/, img('champagne')],
  [/\b(sake|mirin)\b/, img('sake')],
  [/\beau\b/, img('water')],
  [/\b(glacons?|glace pilee)\b/, img('ice')],
  [/\bthe\b/, img('tea')],
  [/\b(cafe|expresso|espresso)\b/, img('coffee')],
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`\-]/g, ' ');

/** Ce que dit le nom de l'ingrédient, quand un mot connu y figure. */
export function matchIngredient(name: string): Rule[1] | undefined {
  const text = normalize(name);
  let best: { at: number; length: number; match: Rule[1] } | undefined;
  for (const [pattern, match] of RULES) {
    const found = pattern.exec(text);
    if (!found) continue;
    const at = found.index + (found[0].length - found[0].trimStart().length);
    if (!best || at < best.at || (at === best.at && found[0].length > best.length)) {
      best = { at, length: found[0].length, match };
    }
  }
  return best?.match;
}

const isImage = (key?: string): key is IngredientImage => !!key && key in INGREDIENT_IMAGES;
const isFamily = (key?: string): key is IngredientFamily => !!key && key in FAMILY_IMAGES;

/** Image d'un ingrédient : la sienne, sinon celle de sa famille ; `undefined` pour l'icône générique. */
export function ingredientImageOf(ingredient: Ingredient): ImageSourcePropType | undefined {
  if (isImage(ingredient.image)) return INGREDIENT_IMAGES[ingredient.image];
  const match = matchIngredient(ingredient.name);
  if (match && 'image' in match) return INGREDIENT_IMAGES[match.image];
  if (isFamily(ingredient.family)) return FAMILY_IMAGES[ingredient.family];
  if (match) return FAMILY_IMAGES[match.family];
  return undefined;
}
