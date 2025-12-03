<template>
  <div class="dropdown-list">
    <div
      v-for="item in items"
      :key="item[idKey]"
      class="dropdown-item"
      :class="{ 'is-selected': isSelected(item) }"
      @click="handleSelect(item)"
    >
      <i
        v-if="multiple"
        class="bi"
        :class="isSelected(item) ? 'bi-check-square-fill' : 'bi-square'"
        style="margin-right: 8px; font-size: 12px"
      ></i>

      <slot name="item" :item="item">
        {{ item[labelKey] }}
      </slot>

      <i v-if="!multiple && isSelected(item)" class="bi bi-check ms-auto"></i>
    </div>

    <div v-if="items.length === 0" class="no-results">
      <slot name="empty">No results</slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, required: true },
  selected: { type: [Object, Array], default: null },
  multiple: { type: Boolean, default: false },
  idKey: { type: String, default: 'id' },
  labelKey: { type: String, default: 'label' },
})

const emit = defineEmits(['select'])

const isSelected = (item) => {
  if (!props.selected) return false
  if (props.multiple && Array.isArray(props.selected)) {
    return props.selected.some((sel) => sel[props.idKey] === item[props.idKey])
  }
  return props.selected[props.idKey] === item[props.idKey]
}

const handleSelect = (item) => {
  emit('select', item)
}
</script>

<style scoped>
.dropdown-list {
  max-height: 220px;
  overflow-y: auto;
  flex-grow: 1;
}

.dropdown-list::-webkit-scrollbar {
  width: 6px;
}
.dropdown-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.dropdown-item {
  padding: 8px 10px;
  cursor: pointer;
  color: #ccc;
  display: flex;
  align-items: center;
  font-size: 13px;
}
.dropdown-item:hover {
  background: #333;
}
.dropdown-item.is-selected {
  background: #2a2e33;
  color: #fff;
  font-weight: 500;
}

.no-results {
  padding: 10px;
  color: #666;
  text-align: center;
  font-size: 14px;
}
</style>
