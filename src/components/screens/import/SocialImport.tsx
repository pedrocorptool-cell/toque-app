import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { AppText, Button, Logo } from '@/components/ui';
import { SOCIALS, type SocialId } from '@/data/imports';
import { SOURCES } from '@/data/recipes';
import { color, radius, space } from '@/theme/tokens';

const SLIDE_W = 210;
const SLIDE_H = 240;
const AUTOPLAY = 3500;

type SocialImportProps = {
  network: SocialId;
  onNetworkChange: (network: SocialId) => void;
  onOpen: () => void;
};

const sourceOf = (id: SocialId) => SOURCES.find((s) => s.id === id)!;

/**
 * Figma « Bottom Sheet/ Import/ RS » : choix du réseau, tutoriel en trois vignettes (une image de démo
 * dans Figma) et CTA qui ouvre l'app du réseau.
 */
export function SocialImport({ network, onNetworkChange, onOpen }: SocialImportProps) {
  const { label, logo } = sourceOf(network);
  return (
    <>
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

      <Tutorial
        key={network}
        slides={[
          {
            visual: <Image source={logo!} style={styles.slideLogo} />,
            text: `Ouvre la publication de la recette sur ${label}`,
          },
          {
            visual: (
              <View style={styles.slideIcon}>
                <Icon name="export" color={color.actionSecondaryIcon} />
              </View>
            ),
            text: 'Touche « Partager »',
          },
          {
            visual: <Logo color={color.aiStrong} />,
            text: 'Choisis Toqué : la recette arrive dans tes recettes',
          },
        ]}
      />

      <Button block icon={network} label={`Ouvrir ${label}`} onPress={onOpen} />
    </>
  );
}

type Slide = { visual: ReactNode; text: string };

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
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SLIDE_W))}
        style={styles.slides}>
        {slides.map((slide, i) => (
          <View key={i} style={styles.slide}>
            {slide.visual}
            <View style={styles.slideText}>
              <AppText variant="overline" color={color.textSecondary}>
                {`Étape ${i + 1}`}
              </AppText>
              <AppText style={styles.center}>{slide.text}</AppText>
            </View>
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

const styles = StyleSheet.create({
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
    backgroundColor: color.bgSurface,
  },
  slide: {
    width: SLIDE_W,
    height: SLIDE_H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[24],
    padding: space[16],
  },
  slideLogo: {
    width: 56,
    height: 56,
  },
  slideIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.chipBg,
  },
  slideText: {
    alignItems: 'center',
    gap: space[8],
  },
  center: {
    textAlign: 'center',
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
