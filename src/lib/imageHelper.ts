import gameScoped1 from "../assets/images/itachi_game_scoped_1_1784026032478.jpg";
import gameTraining2 from "../assets/images/itachi_game_training_2_1784026050377.jpg";
import gameScoped3 from "../assets/images/itachi_game_scoped_3_1784026070378.jpg";
import gameDesert4 from "../assets/images/itachi_game_desert_4_1784026089374.jpg";
import gameTraining5 from "../assets/images/itachi_game_training_5_1784026112222.jpg";

const HACK_FF_IMAGES = [
  gameScoped1,
  gameTraining2,
  gameScoped3,
  gameDesert4,
  gameTraining5
];

export function getProductImage(image: string | undefined, categoryId?: string): string {
  // Direct matching based on categoryId
  if (categoryId === "cat_proxy_drag") {
    return gameScoped1;
  }
  if (categoryId === "cat_proxy_body") {
    return gameTraining2;
  }
  if (categoryId === "cat_nhe_tam") {
    return gameScoped3;
  }
  if (categoryId === "cat_proxy_anten") {
    return gameDesert4;
  }
  if (categoryId === "cat_proxy_vip") {
    return gameTraining5;
  }

  // Map key categories
  if (categoryId) {
    if (categoryId.includes("pro")) {
      return gameScoped1;
    }
    if (categoryId.includes("30day")) {
      return gameScoped3;
    }
    if (categoryId.includes("7day") || categoryId.includes("day7")) {
      return gameTraining2;
    }
    if (categoryId.includes("1day")) {
      return gameTraining5;
    }
  }

  // If the product image is an Unsplash URL, override it to be one of our Free Fire hack images deterministically
  if (image) {
    if (image.includes("unsplash.com")) {
      const sum = image.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return HACK_FF_IMAGES[sum % HACK_FF_IMAGES.length];
    }
    return image;
  }

  return gameTraining5;
}


