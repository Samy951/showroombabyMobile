import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = [
  { id: "1", name: "Tendance" },
  { id: "2", name: "Siège auto" },
  { id: "3", name: "Chambre" },
  { id: "4", name: "Chaussure" },
];

const mockProducts = [
  {
    id: "1",
    imageUrl: "https://via.placeholder.com/200",
    isFavorite: false,
  },
  {
    id: "2",
    imageUrl: "https://via.placeholder.com/200",
    isFavorite: true,
  },
];

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Barre de recherche */}
      <View className="px-4 py-4">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 h-[45px]">
          <TextInput
            placeholder="Rechercher..."
            className="flex-1 text-base text-gray-700"
            placeholderTextColor="#999"
          />
          <View className="p-2">
            <Ionicons name="search" size={22} color="#999" />
          </View>
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
            <Text className="text-white text-base font-medium">
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bannière */}
      <View className="mx-4 my-2 rounded-xl bg-gray-100 h-[120px] overflow-hidden justify-center">
        <Text className="text-2xl font-bold px-4 text-gray-800">
          Surfer sur les tendances !
        </Text>
      </View>

      {/* Grille de produits */}
      <ScrollView className="flex-1 px-2">
        <View className="flex-row flex-wrap">
          {mockProducts.map((product) => (
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
                <TouchableOpacity className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-sm">
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
      <View className="flex-row justify-around items-center py-3 bg-white border-t border-gray-100 pb-6">
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
        <TouchableOpacity className="p-2">
          <Ionicons name="person-outline" size={28} color="#999" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
