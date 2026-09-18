<template>
  <div ref="rootEl" class="relative">
    <button
      :id="id"
      type="button"
      class="field-input flex items-center justify-between text-left"
      :class="disabled ? 'cursor-not-allowed opacity-60' : ''"
      :disabled="disabled"
      @click="toggleOpen"
    >
      <span class="truncate" :class="modelValue ? '' : 'text-[#68736d]'">{{ selectedLabel || allLabel }}</span>
      <span class="ml-2 shrink-0 text-[#8a948d]">▾</span>
    </button>

    <div v-if="open" class="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-[#dfe5dc] bg-white shadow-lg">
      <div class="border-b border-[#edf0eb] p-2">
        <input
          ref="searchInputEl"
          v-model="query"
          type="text"
          class="field-input !min-h-9 text-sm"
          :placeholder="placeholder"
          autocomplete="off"
          @keydown="onKeydown"
        />
      </div>
      <ul class="max-h-56 overflow-auto py-1">
        <li
          v-for="(option, index) in filteredOptions"
          :key="option.id || '__all__'"
          class="cursor-pointer px-3 py-2 text-sm"
          :class="index === highlightedIndex ? 'bg-[#e4f0dd] text-[#203d30]' : 'text-[#3c453f]'"
          @mousedown.prevent="selectOption(option)"
          @mouseenter="highlightedIndex = index"
        >
          {{ option.label }}
        </li>
        <li v-if="!filteredOptions.length" class="px-3 py-2 text-sm text-[#8a948d]">Sonuç bulunamadı</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface SearchableSelectOption {
  id: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: SearchableSelectOption[];
    placeholder?: string;
    allLabel?: string;
    id?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: 'Ara...',
    allLabel: 'Tümü',
    id: undefined,
    disabled: false,
  },
);
const emit = defineEmits<{ 'update:modelValue': [string] }>();

const rootEl = ref<HTMLElement | null>(null);
const searchInputEl = ref<HTMLInputElement | null>(null);
const open = ref(false);
const query = ref('');
const highlightedIndex = ref(0);

const allOptions = computed<SearchableSelectOption[]>(() => [{ id: '', label: props.allLabel }, ...props.options]);

const selectedLabel = computed(() => allOptions.value.find((option) => option.id === props.modelValue)?.label ?? '');

const filteredOptions = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return allOptions.value;
  return allOptions.value.filter((option) => option.label.toLowerCase().includes(term));
});

async function toggleOpen() {
  if (props.disabled) return;
  open.value = !open.value;
  if (open.value) {
    query.value = '';
    const currentIndex = allOptions.value.findIndex((option) => option.id === props.modelValue);
    highlightedIndex.value = Math.max(0, currentIndex);
    await nextTick();
    searchInputEl.value?.focus();
  }
}

function closeDropdown() {
  open.value = false;
  query.value = '';
}

function selectOption(option: SearchableSelectOption) {
  emit('update:modelValue', option.id);
  closeDropdown();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const option = filteredOptions.value[highlightedIndex.value];
    if (option) selectOption(option);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeDropdown();
  }
}

function onClickOutside(event: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(event.target as Node)) {
    closeDropdown();
  }
}

watch(query, () => {
  highlightedIndex.value = 0;
});

onMounted(() => document.addEventListener('mousedown', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside));
</script>
