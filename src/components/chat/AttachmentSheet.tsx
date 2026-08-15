import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

interface AttachmentSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  onSelectOption: (option: string) => void;
}

export const AttachmentSheet: React.FC<AttachmentSheetProps> = ({ sheetRef, onSelectOption }) => {
  const snapPoints = useMemo(() => ['40%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  const options = [
    { id: 'camera', icon: '📷', label: 'Camera' },
    { id: 'gallery', icon: '🖼️', label: 'Gallery' },
    { id: 'document', icon: '📄', label: 'Document' },
    { id: 'contact', icon: '👤', label: 'Contact' },
    { id: 'location', icon: '📍', label: 'Location' },
    { id: 'event', icon: '📅', label: 'Event' },
  ];

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: '#121212' }}
      handleIndicatorStyle={{ backgroundColor: '#555555' }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Attach File</Text>
        <View style={styles.grid}>
          {options.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={styles.option}
              onPress={() => {
                sheetRef.current?.close();
                onSelectOption(option.id);
              }}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{option.icon}</Text>
              </View>
              <Text style={styles.label}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  option: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  icon: {
    fontSize: 24,
  },
  label: {
    color: '#aaaaaa',
    fontSize: 12,
  },
});
