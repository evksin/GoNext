import { ImageBackground, StyleSheet, View } from 'react-native';

import { useSettings } from '../contexts/SettingsContext';

const backgroundImage = require('../../assets/backgrounds/gonext-bg.png');

type ScreenBackgroundProps = {
  children: React.ReactNode;
};

export function ScreenBackground({ children }: ScreenBackgroundProps) {
  const { themeMode, theme } = useSettings();

  if (themeMode === 'dark') {
    return (
      <View style={[styles.background, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>{children}</View>
      </View>
    );
  }
  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
      imageStyle={styles.image}
    >
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  image: {
    opacity: 1,
  },
});
