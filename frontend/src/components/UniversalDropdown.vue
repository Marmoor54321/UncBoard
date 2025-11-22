<template>
  <div class="dropdown-container" ref="root">
    <div class="dropdown-trigger" @click="toggle">
      <slot name="trigger"></slot>
    </div>

    <div v-if="open" class="dropdown-panel" :class="`placement-${placement}`">
      <input
        v-model="query"
        type="text"
        placeholder="Search..."
        class="dropdown-search"
        ref="searchInput"
      />

      <div class="dropdown-list">
        <div
          v-for="item in filtered"
          :key="item[idKey]"
          class="dropdown-item"
          :class="{ 'is-selected': isSelected(item) }"
          @click="selectItem(item)"
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

        <div v-if="!filtered.length" class="no-results">No results</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  labelKey: { type: String, default: 'label' },
  searchKey: { type: String, default: 'label' },
  idKey: { type: String, default: 'id' },
  multiple: { type: Boolean, default: false },
  selected: { type: [Object, Array], default: null },
  placement: { type: String, default: 'top' }, // 'bottom' lub 'top'
})

const emit = defineEmits(['select'])

const open = ref(false)
const query = ref('')
const root = ref(null)
const searchInput = ref(null)

const toggle = () => {
  open.value = !open.value
  if (open.value) {
    nextTick(() => searchInput.value?.focus())
  }
}

const filtered = computed(() =>
  props.items.filter((i) => i[props.searchKey].toLowerCase().includes(query.value.toLowerCase())),
)

const isSelected = (item) => {
  if (!props.selected) return false
  if (props.multiple && Array.isArray(props.selected)) {
    return props.selected.some((sel) => sel[props.idKey] === item[props.idKey])
  }
  return props.selected[props.idKey] === item[props.idKey]
}

const selectItem = (item) => {
  emit('select', item)
  if (!props.multiple) {
    open.value = false
    query.value = ''
  }
}

const handleClick = (e) => {
  if (root.value && !root.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClick))
onBeforeUnmount(() => document.removeEventListener('click', handleClick))
</script>

<style scoped>
.dropdown-container {
  position: relative;
  width: max-content;
  display: inline-block;
}

.dropdown-trigger {
  cursor: pointer;
  display: flex;
}

.dropdown-panel {
  position: absolute;
  left: 0;
  width: 260px;
  background: #222;
  border-radius: 8px;
  border: 1px solid #333;
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.4);
  z-index: 99;
  display: flex;
  flex-direction: column;
}

.placement-bottom {
  top: calc(100% + 6px);
  bottom: auto;
}

.placement-top {
  bottom: calc(100% + 6px);
  top: auto;
  box-shadow: 0 -4px 14px rgb(0 0 0 / 0.4);
}

.dropdown-search {
  width: 100%;
  padding: 8px;
  background: #111;
  border: none;
  border-bottom: 1px solid #333;
  color: white;
  outline: none;
  border-radius: 8px 8px 0 0;
}

.dropdown-list {
  max-height: 220px;
  overflow-y: auto;
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

.dropdown-list::-webkit-scrollbar {
  width: 6px;
}
.dropdown-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}
</style>
