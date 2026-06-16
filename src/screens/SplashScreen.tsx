import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useAppDispatch } from '../redux/store';
import { setSplashScreenVisible } from '../redux/slices/appSlice';
import { useTheme } from '../theme';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const logoOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start splash animation sequence
    const startSplashAnimation = () => {
      // Fade in and scale up logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Start subtle pulse effect
        const pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        );
        pulseAnimation.start();

        // Hide splash screen after 2.5 seconds total
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            dispatch(setSplashScreenVisible(false));
          });
        }, 2500);
      });
    };

    startSplashAnimation();
  }, [dispatch, fadeAnim, scaleAnim, pulseAnim, logoOpacityAnim]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { scale: pulseAnim },
            ],
          },
        ]}
      >
        {/* Logo Placeholder - Replace with actual logo */}
        <Animated.View
          style={[
            styles.logo,
            {
              backgroundColor: theme.colors.primary,
              opacity: logoOpacityAnim,
              shadowColor: theme.colors.shadow.medium,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 12,
            },
          ]}
        >
          <View style={styles.logoInner}>
            <View style={[styles.logoCircle, { backgroundColor: theme.colors.card }]} />
            <View style={styles.logoText}>
              <View style={[styles.textLine, { backgroundColor: theme.colors.card }]} />
              <View style={[styles.textLine, { backgroundColor: theme.colors.card, width: '80%' }]} />
            </View>
          </View>
        </Animated.View>
        
        {/* App Name */}
        <Animated.Text
          style={[
            styles.appName,
            {
              color: theme.colors.text,
              opacity: logoOpacityAnim,
              fontFamily: theme.typography.fontFamily.bold,
            },
          ]}
        >
          Tuition
        </Animated.Text>
        
        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              color: theme.colors.textSecondary,
              opacity: logoOpacityAnim,
              fontFamily: theme.typography.fontFamily.regular,
            },
          ]}
        >
          Connecting Tutors & Parents
        </Animated.Text>
      </Animated.View>

      {/* Bottom decorative elements */}
      <Animated.View
        style={[
          styles.bottomDecoration,
          {
            opacity: logoOpacityAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={[styles.decorationDot, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.decorationDot, { backgroundColor: theme.colors.secondary }]} />
        <View style={[styles.decorationDot, { backgroundColor: theme.colors.accent }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  logoText: {
    alignItems: 'center',
    width: 60,
  },
  textLine: {
    height: 3,
    width: '100%',
    borderRadius: 2,
    marginBottom: 4,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
});

export default SplashScreen;
