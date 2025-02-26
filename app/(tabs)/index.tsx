import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { useAuth } from "../../src/hooks/useAuth";
import {
  Category,
  Product,
  categoryService,
  favoriteService,
  productService,
} from "../../src/services/api.service";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesResponse, productsResponse] = await Promise.all([
        categoryService.getCategories(),
        productService.getProducts(),
      ]);

      setCategories(categoriesResponse.data || []);
      setProducts(productsResponse.data || []);
    } catch (error: any) {
      console.error("Erreur lors du chargement des données:", error);
      setError(
        error.response?.data?.message ||
          "Erreur lors du chargement des données. Veuillez réessayer."
      );
      Alert.alert("Erreur", "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    try {
      await favoriteService.toggleFavorite(Number(productId));
      setProducts(
        products.map((product) =>
          product.id === productId
            ? { ...product, isFavorite: !product.isFavorite }
            : product
        )
      );
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
