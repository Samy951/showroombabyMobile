import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApiData } from "../../src/hooks/useApiData";
import { useAuth } from "../../src/hooks/useAuth";
import {
  Category,
  Product,
  categoryService,
  favoriteService,
  productService,
} from "../../src/services/api.service";

// Définir le type des réponses d'API en fonction de ce que retournent nos services
type CategoryResponse = { data: Category[] };
type ProductResponse = {
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Utiliser notre nouveau hook pour charger les données de manière conditionnelle
  const categoriesApi = useApiData<CategoryResponse>(
    async () => {
      console.log("Chargement des catégories...");
      return categoryService.getCategories();
    },
    { data: [] }
  );

  const productsApi = useApiData<ProductResponse>(
    async () => {
      console.log("Chargement des produits...");
      return productService.getProducts();
    },
    {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    }
  );

  // Dérivez les données et les états de chargement/erreur de nos hooks
  const categories = categoriesApi.data?.data || [];
  const products = productsApi.data?.data || [];
  const loading = categoriesApi.isLoading || productsApi.isLoading;
  const error = categoriesApi.error || productsApi.error;

  // Fonction pour rafraîchir les données
  const loadInitialData = () => {
    categoriesApi.refetch();
    productsApi.refetch();
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    try {
      await favoriteService.toggleFavorite(Number(productId));
      // Mettre à jour l'état local des produits
      const updatedProducts = products.map((product) =>
        product.id === productId
          ? { ...product, isFavorite: !product.isFavorite }
          : product
      );

      // Rafraîchir les données si nécessaire
      productsApi.refetch();
    } catch (error) {
      console.error("Erreur lors de l'ajout aux favoris:", error);
      Alert.alert("Erreur", "Impossible de modifier les favoris.");
    }
  };

  const handleProfilePress = () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    } else {
      router.push("/(tabs)/profile");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-lg text-red-500 mb-4 text-center">{error}</Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full"
          onPress={loadInitialData}
        >
          <Text className="text-white font-medium">Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Barre de recherche */}
      <View className="px-4 py-4">
        <View className="flex-row items-center px-4 h-[45px] bg-gray-100 rounded-full">
          <TextInput
            placeholder="Rechercher..."
            className="flex-1 text-base text-gray-700"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity className="p-2">
            <Ionicons name="search" size={22} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Catégories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-4"
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            className="mr-2 px-5 py-3 rounded-full bg-primary h-[120px] w-[120px] justify-center items-center"
          >
            <Text className="text-base font-medium text-white">
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bannière */}
      <View className="mx-4 my-2 rounded-xl bg-gray-100 h-[120px] overflow-hidden justify-center">
        <Text className="px-4 text-2xl font-bold text-gray-800">
          Surfer sur les tendances !
        </Text>
      </View>

      {/* Grille de produits */}
      <ScrollView className="flex-1 px-2">
        <View className="flex-row flex-wrap">
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              className="w-1/2 p-1 aspect-square"
            >
              <View className="relative flex-1">
                <Image
                  source={{ uri: product.imageUrl }}
                  className="w-full h-full rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute p-2 bg-white rounded-full shadow-sm top-2 right-2"
                  onPress={() => handleToggleFavorite(product.id)}
                >
                  <Ionicons
                    name={product.isFavorite ? "heart" : "heart-outline"}
                    size={20}
                    color={product.isFavorite ? "#FF6B6B" : "#999"}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Barre de navigation */}
      <View className="flex-row items-center justify-around py-3 pb-6 bg-white border-t border-gray-100">
        <TouchableOpacity className="p-2">
          <Ionicons name="search" size={28} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <Ionicons name="heart-outline" size={28} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity className="bg-primary rounded-full w-[70px] h-[70px] justify-center items-center -mt-8 shadow-lg">
          <Ionicons name="add" size={35} color="white" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <Ionicons name="chatbubble-outline" size={28} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2" onPress={handleProfilePress}>
          <Ionicons
            name={isAuthenticated ? "person" : "person-outline"}
            size={28}
            color={isAuthenticated ? "#FF6B6B" : "#999"}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
