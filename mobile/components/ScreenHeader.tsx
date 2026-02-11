import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from './useColorScheme';
import { Text } from './Themed';

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  onBackPress,
  showBackButton = true,
  rightComponent
}: ScreenHeaderProps) {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, { 
      backgroundColor: colorScheme === 'dark' ? "#0f172a" : "#ffffff",
      borderBottomColor: colorScheme === 'dark' ? '#333333' : '#e0e0e0'
    }]}>
      {showBackButton ? (
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
        >
          <ArrowLeft
            size={24}
            color={colorScheme === 'dark' ? '#ffffff' : '#000000'}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.backButton} />
      )}

      <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]} numberOfLines={1}>
        {title}
      </Text>

      {rightComponent ? (
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      ) : (
        <View style={styles.rightContainer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  rightContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

