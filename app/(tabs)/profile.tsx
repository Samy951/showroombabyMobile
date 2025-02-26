import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/hooks/useAuth";

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
};

type MenuSection = {
  section: string;
  items: MenuItem[];
};

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/auth/login");
          } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            Alert.alert("Erreur", "Impossible de se déconnecter");
          }
        },
      },
    ]);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const menuItems: MenuSection[] = [
    {
      section: "Mon compte",
      items: [
        {
          icon: "person-outline",
          title: "Modifier mon profil",
          onPress: () => Alert.alert("Info", "Fonctionnalité à venir"),
        },
        {
          icon: "settings-outline",
          title: "Paramètres",
          onPress: () => Alert.alert("Info", "Fonctionnalité à venir"),
        },
      ],
    },
    {
      section: "Mes activités",
      items: [
        {
          icon: "cart-outline",
          title: "Mes annonces",
          onPress: () => Alert.alert("Info", "Fonctionnalité à venir"),
        },
        {
          icon: "heart-outline",
          title: "Mes favoris",
          onPress: () => Alert.alert("Info", "Fonctionnalité à venir"),
        },
        {
          icon: "chatbubble-outline",
          title: "Messages",
          onPress: () => Alert.alert("Info", "Fonctionnalité à venir"),
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* En-tête du profil */}
        <View className="items-center py-8 bg-primary">
          <View className="items-center justify-center w-24 h-24 mb-4 bg-white rounded-full">
            <Ionicons name="person" size={40} color="#FF6B6B" />
          </View>
          <Text className="mb-1 text-2xl font-bold text-white">
            {user.username}
          </Text>
          <Text className="text-white opacity-80">{user.email}</Text>
        </View>

        {/* Menu items */}
        <View className="p-4">
          {menuItems.map((section, sectionIndex) => (
            <View key={sectionIndex} className="mb-6">
              <Text className="mb-4 text-lg font-semibold text-gray-800">
                {section.section}
              </Text>
              <View className="overflow-hidden bg-gray-50 rounded-2xl">
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100"
                    onPress={item.onPress}
                  >
                    <Ionicons name={item.icon} size={24} color="#666" />
                    <Text className="flex-1 ml-3 text-base text-gray-800">
                      {item.title}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Bouton de déconnexion */}
        <TouchableOpacity className="mx-4 mb-8" onPress={handleLogout}>
          <View className="flex-row items-center justify-center p-4 bg-gray-100 rounded-xl">
            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
            <Text className="ml-2 text-base font-medium text-primary">
              Se déconnecter
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
