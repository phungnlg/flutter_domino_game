import * as Haptics from 'expo-haptics';

export const HapticService = {
  async tilePlaced(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics not available on this device
    }
  },

  async passTurn(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available
    }
  },

  async win(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics not available
    }
  },

  async invalidMove(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Haptics not available
    }
  },

  async yourTurn(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Haptics not available
    }
  },
};
