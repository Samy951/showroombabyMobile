import {
  authService,
  categoryService,
  favoriteService,
  productService,
} from "../services/api.service";

export const testEndpoints = async () => {
  const results: {
    endpoint: string;
    status: "success" | "error";
    message?: string;
    data?: any;
  }[] = [];

  const testEndpoint = async (name: string, fn: () => Promise<any>) => {
    try {
      const response = await fn();
      console.log(`Test ${name} - Réponse:`, response);
      results.push({
        endpoint: name,
        status: "success",
        data: response,
      });
    } catch (error: any) {
      console.error(`Test ${name} - Erreur:`, error);
      console.error(`Test ${name} - Response:`, error.response?.data);
      results.push({
        endpoint: name,
        status: "error",
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
    }
  };

  // Test d'authentification
  await testEndpoint("Auth - Register", async () => {
    const registerData = {
      email: "test@example.com",
      password: "password123",
      password_confirmation: "password123",
      username: "testuser",
    };
    console.log("Tentative d'inscription avec:", registerData);
    const response = await authService.register(registerData);
    console.log("Réponse d'inscription:", response);
    return response;
  });

  await testEndpoint("Auth - Login", async () => {
    const loginData = {
      email: "test@example.com",
      password: "password123",
    };
    console.log("Tentative de connexion avec:", loginData);
    const response = await authService.login(loginData);
    console.log("Réponse de connexion:", response);
    return response;
  });

  // Test des catégories
  await testEndpoint("Categories - Get All", async () => {
    const response = await categoryService.getCategories();
    console.log("Structure des catégories:", response);
    return response;
  });

  // Test des produits
  await testEndpoint("Products - Get All", async () => {
    const response = await productService.getProducts();
    console.log("Structure des produits:", response);
    return response;
  });

  await testEndpoint("Products - Get Trending", async () => {
    await productService.getTrendingProducts();
  });

  // Test des favoris
  await testEndpoint("Favorites - Get All", async () => {
    await favoriteService.getFavorites();
  });

  // Affichage des résultats
  console.log("\n=== Résultats détaillés des tests des endpoints ===\n");
  results.forEach((result) => {
    const icon = result.status === "success" ? "✅" : "❌";
    console.log(`${icon} ${result.endpoint}`);
    if (result.message) {
      console.log(`   Message: ${result.message}`);
    }
    if (result.data) {
      console.log(`   Données reçues:`, result.data);
    }
    console.log("\n");
  });

  return results;
};
