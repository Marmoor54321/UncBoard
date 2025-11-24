<template>
  <Teleport to="body">
    <div v-if="activeMenu" class="dropdown-menu-custom popup" :style="menuStyle" @click.stop>
      
      <template v-if="activeMenu.startsWith('repo-')">
        <div class="dropdown-item-custom" @mouseenter="$emit('openPicker', $event)">
          Add to group
          <i class="bi bi-chevron-right float-end" style="font-size: 12px; margin-top: 4px;"></i>
        </div>
      </template>

      <template v-else>
        <div class="dropdown-item-custom" @mouseenter="$emit('openPicker', $event)">
           Add to group
           <i class="bi bi-chevron-right float-end" style="font-size: 12px; margin-top: 4px;"></i>
        </div>

        <div
          class="dropdown-item-custom"
          @click="$emit('deleteFromGroup')"
          @mouseenter="$emit('closePicker')"
        >
          Delete
        </div>
      </template>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="activePicker"
      class="group-picker-menu popup"
      :style="pickerStyle"
      @mouseenter="$emit('keepPickerOpen')"
      @mouseleave="$emit('closePicker')"
      @click.stop
    >
      <h6 class="text-white mb-2">Add to group</h6>
      <ul class="list-group">
        <li
          v-for="g in groupsList"
          :key="g._id"
          class="list-group-item list-group-item-action text-white"
          @click="$emit('pickerSelect', g._id)"
        >
          {{ g.name }}
        </li>
      </ul>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  activeMenu: String,
  menuStyle: Object,
  activePicker: String,
  pickerStyle: Object,
  groupsList: Array
})

defineEmits([
  'openPicker',
  'closePicker',
  'keepPickerOpen',
  'deleteFromGroup',
  'pickerSelect'
])
</script>

<style scoped>
.popup { position: fixed !important; z-index: 9999; }
.dropdown-menu-custom {
  background: #222; border: 1px solid #444; padding: 6px; border-radius: 6px; width: 150px;
}
.dropdown-item-custom { padding: 6px; color: #fff; cursor: pointer; border-radius: 4px; }
.dropdown-item-custom:hover { background: #444; border: 1px solid #aa50e7; }
.group-picker-menu {
  background: #222; border: 1px solid #444; padding: 10px; border-radius: 6px;
  width: 200px; max-height: 200px; overflow-y: auto; scrollbar-color: #303236 #1d1e20;
}
.list-group-item { background: #303236; border: none; cursor: pointer; }
.group-picker-menu .list-group-item:hover { background: #444 !important; border: 1px solid #aa50e7 !important; }
</style>