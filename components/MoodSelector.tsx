import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { MoodOption, MoodLevel, MOOD_OPTIONS } from '../types';

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

const MoodButton: React.FC<MoodButtonProps> = ({
  option,
  isSelected,
  onPress,
  disabled,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.moodButton,
          isSelected && styles.moodButtonSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.emoji}>{option.emoji}</Text>
        <Text style={[styles.label, isSelected && styles.labelSelected]}>
          {option.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedLevel,
  onSelect,
  disabled,
}) => {
  return (
    <View style={styles.container}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    minWidth: 60,
  },
  moodButtonSelected: {
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  labelSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
});
