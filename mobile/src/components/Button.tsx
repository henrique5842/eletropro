import { SafeAreaView, TouchableOpacity, Text } from "react-native";

type Props = {
  placeholder?: string
  onPress?: () => void
}

export function Button({ placeholder, onPress }: Props) {
  return (
    <SafeAreaView>
      <TouchableOpacity onPress={onPress} className="w-full h-16 bg-blue-500 items-center justify-center rounded-lg">
        <Text className="font-inter-black text-gray-100 text-xs">{placeholder}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
