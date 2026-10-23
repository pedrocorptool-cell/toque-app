import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText, Button, useReduceMotion } from '@/components/ui';
import { SOCIALS, type SocialId } from '@/data/imports';
import { SOURCES } from '@/data/recipes';
import { color, radius, space } from '@/theme/tokens';

const SLIDE_W = 210;
const SLIDE_H = 240;
const AUTOPLAY = 3500;
/** Demi-période du clignotement du bouton à toucher. */
const BLINK = 600;

type SocialImportProps = {
  network: SocialId;
  onNetworkChange: (network: SocialId) => void;
  onOpen: () => void;
};

/** Capture d'écran du réseau ; `cta` : l'élément à toucher, posé par-dessus pour clignoter (32 × 32). */
type Slide = { image: ImageSourcePropType; cta?: { image: ImageSourcePropType; x: number; y: number } };

const SHARE_MENU: Slide = {
  image: require('@/assets/images/guide/menu-partage.jpg'),
  cta: { image: require('@/assets/images/guide/menu-partage-cta.png'), x: 170, y: 200 },
};
const CHOOSE_TOQUE: Slide = { image: require('@/assets/images/guide/choisir-toque.jpg') };

/** Figma « Insta 01 » à « TikTok 03 » : publication, menu de partage, choix de Toqué. */
const SLIDES: Record<SocialId, Slide[]> = {
  instagram: [
    {
      image: require('@/assets/images/guide/instagram-1.jpg'),
      cta: { image: require('@/assets/images/guide/instagram-1-cta.png'), x: 166, y: 196 },
    },
    {
      image: require('@/assets/images/guide/instagram-2.jpg'),
      cta: { image: require('@/assets/images/guide/instagram-2-cta.png'), x: 89, y: 200 },
    },
    CHOOSE_TOQUE,
  ],
  facebook: [
    {
      image: require('@/assets/images/guide/facebook-1.jpg'),
      cta: { image: require('@/assets/images/guide/facebook-1-cta.png'), x: 146, y: 196 },
    },
    SHARE_MENU,
    CHOOSE_TOQUE,
  ],
  tiktok: [
    {
      image: require('@/assets/images/guide/tiktok-1.jpg'),
      cta: { image: require('@/assets/images/guide/tiktok-1-cta.png'), x: 165, y: 200 },
    },
    SHARE_MENU,
    CHOOSE_TOQUE,
  ],
};

const sourceOf = (id: SocialId) => SOURCES.find((s) => s.id === id)!;

/**
 * Figma « Sheet/Import » du guide d'import : tutoriel en trois captures, choix du réseau et CTA qui ouvre l'app
 * du réseau. Sur chaque capture, le bouton orange à toucher clignote.
 */
export function SocialImport({ network, onNetworkChange, onOpen }: SocialImportProps) {
  const { label } = sourceOf(network);
  return (
    <View style={styles.content}>
      <Tutorial key={network} slides={SLIDES[network]} />

      <View style={styles.tabs}>
        {SOCIALS.map((id) => {
          const active = id === network;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onNetworkChange(id)}
              style={[styles.tab, active ? styles.tabActive : styles.tabIdle]}>
              <Image source={sourceOf(id).logo!} style={styles.tabLogo} />
              <AppText>{sourceOf(id).label}</AppText>
            </Pressable>
          );
        })}
      </View>

      <Button block icon={network} label={`Ouvrir ${label}`} onPress={onOpen} />
    </View>
  );
}

/** Vignettes qui défilent seules ; un glissement du doigt prend la main. */
function Tutorial({ slides }: { slides: Slide[] }) {
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (manual) return;
    const id = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % slides.length;
        scroller.current?.scrollTo({ x: next * SLIDE_W, animated: true });
        return next;
      });
    }, AUTOPLAY);
    return () => clearInterval(id);
  }, [manual, slides.length]);

  return (
    <View style={styles.tutorial}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => setManual(true)}
        // La vignette la plus visible devient l'active dès le glissement, sans attendre la fin du défilement.
        scrollEventThrottle={16}
        onScroll={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / SLIDE_W);
          setIndex((i) => (i === next ? i : Math.max(0, Math.min(slides.length - 1, next))));
        }}
        style={styles.slides}>
        {slides.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <Image source={slide.image} style={styles.slideImage} />
            {slide.cta && <BlinkingCta {...slide.cta} active={i === index} />}
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

/**
 * Bouton orange de la capture, qui s'éteint et se rallume en boucle tant que sa vignette est affichée (fixe si
 * « Réduire les animations »). Chaque arrivée sur la vignette relance le clignotement depuis le début.
 */
function BlinkingCta({ image, x, y, active }: NonNullable<Slide['cta']> & { active: boolean }) {
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    opacity.setValue(1);
    if (reduceMotion || !active) return;
    const fade = (toValue: number) =>
      Animated.timing(opacity, { toValue, duration: BLINK, easing: Easing.inOut(Easing.ease), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([fade(0.2), fade(1)]));
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(1);
    };
  }, [reduceMotion, active, opacity]);

  return <Animated.Image source={image} style={[styles.cta, { left: x, top: y, opacity }]} />;
}

const styles = StyleSheet.create({
  content: {
    gap: space[32],
    marginTop: space[8],
  },
  tabs: {
    flexDirection: 'row',
    gap: space[8],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: space[8],
    padding: space[12],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: color.bgSurface,
    borderColor: color.bgSurface,
  },
  tabIdle: {
    borderColor: color.borderDefault,
  },
  tabLogo: {
    width: 32,
    height: 32,
  },
  tutorial: {
    alignItems: 'center',
    gap: space[16],
  },
  slides: {
    width: SLIDE_W,
    height: SLIDE_H,
    flexGrow: 0,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  slide: {
    width: SLIDE_W,
    height: SLIDE_H,
  },
  slideImage: {
    width: SLIDE_W,
    height: SLIDE_H,
  },
  cta: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  dots: {
    flexDirection: 'row',
    gap: space[4],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: color.textPrimary,
  },
  dotActive: {
    width: 16,
    backgroundColor: color.accentBlue,
  },
});
