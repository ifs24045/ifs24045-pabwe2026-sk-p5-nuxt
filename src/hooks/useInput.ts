import { ref, type Ref } from "vue";

export type UseInputReturn<T> = [
  Ref<T>,
  (eventOrValue: Event | T) => void,
  (value?: T) => void
];

/**
 * Hook untuk two-way binding input form.
 *
 * const [name, onNameChange, resetName] = useInput("");
 * <input :value="name" @input="onNameChange" />
 */
export function useInput<T = string>(initialValue: T): UseInputReturn<T> {
  const value = ref(initialValue) as Ref<T>;

  function handleChange(eventOrValue: Event | T): void {
    if (eventOrValue instanceof Event) {
      const target = eventOrValue.target as HTMLInputElement;
      value.value = target.value as unknown as T;
    } else {
      value.value = eventOrValue;
    }
  }

  function reset(newValue?: T): void {
    value.value = newValue ?? initialValue;
  }

  return [value, handleChange, reset];
}