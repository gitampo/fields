import { ImageSourcePropType, ImageStyle } from 'react-native';

const sportmanshipImage = require('../assets/fields/sportmanship.jpg');
const padelImage = require('../assets/fields/padel.avif');
const tennisImage = require('../assets/fields/tennis.avif');
const calcettoImage = require('../assets/fields/calcetto.avif');
const bocceImage = require('../assets/fields/b.avif');
const skillsImage = require('../assets/fields/skills.avif');


const getSportKey = (value: string) => value.toLowerCase();

// Regola questi valori per modificare la transform del carosello.
const CAROUSEL_DEFAULT_FOCUS: ImageStyle = {
  transform: [{ scale: 1.08 }, { translateX: 0 }, { translateY: 0 }],
};

const CAROUSEL_PADEL_FOCUS: ImageStyle = {
  transform: [{ scale: 1.10 }, { translateX: 0 }, { translateY: 0 }],
};

const CAROUSEL_TENNIS_FOCUS: ImageStyle = {
  transform: [{ scale: 1.10 }, { translateX: 0 }, { translateY: -4 }],
};

const CAROUSEL_CALCETTO_FOCUS: ImageStyle = {
  transform: [{ scale: 1.12 }, { translateX: -8 }, { translateY: -4 }],
};

const CAROUSEL_BOCCE_FOCUS: ImageStyle = {
  transform: [{ scale: 1.12 }, { translateX: 0 }, { translateY: 0 }],
};

const CAROUSEL_SKILLS_FOCUS: ImageStyle = {
  transform: [{ scale: 1.0 }, { translateX: 0 }, { translateY: 0 }],
};

export const getFieldImageSource = (value: string, fallback: ImageSourcePropType = sportmanshipImage) => {
  const key = getSportKey(value);

  if (key.includes('padel')) {
    return padelImage;
  }

  if (key.includes('tennis')) {
    return tennisImage;
  }

  if (key.includes('calcetto') || key.includes('calcio')) {
    return calcettoImage;
  }

  if (key.includes('bocce')) {
    return bocceImage;
  }

  if (key.includes('skills')) {
    return skillsImage;
  }

  return fallback;
};

export const getFieldImageFocusStyle = (value: string): ImageStyle => {
  const key = getSportKey(value);

  if (key.includes('skills')) {
    return CAROUSEL_SKILLS_FOCUS;
  }

  if (key.includes('calcetto') || key.includes('calcio')) {
    return CAROUSEL_CALCETTO_FOCUS;
  }

  if (key.includes('tennis')) {
    return CAROUSEL_TENNIS_FOCUS;
  }

  if (key.includes('padel')) {
    return CAROUSEL_PADEL_FOCUS;
  }

  return {
    transform: [{ scale: 1.08 }, { translateX: 0 }, { translateY: 0 }],
  };
};

export const getCarouselImageFocusStyle = (value: string): ImageStyle => {
  const key = getSportKey(value);

  if (key.includes('skills')) {
    return CAROUSEL_SKILLS_FOCUS;
  }

  if (key.includes('calcetto') || key.includes('calcio')) {
    return CAROUSEL_CALCETTO_FOCUS;
  }

  if (key.includes('tennis')) {
    return CAROUSEL_TENNIS_FOCUS;
  }

  if (key.includes('padel')) {
    return CAROUSEL_PADEL_FOCUS;
  }

  if(key.includes('skills')){
    return CAROUSEL_SKILLS_FOCUS;
  }
  return CAROUSEL_DEFAULT_FOCUS;
};

export const getCarouselImageResizeMode = (value: string): 'cover' | 'contain' => {
  const key = getSportKey(value);

  if (key.includes('bocce')) {
    return 'contain';
  }

  return 'cover';
};

export const fieldFallbackImage = sportmanshipImage;
