import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export function Loading() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
      <ActivityIndicator className="text-blue-400" size={30}/>
    </SafeAreaView>
  )
}