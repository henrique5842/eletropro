export declare global {
  namespace ReactNavigation {
    interface RootParamList extends Record<string, object | undefined> {
      SignIn: undefined;
      Home: undefined;
      ClientsList: undefined;
      Clients: { clientId: string };
      ClientDetails: { clientId: string };
      ClientRegistration: undefined;
      DropCalculator: undefined;
      LedCalculator: undefined;
      FontCalculator: undefined;
      CurrentCalculator: undefined;
      CircuitBreakerManager: undefined;
      NewQuote: { clientId?: string };
      QuoteDetails: { quoteId: string; quoteName?: string };
      NewProject: { clientId?: string };
      NewMaterial: { clientId: string; budgetId?: string };
      MaterialDetails: { materialId?: number?; materialListId?: string; };
      Profile: undefined;
      Calculator: undefined;
      EnergyCalculator: undefined;
      Materials: undefined;
      NewService: undefined;
      WifiSignalTester: undefined
      
    }
  }
}