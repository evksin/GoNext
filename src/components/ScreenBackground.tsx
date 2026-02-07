import { ImageBackground, StyleSheet, View } from 'react-native';

const backgroundImage = require('../../assets/backgrounds/gonext-bg.png');

type ScreenBackgroundProps = {
  children: React.ReactNode;
};

export function ScreenBackground({ children }: ScreenBackgroundProps) {
  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
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
});
