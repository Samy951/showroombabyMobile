# CLAUDE.md - ShowroomBaby Mobile Style Guide

## Build Commands
```bash
npm start                  # Start the Expo development server
npm run ios                # Start iOS simulator
npm run android            # Start Android simulator
npm run web                # Start web version
npm run lint               # Run linting
npm test                   # Run all tests
npm test -- -t "test name" # Run specific test
```

## Code Style Guidelines
- **TypeScript**: Use strict typing with interfaces for data models
- **Components**: Use functional components with hooks
- **Styling**: Use NativeWind (TailwindCSS) for styling
- **File Structure**: Follow src/components, src/screens, src/hooks pattern
- **Imports**: Group imports by external libraries, then internal modules
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Error Handling**: Try/catch with specific error messages and logging
- **API Calls**: Use axios with React Query for data fetching
- **State Management**: Use Zustand for global state
- **Navigation**: Use React Navigation with type-safe routes
- **Testing**: Write Jest snapshot tests for components

## Best Practices
- Implement proper error boundaries
- Use AsyncStorage for persistent data
- Follow Expo SDK best practices
- Handle API errors gracefully
- Implement proper offline support
- Use proper TypeScript generics for reusable components