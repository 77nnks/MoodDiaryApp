import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { MoodOption, MoodLevel, MOOD_OPTIONS } from '../types';
import { colors, borderRadius, fontSize, fontWeight, getMoodColor, getMoodColorDark } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_SIZE = (SCREEN_WIDTH - 80) / 5; // 5つのボタンを横並び

interface MoodSelectorProps {
  selectedLevel?: MoodLevel;
  onSelect: (level: MoodLevel) => void;
  disabled?: boolean;
}

interface MoodButtonProps {
  option: MoodOption;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const MoodButton: React.FC<MoodButtonProps> = ({
  option,
  isSelected,
  onPress,
  disabled,
}) => {
  const pressed = useSharedValue(0);
  const selected = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    selected.value = withSpring(isSelected ? 1 : 0, { damping: 15, stiffness: 150 });
  }, [isSelected]);

  const buttonColor = getMoodColor(option.level);
  const buttonColorDark = getMoodColorDark(option.level);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.95]);
    const translateY = interpolate(pressed.value, [0, 1], [0, 4]);

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const bottomBorderStyle = useAnimatedStyle(() => {
    const height = interpolate(pressed.value, [0, 1], [6, 2]);
    return {
      height,
    };
  });

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 200 });
  };

  return (
    <View style={styles.buttonWrapper}>
      {/* 底部の暗い影（Duolingo風） */}
      <Animated.View
        style={[
          styles.buttonShadow,
          { backgroundColor: buttonColorDark },
          bottomBorderStyle,
        ]}
      />

      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[
          styles.moodButton,
          { backgroundColor: buttonColor },
          isSelected && styles.moodButtonSelected,
          animatedStyle,
        ]}
      >
        <Text style={styles.emoji}>{option.emoji}</Text>
      </AnimatedTouchable>

      {/* ラベル */}
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {option.label}
      </Text>

      {/* 選択インジケーター */}
      {isSelected && (
        <View style={[styles.selectedIndicator, { backgroundColor: buttonColor }]} />
      )}
    </View>
  );
};

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedLevel,
  onSelect,
  disabled,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>今日の気分は？</Text>
      <View style={styles.buttonsRow}>
        {MOOD_OPTIONS.map((option) => (
          <MoodButton
            key={option.level}
            option={option}
            isSelected={selectedLevel === option.level}
            onPress={() => onSelect(option.level)}
            disabled={disabled}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  buttonWrapper: {
    alignItems: 'center',
    width: BUTTON_SIZE + 10,
  },
  buttonShadow: {
    position: 'absolute',
    top: BUTTON_SIZE - 6,
    width: BUTTON_SIZE,
    height: 6,
    borderRadius: borderRadius.lg,
  },
  moodButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  moodButtonSelected: {
    borderWidth: 4,
    borderColor: colors.card,
  },
  emoji: {
    fontSize: BUTTON_SIZE * 0.55,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
});
