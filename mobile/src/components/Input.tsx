import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  KeyboardTypeOptions,
  Keyboard,
} from "react-native";
import { memo } from "react";

import { Picker } from "@react-native-picker/picker";

import { Ionicons, AntDesign } from "@expo/vector-icons";

type Props = {
  title?: string;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters" | undefined;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  maxLength?: number | undefined;
  keyboardType?: KeyboardTypeOptions | undefined;
  onKeyPress?: (e: { nativeEvent: { key: string } }) => void;
  icone?: any;
};

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  required?: boolean;
  error?: string | null;
  multiline?: boolean;
  maxLength?: number;
}

export function Input({
  title,
  placeholder,
  autoCapitalize,
  value,
  onChangeText,
  error,
  maxLength,
  keyboardType,
  onKeyPress,
}: Props) {
  return (
    <View className="relative mb-4 w-screen px-5 mt-3">
      <Text className="absolute -top-1.5 left-9 bg-neutral-900 px-2 text-xs text-gray-200 z-10 font-inter-extrabold">
        {title}
      </Text>
      <TextInput
        className="w-full h-16 border-2 border-zinc-700 rounded-lg px-4 py-2 text-gray-400 font-inter-black text-sm"
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onKeyPress={onKeyPress}
        value={value}
        onChangeText={onChangeText}
      />
      {error && <Text className="text-red-500 text-xs mt-1 pl-2">{error}</Text>}
    </View>
  );
}

export function PasswordInput({
  title,
  placeholder,
  autoCapitalize,
  value,
  onChangeText,
  error,
}: Props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View className="relative mb-4 mt-3">
      <Text className="absolute -top-1.5 left-4 bg-neutral-900 px-2 text-xs text-gray-200 font-inter-extrabold z-10">
        {title}
      </Text>
      <View className="flex flex-row items-center w-full h-16 border-2 border-zinc-700 rounded-lg px-3 py-2 text-base font-inter-bold text-gray-400">
        <TextInput
          className="flex-1 text-sm font-inter-black text-gray-400"
          placeholderTextColor="#9ca3af"
          placeholder={placeholder}
          secureTextEntry={!isPasswordVisible}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize}
          style={{ paddingVertical: 8 }}
        />

        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          className="ml-2"
        >
          <Ionicons
            name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#9ca3af"
          />
        </TouchableOpacity>
      </View>
      {error && <Text className="text-red-500 text-xs mt-1 pl-2">{error}</Text>}
    </View>
  );
}

interface VerifyCodeProps {
  codeLength?: number;
  onCodeFilled: (code: string) => void;
  autoFocus?: boolean;
}

export function VerificationCode({
  codeLength = 6,
  onCodeFilled,
  autoFocus = true,
}: VerifyCodeProps) {
  const [code, setCode] = useState(Array(codeLength).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    inputRefs.current = Array(codeLength).fill(null);
    if (autoFocus) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [codeLength, autoFocus]);

  useEffect(() => {
    const allFilled = code.every((digit) => digit !== "");
    if (allFilled) {
      onCodeFilled(code.join(""));
      Keyboard.dismiss();

      setTimeout(() => {
        setFocusedIndex(0);
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [code, codeLength, onCodeFilled]);

  useEffect(() => {
    inputRefs.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  const handleChangeText = (text: string, index: number) => {
    if (text.length > 0) {
      const newCode = [...code];
      newCode[index] = text.slice(-1);
      setCode(newCode);

      if (index < codeLength - 1) {
        setFocusedIndex(index + 1);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace") {
      const newCode = [...code];

      if (newCode[index] !== "") {
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        newCode[index - 1] = "";
        setCode(newCode);
        setFocusedIndex(index - 1);
      }
    }
  };

  const handleChangeEmpty = (text: string, index: number) => {
    if (text === "" && code[index] !== "") {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleInputPress = (index: number) => {
    setFocusedIndex(index);
    inputRefs.current[index]?.focus();
  };

  return (
    <View className="flex flex-row justify-center gap-4">
      {Array(codeLength)
        .fill(0)
        .map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleInputPress(index)}
            activeOpacity={0.8}
            className="h-14 w-14"
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              className="flex h-16 w-16 border-2 border-gray-300 pl-3 rounded-md text-center text-lg font-bold text-gray-500"
              maxLength={1}
              keyboardType="number-pad"
              value={code[index]}
              onChangeText={(text) => {
                if (text === "") {
                  handleChangeEmpty(text, index);
                } else {
                  handleChangeText(text, index);
                }
              }}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => handleFocus(index)}
              caretHidden={true}
              selectTextOnFocus
            />
          </TouchableOpacity>
        ))}
    </View>
  );
}

type PickerInputProps = {
  title: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  error?: string;
};

export function PickerInput({
  title,
  selectedValue,
  onValueChange,
  items,
  error,
}: PickerInputProps) {
  return (
    <View className="relative mb-4 w-screen px-5 mt-3">
      <Text className="absolute -top-1.5 left-9 bg-neutral-900 px-2 text-sm text-gray-200 z-10 font-inter-bold">
        {title}
      </Text>

      <View className="w-full h-16 border-2 border-zinc-800 rounded-lg  justify-center">
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={{
            color: "#d1d5db",
            fontSize: 16,
            fontFamily: "",
          }}
          dropdownIconColor="#d1d5db"
        >
          {items.map((item) => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
            />
          ))}
        </Picker>
      </View>

      {error && <Text className="text-red-500 text-xs mt-1 pl-2">{error}</Text>}
    </View>
  );
}

export function SearchInput({ value, onChangeText }: Props) {
  return (
    <View>
      <View className="w-full h-14 border-2 bg-neutral-800 border-zinc-800 flex-row items-center rounded-xl pl-5">
        <AntDesign name="search1" size={16} color="white" />
        <TextInput
          placeholder="PESQUISAR..."
          className="font-inter-bold text-sm w-full pl-2 text-gray-200"
          placeholderTextColor="#e5e7eb"
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}

export function PhoneInput({
  title,
  placeholder,
  value,
  onChangeText,
  error,
}: Props) {
  const [text, setText] = useState(value || "");

  const formatPhone = (input: string) => {
    let cleaned = input.replace(/\D/g, "");
    if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);

    if (cleaned.length <= 2) {
      return `(${cleaned}`;
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }

    return input;
  };

  const handleChange = (input: string) => {
    const formatted = formatPhone(input);
    setText(formatted);
    if (onChangeText) onChangeText(formatted);
  };

  return (
    <View className="relative mb-4 w-screen px-5 mt-3">
      <Text className="absolute -top-1.5 left-9 bg-neutral-900 px-2 text-xs text-gray-500 z-10 font-inter-extrabold">
        {title}
      </Text>
      <TextInput
        className="w-full h-16 border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-400 font-inter-black text-sm"
        placeholder={placeholder || "(11) 99999-9999"}
        placeholderTextColor="#9ca3af"
        keyboardType="phone-pad"
        value={text}
        onChangeText={handleChange}
      />
      {error && <Text className="text-red-500 text-xs mt-1 pl-2">{error}</Text>}
    </View>
  );
}

export const InputField = memo(
  ({
    maxLength,
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    keyboardType = "default",
    required = false,
    error = null,
    multiline = false,
  }: InputFieldProps) => {
    return (
      <View className="mb-5">
        <View className="flex-row items-center gap-3 mb-3">
          <View
            className={`w-7 h-7 rounded-lg items-center justify-center ${
              error
                ? "bg-red-500/15"
                : value
                  ? "bg-blue-500/15"
                  : "bg-gray-600/20"
            }`}
          >
            <Ionicons
              name={icon}
              size={16}
              color={error ? "#EF4444" : value ? "#3B82F6" : "#9CA3AF"}
            />
          </View>
          <Text className="text-white font-semibold text-base">
            {label}{" "}
            {required && <Text className="text-blue-400 font-bold">*</Text>}
          </Text>
        </View>

        <View className="relative">
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            keyboardType={keyboardType}
            multiline={multiline}
            maxLength={maxLength}
            numberOfLines={multiline ? 3 : 1}
            autoCorrect={false}
            autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
            blurOnSubmit={false}
            className={`rounded-xl px-4 py-4 text-white font-medium text-base border ${
              error
                ? "border-red-500/50 bg-red-500/5"
                : value
                  ? "border-blue-500/50 bg-blue-500/5"
                  : "border-gray-600/30 bg-gray-800/40"
            }`}
            style={{
              textAlignVertical: multiline ? "top" : "center",
              ...(value &&
                !error && {
                  shadowColor: "#3B82F6",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }),
            }}
          />

          {value && !error && (
            <View className="absolute right-3 top-1/2 -translate-y-2">
              <View className="w-5 h-5 bg-green-500/20 rounded-full items-center justify-center">
                <Ionicons name="checkmark" size={12} color="#10B981" />
              </View>
            </View>
          )}
        </View>

        {error && (
          <View className="flex-row items-center gap-2 mt-2">
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text className="text-red-400 font-medium text-sm">{error}</Text>
          </View>
        )}
      </View>
    );
  }
);
